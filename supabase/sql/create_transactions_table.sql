-- Create transactions table for tracking closed deals
-- This enables dataset growth and ARV/MAO model training

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  wholesaler_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  investor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  close_date DATE NOT NULL,
  close_price DECIMAL(12, 2) NOT NULL,
  rehab_cost DECIMAL(12, 2),
  rehab_duration_days INTEGER,
  after_repair_rent DECIMAL(10, 2),
  exit_type TEXT CHECK (exit_type IN ('rent', 'sale', 'flip', 'wholesale', 'other')),
  notes TEXT,
  wholesaler_confirmed BOOLEAN DEFAULT false,
  investor_confirmed BOOLEAN DEFAULT false,
  both_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create repair_inputs table for normalized checklist per listing
CREATE TABLE IF NOT EXISTS repair_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('exterior', 'interior', 'plumbing', 'electrical', 'hvac', 'roof', 'foundation', 'other')),
  item TEXT NOT NULL,
  estimated_cost DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  completed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_inputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
-- Users can view transactions they're involved in (as wholesaler or investor)
CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (
    auth.uid() = wholesaler_id OR 
    auth.uid() = investor_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Users can insert transactions for their own listings
CREATE POLICY "Users can create transactions for their listings" ON transactions
  FOR INSERT WITH CHECK (
    auth.uid() = wholesaler_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Only involved parties or admins can update
CREATE POLICY "Users can update their transactions" ON transactions
  FOR UPDATE USING (
    auth.uid() = wholesaler_id OR 
    auth.uid() = investor_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Only admins can delete transactions (for data integrity)
CREATE POLICY "Only admins can delete transactions" ON transactions
  FOR DELETE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- RLS Policies for repair_inputs
CREATE POLICY "Users can view repair inputs for their listings" ON repair_inputs
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM listings WHERE id = listing_id
    ) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can create repair inputs for their listings" ON repair_inputs
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM listings WHERE id = listing_id
    ) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can update repair inputs for their listings" ON repair_inputs
  FOR UPDATE USING (
    auth.uid() IN (
      SELECT user_id FROM listings WHERE id = listing_id
    ) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "Users can delete repair inputs for their listings" ON repair_inputs
  FOR DELETE USING (
    auth.uid() IN (
      SELECT user_id FROM listings WHERE id = listing_id
    ) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_listing_id ON transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wholesaler_id ON transactions(wholesaler_id);
CREATE INDEX IF NOT EXISTS idx_transactions_investor_id ON transactions(investor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_close_date ON transactions(close_date);
CREATE INDEX IF NOT EXISTS idx_transactions_both_confirmed ON transactions(both_confirmed_at) WHERE both_confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_repair_inputs_listing_id ON repair_inputs(listing_id);
CREATE INDEX IF NOT EXISTS idx_repair_inputs_transaction_id ON repair_inputs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_repair_inputs_category ON repair_inputs(category);

-- Function to automatically set both_confirmed_at when both parties confirm
CREATE OR REPLACE FUNCTION check_transaction_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wholesaler_confirmed = true AND NEW.investor_confirmed = true AND NEW.both_confirmed_at IS NULL THEN
    NEW.both_confirmed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set both_confirmed_at
CREATE TRIGGER transaction_confirmation_trigger
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION check_transaction_confirmation();

COMMENT ON TABLE transactions IS 'Tracks closed deals with confirmation from both wholesaler and investor';
COMMENT ON TABLE repair_inputs IS 'Normalized checklist of repairs per listing/transaction';


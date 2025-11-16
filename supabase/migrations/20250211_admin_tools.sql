-- Admin Tools Migration
-- Creates tables for user moderation, flags/reports, content moderation, and audit logs

-- User moderation fields (add to existing profiles table)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_at TIMESTAMPTZ NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banned_reason TEXT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by_admin BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_by_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Flags/Reports table
CREATE TABLE IF NOT EXISTS flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('listing', 'user', 'message', 'profile')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Content moderation actions
CREATE TABLE IF NOT EXISTS moderation_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  moderator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('suspend', 'ban', 'verify', 'unverify', 'delete_listing', 'hide_listing', 'warn')),
  target_type TEXT NOT NULL CHECK (target_type IN ('user', 'listing', 'message')),
  target_id UUID NOT NULL,
  reason TEXT,
  notes TEXT,
  duration_days INTEGER NULL, -- For temporary suspensions
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- System audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_flags_status ON flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_target ON flags(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_flags_reporter ON flags(reporter_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_target ON moderation_actions(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON moderation_actions(moderator_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(suspended) WHERE suspended = true;
CREATE INDEX IF NOT EXISTS idx_profiles_banned ON profiles(banned) WHERE banned = true;

-- Enable RLS
ALTER TABLE flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for flags
CREATE POLICY "Users can create flags" ON flags
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own flags" ON flags
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all flags" ON flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.segment = 'admin')
    )
  );

CREATE POLICY "Admins can update flags" ON flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.segment = 'admin')
    )
  );

-- RLS Policies for moderation_actions
CREATE POLICY "Admins can view moderation actions" ON moderation_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.segment = 'admin')
    )
  );

CREATE POLICY "Admins can create moderation actions" ON moderation_actions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.segment = 'admin')
    )
    AND auth.uid() = moderator_id
  );

-- RLS Policies for audit_logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.segment = 'admin')
    )
  );

CREATE POLICY "System can create audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true); -- Allow system to log all actions

-- Function to automatically update updated_at on flags
CREATE OR REPLACE FUNCTION update_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER flags_updated_at
  BEFORE UPDATE ON flags
  FOR EACH ROW
  EXECUTE FUNCTION update_flags_updated_at();


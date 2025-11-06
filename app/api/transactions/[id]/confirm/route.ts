import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/createSupabaseServer';

/**
 * POST /api/transactions/[id]/confirm
 * Confirm a transaction (wholesaler or investor)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactionId = params.id;

    // Get transaction
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (fetchError || !transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Verify user is involved in this transaction
    if (transaction.wholesaler_id !== user.id && transaction.investor_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only confirm transactions you are involved in' },
        { status: 403 }
      );
    }

    // Update confirmation status
    const updateData: Record<string, unknown> = {};
    if (transaction.wholesaler_id === user.id) {
      updateData.wholesaler_confirmed = true;
    }
    if (transaction.investor_id === user.id) {
      updateData.investor_confirmed = true;
    }

    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating transaction:', updateError);
      return NextResponse.json(
        { error: 'Failed to confirm transaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ transaction: updatedTransaction });
  } catch (error) {
    console.error('Error in transactions confirm:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify authorization header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create authenticated client to verify user
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData, error: roleError } = await supabaseAuth
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !roleData) {
      console.error('Not an admin:', user.id);
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    const { recovery_case_id, simulated_amount } = await req.json();

    if (!recovery_case_id) {
      return new Response(JSON.stringify({ error: 'recovery_case_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Simulating recovery attribution for case: ${recovery_case_id}`);

    // Use service role client for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the recovery case
    const { data: recoveryCase, error: findError } = await supabase
      .from('recovery_cases')
      .select('id, status, owner_user_id, amount_at_risk, currency, invoice_reference')
      .eq('id', recovery_case_id)
      .maybeSingle();

    if (findError) {
      console.error('Error finding recovery case:', findError.message);
      return new Response(JSON.stringify({ error: 'Failed to find recovery case' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!recoveryCase) {
      return new Response(JSON.stringify({ error: 'Recovery case not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (recoveryCase.status !== 'open') {
      return new Response(JSON.stringify({ 
        error: `Recovery case is already ${recoveryCase.status}`,
        current_status: recoveryCase.status
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a unique simulated event ID
    const simulatedEventId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = new Date().toISOString();

    // Update case to recovered
    const { error: updateError } = await supabase
      .from('recovery_cases')
      .update({
        status: 'recovered',
        resolved_at: now,
        updated_at: now,
      })
      .eq('id', recoveryCase.id)
      .eq('status', 'open'); // Idempotency check

    if (updateError) {
      console.error('Error updating recovery case:', updateError.message);
      return new Response(JSON.stringify({ error: 'Failed to update recovery case' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Recovery case ${recoveryCase.id} marked as recovered`);

    // Write to ledger
    const amountRecovered = simulated_amount ?? Number(recoveryCase.amount_at_risk);
    const invoiceReference = recoveryCase.invoice_reference || `sim_inv_${recoveryCase.id.slice(0, 8)}`;

    const { error: ledgerError } = await supabase
      .from('recovered_revenue_ledger')
      .insert({
        recovery_case_id: recoveryCase.id,
        owner_user_id: recoveryCase.owner_user_id,
        invoice_reference: invoiceReference,
        stripe_invoice_id: null,
        amount_recovered: amountRecovered,
        currency: recoveryCase.currency || 'USD',
        source_event_id: simulatedEventId,
        recovered_at: now,
        notes: 'Simulated recovery attribution (manual test)',
      });

    if (ledgerError) {
      // Check for unique constraint violation (idempotent)
      const isUniqueViolation = 
        ledgerError.code === '23505' || 
        ledgerError.message?.includes('unique') ||
        ledgerError.message?.includes('duplicate');
      
      if (isUniqueViolation) {
        console.log('Ledger entry already exists (idempotent skip)');
      } else {
        console.error('Ledger insert error:', ledgerError.message);
        // Don't fail the whole operation, case is already recovered
      }
    } else {
      console.log(`Ledger entry created: ${amountRecovered} ${recoveryCase.currency}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Recovery attribution simulated successfully',
      recovery_case_id: recoveryCase.id,
      amount_recovered: amountRecovered,
      currency: recoveryCase.currency || 'USD',
      simulated_event_id: simulatedEventId,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

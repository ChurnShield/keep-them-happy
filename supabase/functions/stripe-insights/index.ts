import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, cookie',
  'Access-Control-Allow-Credentials': 'true',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Get session ID from cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=');
        return [key, val.join('=')];
      })
    );

    const sessionId = cookies['stripe_session'];

    if (!sessionId) {
      console.log('No stripe_session cookie found');
      return new Response(JSON.stringify({ 
        error: 'No session found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get the Stripe access token for this session
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data: connection, error: dbError } = await supabase
      .from('stripe_connections')
      .select('access_token, stripe_user_id')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (dbError || !connection) {
      console.error('Database error or no connection:', dbError);
      return new Response(JSON.stringify({ 
        error: 'No Stripe connection found'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching Stripe data for account:', connection.stripe_user_id);

    // Calculate date 30 days ago
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);

    // Fetch failed charges from Stripe (last 30 days)
    const chargesResponse = await fetch(
      `https://api.stripe.com/v1/charges?limit=100&created[gte]=${thirtyDaysAgo}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Stripe-Account': connection.stripe_user_id,
        },
      }
    );

    if (!chargesResponse.ok) {
      const errorData = await chargesResponse.json();
      console.error('Stripe API error for charges:', errorData);
      
      // If the error is about permissions, return mock data as fallback
      if (chargesResponse.status === 403 || chargesResponse.status === 401) {
        console.log('Using mock data due to permission restrictions');
        return new Response(JSON.stringify({
          failedPayments: 0,
          estimatedRecoverable: 0,
          potentialChurnSaves: 0,
          currency: 'usd',
          failedCharges: [],
          message: 'Limited data access - please ensure Stripe Connect permissions are granted',
          isMockData: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const chargesData = await chargesResponse.json();
    console.log(`Fetched ${chargesData.data?.length || 0} charges from Stripe`);

    // Filter failed charges
    const failedCharges = chargesData.data?.filter((charge: any) => 
      charge.status === 'failed' || charge.paid === false
    ) || [];

    console.log(`Found ${failedCharges.length} failed charges`);

    // Calculate totals
    const totalFailedAmount = failedCharges.reduce((sum: number, charge: any) => 
      sum + (charge.amount || 0), 0
    );

    // Get unique customers with failed payments
    const uniqueCustomers = new Set(
      failedCharges
        .map((charge: any) => charge.customer)
        .filter((c: any) => c != null)
    );

    // Also fetch invoices with open or uncollectible status
    const invoicesResponse = await fetch(
      `https://api.stripe.com/v1/invoices?limit=100&status=open&created[gte]=${thirtyDaysAgo}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Stripe-Account': connection.stripe_user_id,
        },
      }
    );

    let openInvoicesAmount = 0;
    let openInvoicesCount = 0;

    if (invoicesResponse.ok) {
      const invoicesData = await invoicesResponse.json();
      console.log(`Fetched ${invoicesData.data?.length || 0} open invoices`);
      
      openInvoicesCount = invoicesData.data?.length || 0;
      openInvoicesAmount = invoicesData.data?.reduce((sum: number, invoice: any) => 
        sum + (invoice.amount_due || 0), 0
      ) || 0;
    }

    // Fetch uncollectible invoices too
    const uncollectibleResponse = await fetch(
      `https://api.stripe.com/v1/invoices?limit=100&status=uncollectible&created[gte]=${thirtyDaysAgo}`,
      {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Stripe-Account': connection.stripe_user_id,
        },
      }
    );

    if (uncollectibleResponse.ok) {
      const uncollectibleData = await uncollectibleResponse.json();
      console.log(`Fetched ${uncollectibleData.data?.length || 0} uncollectible invoices`);
      
      openInvoicesCount += uncollectibleData.data?.length || 0;
      openInvoicesAmount += uncollectibleData.data?.reduce((sum: number, invoice: any) => 
        sum + (invoice.amount_due || 0), 0
      ) || 0;
    }

    // Total recoverable amount (in cents)
    const totalRecoverable = totalFailedAmount + openInvoicesAmount;
    const currency = failedCharges[0]?.currency || 'usd';

    const insights = {
      failedPayments: failedCharges.length + openInvoicesCount,
      estimatedRecoverable: totalRecoverable, // in cents
      potentialChurnSaves: uniqueCustomers.size,
      currency: currency,
      failedCharges: failedCharges.slice(0, 10).map((c: any) => ({
        id: c.id,
        amount: c.amount,
        currency: c.currency,
        created: c.created,
        failure_message: c.failure_message,
        customer: c.customer,
      })),
      isMockData: false,
    };

    console.log('Returning insights:', {
      failedPayments: insights.failedPayments,
      estimatedRecoverable: insights.estimatedRecoverable,
      potentialChurnSaves: insights.potentialChurnSaves,
    });

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in stripe-insights:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

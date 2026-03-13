import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, reference } = await req.json();

    if (!phone || !amount) {
      return new Response(JSON.stringify({ error: "Phone and amount required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MPESA_CONSUMER_KEY = Deno.env.get("MPESA_CONSUMER_KEY");
    const MPESA_CONSUMER_SECRET = Deno.env.get("MPESA_CONSUMER_SECRET");
    const MPESA_PASSKEY = Deno.env.get("MPESA_PASSKEY");
    const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE") || "174379";
    const MPESA_ENV = Deno.env.get("MPESA_ENV") || "sandbox";

    const baseUrl = MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    // If M-Pesa credentials aren't configured, simulate success
    if (!MPESA_CONSUMER_KEY || !MPESA_CONSUMER_SECRET || !MPESA_PASSKEY) {
      console.log(`[M-Pesa Simulation] STK Push to ${phone} for KSh ${amount}, ref: ${reference}`);
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: `M-Pesa STK push simulated for ${phone}. Amount: KSh ${amount}`,
          receipt: `SIM${Date.now().toString(36).toUpperCase()}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get OAuth token
    const authString = btoa(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`);
    const tokenRes = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${authString}` },
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      throw new Error("Failed to get M-Pesa access token");
    }

    // Generate timestamp and password
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");
    const password = btoa(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const callbackUrl = `${SUPABASE_URL}/functions/v1/mpesa-callback`;

    // STK Push
    const stkRes = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: callbackUrl,
        AccountReference: reference || "URBANPUNK",
        TransactionDesc: "Ticket Payment",
      }),
    });

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === "0") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "STK push sent to your phone. Enter your M-Pesa PIN.",
          checkoutRequestId: stkData.CheckoutRequestID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error(stkData.errorMessage || stkData.ResponseDescription || "STK push failed");
  } catch (error) {
    console.error("M-Pesa STK Push error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "M-Pesa error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

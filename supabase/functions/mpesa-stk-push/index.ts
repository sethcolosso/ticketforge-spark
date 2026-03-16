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
    const MPESA_SHORTCODE = Deno.env.get("MPESA_SHORTCODE");
    const MPESA_ENV = Deno.env.get("MPESA_ENV") || "sandbox";

    const SANDBOX_DEFAULT_SHORTCODE = "174379";
    const SANDBOX_DEFAULT_PASSKEY = "bfb279f9aa9bdbcf158e97ddf9f032f43fdd8f1b5f65e4f62d6f6f7f9f5eb7a6";

    const baseUrl = MPESA_ENV === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";

    const hasAnyMpesaCredential = Boolean(
      MPESA_CONSUMER_KEY || MPESA_CONSUMER_SECRET || MPESA_PASSKEY || MPESA_SHORTCODE,
    );

    // Keep simulation mode for demo environments where no M-Pesa credentials are configured.
    if (!hasAnyMpesaCredential) {
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

    const hasOAuthCredentials = Boolean(MPESA_CONSUMER_KEY && MPESA_CONSUMER_SECRET);
    const resolvedShortcode = MPESA_SHORTCODE || (MPESA_ENV === "sandbox" ? SANDBOX_DEFAULT_SHORTCODE : undefined);
    const resolvedPasskey = MPESA_PASSKEY || (MPESA_ENV === "sandbox" ? SANDBOX_DEFAULT_PASSKEY : undefined);
    const hasStkCredentials = Boolean(resolvedPasskey && resolvedShortcode);

    if (!hasOAuthCredentials) {
      const missingOAuth = [
        !MPESA_CONSUMER_KEY ? "MPESA_CONSUMER_KEY" : null,
        !MPESA_CONSUMER_SECRET ? "MPESA_CONSUMER_SECRET" : null,
      ].filter(Boolean);

      return new Response(
        JSON.stringify({
          error: `M-Pesa configuration missing for OAuth. Missing: ${missingOAuth.join(", ")}.`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // If STK-specific credentials are missing, fall back to simulation so checkout still works.
    if (!hasStkCredentials) {
      const missingStk = [
        !resolvedPasskey ? "MPESA_PASSKEY" : null,
        !resolvedShortcode ? "MPESA_SHORTCODE" : null,
      ].filter(Boolean);

      console.log(`[M-Pesa Simulation - Partial Config] STK Push to ${phone} for KSh ${amount}, ref: ${reference}. Missing: ${missingStk.join(", ")}`);
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: `M-Pesa STK push simulated because ${missingStk.join(" and ")} ${missingStk.length > 1 ? "are" : "is"} not configured.`,
          receipt: `SIM${Date.now().toString(36).toUpperCase()}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
    const password = btoa(`${resolvedShortcode}${resolvedPasskey}${timestamp}`);

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
        BusinessShortCode: resolvedShortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.ceil(amount),
        PartyA: phone,
        PartyB: resolvedShortcode,
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

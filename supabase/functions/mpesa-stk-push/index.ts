import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DARAJA_BASE_URL = "https://sandbox.safaricom.co.ke"; // Change to https://api.safaricom.co.ke for production
const BUSINESS_SHORT_CODE = "174379"; // Sandbox shortcode
const PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"; // Sandbox passkey
const CALLBACK_URL = `${Deno.env.get("SUPABASE_URL")}/functions/v1/mpesa-callback`;

async function getAccessToken(): Promise<string> {
  const consumerKey = Deno.env.get("MPESA_CONSUMER_KEY");
  const consumerSecret = Deno.env.get("MPESA_CONSUMER_SECRET");

  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa consumer key or secret not configured");
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const res = await fetch(
    `${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to get M-Pesa access token: ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

function generateTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, amount, reference } = await req.json();

    if (!phone || !amount) {
      return new Response(
        JSON.stringify({ error: "Phone and amount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone: 0712... → 254712..., +254... → 254...
    let normalizedPhone = phone.toString().replace(/\s+/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "254" + normalizedPhone.slice(1);
    } else if (normalizedPhone.startsWith("+")) {
      normalizedPhone = normalizedPhone.slice(1);
    }

    const timestamp = generateTimestamp();
    const password = btoa(`${BUSINESS_SHORT_CODE}${PASSKEY}${timestamp}`);

    const accessToken = await getAccessToken();

    const stkPayload = {
      BusinessShortCode: BUSINESS_SHORT_CODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(Number(amount)),
      PartyA: normalizedPhone,
      PartyB: BUSINESS_SHORT_CODE,
      PhoneNumber: normalizedPhone,
      CallBackURL: CALLBACK_URL,
      AccountReference: reference || "URBANPUNK",
      TransactionDesc: "Ticket Payment",
    };

    const stkRes = await fetch(
      `${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stkPayload),
      }
    );

    const stkData = await stkRes.json();

    if (stkData.ResponseCode === "0") {
      return new Response(
        JSON.stringify({
          success: true,
          message: "STK Push sent. Check your phone to complete payment.",
          CheckoutRequestID: stkData.CheckoutRequestID,
          MerchantRequestID: stkData.MerchantRequestID,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: stkData.errorMessage || stkData.ResponseDescription || "STK Push failed",
          details: stkData,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("M-Pesa STK Push error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "M-Pesa STK Push error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

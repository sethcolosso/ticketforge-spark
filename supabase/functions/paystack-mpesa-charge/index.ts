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
    const { email, phone, amount, reference } = await req.json();

    if (!email || !phone || !amount) {
      return new Response(JSON.stringify({ error: "Email, phone and amount are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY");
    const PAYSTACK_ENV = Deno.env.get("PAYSTACK_ENV") || "test";

    // Demo fallback when Paystack secret is absent.
    if (!PAYSTACK_SECRET_KEY) {
      return new Response(
        JSON.stringify({
          success: true,
          simulated: true,
          message: `Lipa na M-Pesa STK simulated for ${phone}`,
          reference: reference || `SIM-${Date.now().toString(36).toUpperCase()}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const normalizedPhone = phone.startsWith("+") ? phone : `+${phone}`;

    const payload = {
      email,
      amount: Math.ceil(Number(amount) * 100),
      reference: reference || `PS-${Date.now().toString(36).toUpperCase()}`,
      currency: "KES",
      channels: ["mobile_money"],
      mobile_money: {
        phone: normalizedPhone,
        provider: "mpesa",
      },
      metadata: {
        payment_channel: "lipa_na_mpesa",
        provider: "paystack",
        environment: PAYSTACK_ENV,
      },
    };

    const initRes = await fetch("https://api.paystack.co/charge", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const initData = await initRes.json();

    if (!initRes.ok || !initData.status) {
      throw new Error(initData?.message || "Unable to initiate Paystack Lipa na M-Pesa charge");
    }

    return new Response(
      JSON.stringify({
        success: true,
        simulated: false,
        message: "Lipa na M-Pesa request sent. Complete the prompt on your phone.",
        provider: "paystack",
        reference: initData?.data?.reference,
        status: initData?.data?.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Paystack M-Pesa charge error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Paystack charge error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

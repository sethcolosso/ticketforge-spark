import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const body = await req.json();
    console.log("M-Pesa callback received:", JSON.stringify(body));

    const callback = body?.Body?.stkCallback;
    if (!callback) {
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callback;

    let mpesaReceipt: string | null = null;
    if (ResultCode === 0 && callback.CallbackMetadata?.Item) {
      const receiptItem = callback.CallbackMetadata.Item.find(
        (i: any) => i.Name === "MpesaReceiptNumber"
      );
      mpesaReceipt = receiptItem?.Value || null;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update mpesa_payments record
    const { data: payment } = await supabase
      .from("mpesa_payments")
      .update({
        status: ResultCode === 0 ? "completed" : "failed",
        result_code: ResultCode,
        result_desc: ResultDesc,
        mpesa_receipt: mpesaReceipt,
      })
      .eq("checkout_request_id", CheckoutRequestID)
      .select("order_id")
      .single();

    // If payment successful, confirm the order
    if (ResultCode === 0 && payment?.order_id) {
      await supabase
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", payment.order_id);
    }

    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Accepted" }), {
      headers: { "Content-Type": "application/json" },
    });
  }
});

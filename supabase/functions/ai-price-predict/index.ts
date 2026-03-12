import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const ticketInfo = (event.ticket_types || []).map((t: any) =>
      `${t.name}: $${t.price}, ${t.quantity_sold}/${t.quantity_available} sold`
    ).join("; ");

    const daysUntil = Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const systemPrompt = `You are a ticket price prediction AI for URBANPUNK. Analyze ticket data and predict price trends.
Consider: days until event, sell-through rate, category popularity, and capacity.
Return a brief, actionable prediction.`;

    const userPrompt = `Event: "${event.title}"
Category: ${event.category}
Date: ${event.date} (${daysUntil} days away)
Location: ${event.location}
Tickets: ${ticketInfo}
Capacity: ${event.capacity || "Not specified"}
Is Featured: ${event.is_featured}

Predict if ticket demand/prices will likely rise, stay stable, or fall. Give a confidence level (high/medium/low) and a 1-2 sentence explanation.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "price_prediction",
            description: "Return price prediction",
            parameters: {
              type: "object",
              properties: {
                trend: { type: "string", enum: ["rising", "stable", "falling"] },
                confidence: { type: "string", enum: ["high", "medium", "low"] },
                explanation: { type: "string" },
              },
              required: ["trend", "confidence", "explanation"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "price_prediction" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits depleted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let prediction = { trend: "stable", confidence: "low", explanation: "Unable to predict." };
    if (toolCall?.function?.arguments) {
      prediction = JSON.parse(toolCall.function.arguments);
    }

    return new Response(JSON.stringify({ prediction }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("predict error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

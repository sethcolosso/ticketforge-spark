import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { events, userHistory, userQuery } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const eventPool = Array.isArray(events) ? events : [];

    const fallbackRecommendations = () => {
      const query = String(userQuery || "").toLowerCase().trim();
      const scored = eventPool
        .map((event: any) => {
          const title = String(event?.title || "").toLowerCase();
          const category = String(event?.category || "").toLowerCase();
          const location = String(event?.location || "").toLowerCase();
          const dateMs = Number.isFinite(new Date(event?.date).getTime()) ? new Date(event?.date).getTime() : Number.MAX_SAFE_INTEGER;
          let score = 0;
          if (!query) score += 1;
          if (query && (title.includes(query) || category.includes(query) || location.includes(query))) score += 5;
          if (event?.minPrice !== undefined && event?.minPrice !== null) score += 1;
          return { event, score, dateMs };
        })
        .sort((a, b) => (b.score - a.score) || (a.dateMs - b.dateMs))
        .slice(0, 3)
        .map(({ event }: any) => ({
          slug: event.slug,
          reason: query
            ? `Matches your interest in ${query}.`
            : `Popular ${event.category || "event"} coming up soon.`,
        }));

      return new Response(JSON.stringify({ recommendations: scored, source: "fallback" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    };

    if (!LOVABLE_API_KEY) {
      console.warn("LOVABLE_API_KEY not configured. Returning fallback recommendations.");
      return fallbackRecommendations();
    }

    const eventList = (events || []).map((e: any) => 
      `- "${e.title}" (${e.category}, ${e.date}, ${e.location}, from $${e.minPrice})`
    ).join("\n");

    const historyText = (userHistory || []).length > 0
      ? `User previously attended: ${userHistory.map((h: any) => h.title).join(", ")}`
      : "No previous purchase history.";

    const queryText = userQuery ? `User is searching for: "${userQuery}"` : "";

    const systemPrompt = `You are an event recommendation AI for URBANPUNK, an urban event ticketing platform. 
Based on the available events and user context, recommend the top 3 most relevant events.
Return a JSON array of objects with: { "slug": string, "reason": string (1 short sentence) }
Only return the JSON array, nothing else.`;

    const userPrompt = `Available events:\n${eventList}\n\n${historyText}\n${queryText}\n\nRecommend 3 events.`;

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
            name: "recommend_events",
            description: "Return recommended events",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      slug: { type: "string" },
                      reason: { type: "string" },
                    },
                    required: ["slug", "reason"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["recommendations"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "recommend_events" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return fallbackRecommendations();
    }

    const result = await response.json();
    const toolCall = result.choices?.[0]?.message?.tool_calls?.[0];
    let recommendations = [];
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      recommendations = parsed.recommendations || [];
    }

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("recommend error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

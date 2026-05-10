// AI Trip Generator – calls an OpenAI-compatible AI gateway.
// Returns a structured trip itinerary (stops + activities) from a free-form prompt.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are a world-class travel planner. Given a user's wish, produce a realistic multi-city itinerary.
Return STRICT JSON only matching this schema:
{
  "name": string,
  "description": string,
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "budget": number (USD total),
  "stops": [
    {
      "city": string,
      "country": string,
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "costs": { "transport": number, "stay": number, "meals": number },
      "activities": [
        { "name": string, "category": "sightseeing"|"food"|"adventure"|"culture"|"nightlife"|"shopping"|"nature", "cost": number, "durationHours": number, "time": "HH:MM" }
      ]
    }
  ]
}
Rules: 2-5 stops, 2-5 activities per stop, dates must be sequential and not overlap, costs in USD. No markdown, no commentary.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: `AI error: ${txt.slice(0, 200)}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "Empty AI response" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let trip;
    try {
      trip = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      trip = match ? JSON.parse(match[0]) : null;
    }
    if (!trip || !Array.isArray(trip.stops)) {
      return new Response(JSON.stringify({ error: "AI returned invalid format" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ trip }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

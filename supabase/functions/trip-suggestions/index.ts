// Streams real-time AI suggestions (packing, tips, must-see) for a trip destination.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM = `You are an expert travel advisor. Given a destination/trip, give SHORT, practical, real-time suggestions.
Use Markdown. Always include these sections with emoji headers:

### 🎒 What to Pack
- 5-8 destination-specific items (climate, terrain, culture aware)

### 🧭 Must-Do Experiences
- 4-6 iconic things to do or see

### 🍽️ Local Food to Try
- 3-5 dishes/drinks

### ⚠️ Important Tips & Warnings
- 3-5 safety, cultural, weather, or visa tips

Be specific to the destination (not generic). Keep bullets concise (one line each).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { destination, startDate, endDate, stops } = await req.json();
    if (!destination || typeof destination !== "string") {
      return new Response(JSON.stringify({ error: "Missing destination" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = [
      `Trip: ${destination}`,
      startDate && endDate ? `Dates: ${startDate} to ${endDate}` : "",
      Array.isArray(stops) && stops.length ? `Stops: ${stops.join(", ")}` : "",
      "Give me real-time, destination-specific suggestions.",
    ].filter(Boolean).join("\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Workspace settings." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok || !res.body) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: `AI error: ${txt.slice(0, 200)}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pass through the SSE stream from the gateway directly.
    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

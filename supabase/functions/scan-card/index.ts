import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a trading card identification expert. Analyze the card image and extract all available information. You must call the extract_card_info function with the results.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:image/jpeg;base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Identify this trading card. Extract the card name, set/expansion name, card number, rarity, condition estimate, and any other relevant details like edition, language, or card type (Pokemon, Yu-Gi-Oh, Magic, Sports, etc).",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_card_info",
              description: "Extract structured trading card information from the image",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Full card name" },
                  set: { type: "string", description: "Set or expansion name" },
                  number: { type: "string", description: "Card number (e.g. 4/102, LOB-005)" },
                  rarity: { type: "string", description: "Card rarity (Common, Uncommon, Rare, Ultra Rare, etc)" },
                  cardType: { type: "string", description: "Card game type (Pokemon, Yu-Gi-Oh, Magic: The Gathering, Sports, etc)" },
                  year: { type: "string", description: "Year of release if identifiable" },
                  condition: { type: "string", description: "Estimated condition (Mint, Near Mint, Excellent, Good, Fair, Poor)" },
                  edition: { type: "string", description: "Edition info (1st Edition, Unlimited, etc)" },
                  language: { type: "string", description: "Language of the card" },
                },
                required: ["name", "set", "number"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_card_info" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const cardInfo = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ cardInfo }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ cardInfo: { name: "", set: "", number: "" } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("scan-card error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export const aiChat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messages: ChatMessage[]; model?: string }) => {
    if (!data || !Array.isArray(data.messages)) throw new Error("messages required");
    return { messages: data.messages, model: data.model ?? "google/gemini-2.5-flash" };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ model: data.model, messages: data.messages }),
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error(`AI gateway ${res.status}: ${text}`);
    }
    const json = (await res.json()) as any;
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    return { content };
  });

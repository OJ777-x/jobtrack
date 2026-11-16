import Anthropic from "@anthropic-ai/sdk";

// Cheap & fast by design — the brief calls for small prompts on a cheap
// model, with every feature degrading gracefully to "demo mode" (deterministic,
// data-driven text) when no API key is configured.
const MODEL = "claude-haiku-4-5";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function askClaude({
  system,
  prompt,
  maxTokens = 512,
}: {
  system: string;
  prompt: string;
  maxTokens?: number;
}): Promise<string> {
  const client = new Anthropic();

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  return textBlock && textBlock.type === "text" ? textBlock.text.trim() : "";
}

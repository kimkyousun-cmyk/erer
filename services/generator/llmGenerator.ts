import type { GeneratorInput, GeneratorResult, IGenerator } from "@/services/generator/generatorTypes";

// This is a safe placeholder. We do not call external APIs from this environment.
// In production, replace this with a vetted LLM client and strict JSON-only parsing.
export class LLMGenerator implements IGenerator {
  async generateIssue(_input: GeneratorInput): Promise<GeneratorResult> {
    const hasKey = Boolean(process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY);
    if (!hasKey) {
      throw new Error("LLM API key not configured");
    }

    throw new Error("LLM generator is not wired in this runtime. Use MockGenerator or integrate a server-side client.");
  }
}

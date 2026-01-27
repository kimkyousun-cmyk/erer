import { logger } from "@/lib/log";
import type { IGenerator } from "@/services/generator/generatorTypes";
import { LLMGenerator } from "@/services/generator/llmGenerator";
import { MockGenerator } from "@/services/generator/mockGenerator";

export function getGenerator(): IGenerator {
  const mode = (process.env.GENERATOR_MODE ?? "mock").toLowerCase();
  const hasKey = Boolean(process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY);

  if (mode === "llm" && hasKey) {
    logger.info("generator.mode", { mode: "llm" });
    return new LLMGenerator();
  }

  if (mode === "llm" && !hasKey) {
    logger.warn("generator.mode_fallback", {
      requested: "llm",
      reason: "Missing LLM_API_KEY/OPENAI_API_KEY"
    });
  }

  logger.info("generator.mode", { mode: "mock" });
  return new MockGenerator();
}

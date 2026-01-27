import type { IssueOutput } from "@/lib/validation/generator";

export type SensitivityLevel = "SAFE" | "CAUTIOUS";

export interface GeneratorInput {
  seedText: string;
  tags: string[];
  sensitivity: SensitivityLevel;
}

export interface GeneratorResult {
  output: IssueOutput;
  modelName: string;
  rawText?: string;
}

export interface IGenerator {
  generateIssue(input: GeneratorInput): Promise<GeneratorResult>;
}

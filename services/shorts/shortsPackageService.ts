import { sanitizeSeedText } from "@/lib/safety/seedSafety";
import { clamp } from "@/lib/utils";
import { issueOutputSchema } from "@/lib/validation/generator";
import { shortsPackageSchema, type ShortsPackage } from "@/lib/validation/shorts";
import { computeIssueScores } from "@/services/aggregation/issueAggregation";
import { getGenerator } from "@/services/generator/generatorFactory";

const characterDesign =
  "a single consistent chibi character with soft pastel outfit, rounded features, gentle lighting, no text, no watermark";

function parseTags(tags: string) {
  return tags
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
    .slice(0, 6);
}

function dominantEmotionLabel(scores: { anger: number; humor: number; division: number }) {
  if (scores.division >= scores.anger && scores.division >= scores.humor) return "분열";
  if (scores.anger >= scores.humor) return "분노";
  return "밈";
}

function pickGender(scores: { anger: number; humor: number; division: number }): "남성" | "여성" {
  return scores.humor >= scores.anger ? "여성" : "남성";
}

function makeHook(scores: { anger: number; humor: number; division: number }) {
  if (scores.division > 75) return "지금 다 갈라짐";
  if (scores.anger > 72) return "선 넘었다고?";
  return "이건 밈 됨";
}

function compactTitle(title: string) {
  const stripped = title.replace(/\s+/g, " ").trim();
  return stripped.length <= 20 ? stripped : `${stripped.slice(0, 18).trim()}…`;
}

function buildScript(input: {
  title: string;
  contextSummary: string;
  verdictLine: string;
  dominant: string;
}) {
  const base =
    `${input.title} 이슈, 사실보다 감정이 먼저 터졌어요. ` +
    `${input.contextSummary} ` +
    `핵심 분위기는 '${input.verdictLine}' 쪽. ` +
    `지금 인터넷은 ${input.dominant} 감정으로 읽고 있어요. ` +
    `당신은 이 반응, 과하다고 봐요 아니면 당연하다고 봐요?`;

  const target = clamp(base.length, 240, 260);
  if (base.length >= 240 && base.length <= 270) return base;
  if (base.length < 240) {
    return `${base} 이건 단순 기능 논쟁이 아니라 태도 논쟁이에요.`.slice(0, 268);
  }
  return base.slice(0, target);
}

function phaseScenes(input: { title: string; contextSummary: string; verdictLine: string }) {
  return [
    `이슈 소개: ${input.title}`,
    "트리거 순간: 작은 장면이 감정을 폭발시킴",
    "초반 반응: 웃음과 분노가 동시에 올라옴",
    "에스컬레이션: 찬반이 정체성 전쟁으로 번짐",
    `피크: '${input.verdictLine}' 감정으로 프레이밍 고정`,
    "갈라진 시선: 같은 장면을 다르게 해석",
    "지금 분위기: 논리보다 기분이 앞서는 상태",
    "질문: 당신의 감정은 어느 쪽에 가까움?"
  ];
}

function toPrompts(scenes: string[]) {
  return scenes.map((scene, idx) => ({
    frame_number: idx + 1,
    scene_description: scene,
    prompt:
      "chibi illustration, soft pastel palette, high contrast, clean composition, " +
      `${characterDesign}, scene: ${scene}, no text, no watermark, 9:16 vertical`,
    character: "female" as const,
    emotion: idx < 2 ? "curious" : idx < 5 ? "tense" : idx < 7 ? "divided" : "inviting",
    background_color: idx % 2 === 0 ? "lavender" : "midnight blue"
  }));
}

function hashtagsFrom(tags: string[], dominant: string) {
  const base = tags.map((t) => `#${t.replace(/\s+/g, "")}`);
  const mood = dominant === "분열" ? "#논쟁중" : dominant === "분노" ? "#분위기폭발" : "#밈각";
  return Array.from(new Set(["#EmotionRadar", mood, ...base])).slice(0, 10);
}

function thumbnailText(verdictLine: string) {
  const options = [
    "지금 분위기",
    "다들 갈라짐",
    "이건 선 넘음",
    "밈 vs 분노",
    verdictLine.slice(0, 18)
  ];
  return Array.from(new Set(options)).slice(0, 5);
}

function buildPackage(input: {
  id: string;
  title: string;
  contextSummary: string;
  verdictLine: string;
  tags: string[];
  scores: { anger: number; humor: number; division: number };
}) {
  const dominant = dominantEmotionLabel(input.scores);
  const scenes = phaseScenes({
    title: input.title,
    contextSummary: input.contextSummary,
    verdictLine: input.verdictLine
  });

  const pkg: ShortsPackage = {
    id: input.id,
    title: compactTitle(input.title),
    hook_text: makeHook(input.scores),
    gender: pickGender(input.scores),
    script: {
      full_text: buildScript({
        title: input.title,
        contextSummary: input.contextSummary,
        verdictLine: input.verdictLine,
        dominant
      })
    },
    image_prompts: toPrompts(scenes),
    metadata: {
      category: input.tags[0] ?? "culture",
      target_emotion: dominant,
      comment_inducing_question: "이 반응, 과한 걸까 아니면 당연한 걸까?",
      hashtags: hashtagsFrom(input.tags, dominant),
      thumbnail_text: thumbnailText(input.verdictLine)
    }
  };

  return shortsPackageSchema.parse(pkg);
}

export async function generateShortsPackageFromIssue(issueId: string): Promise<ShortsPackage> {
  const { prisma } = await import("@/lib/db/prisma");
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      timelineEvents: { orderBy: { order: "asc" } },
      reactions: true
    }
  });

  if (!issue) throw new Error("Issue not found");
  if (issue.status !== "PUBLISHED") {
    throw new Error("Shorts export is only available for published issues");
  }

  const agg = await computeIssueScores(issue);
  const tags = parseTags(issue.tags);

  return buildPackage({
    id: issue.id,
    title: issue.title,
    contextSummary: issue.contextSummary,
    verdictLine: issue.verdictLine,
    tags,
    scores: { anger: agg.anger, humor: agg.humor, division: agg.division }
  });
}

export async function generateShortsPackageFromSeed(seedText: string) {
  const sanitized = sanitizeSeedText(seedText);
  if (!sanitized.sanitizedText) {
    throw new Error("Seed is empty after sanitization");
  }

  const generator = getGenerator();
  const result = await generator.generateIssue({
    seedText: sanitized.sanitizedText,
    tags: [],
    sensitivity: "SAFE"
  });

  const parsed = issueOutputSchema.parse(result.output);
  return buildPackage({
    id: `seed:${parsed.title}`,
    title: parsed.title,
    contextSummary: parsed.contextSummary,
    verdictLine: parsed.verdictLine,
    tags: parsed.tags.map((t) => t.toLowerCase()),
    scores: {
      anger: parsed.angerScore,
      humor: parsed.humorScore,
      division: parsed.divisionScore
    }
  });
}

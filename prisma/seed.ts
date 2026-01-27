import { prisma } from "../lib/db/prisma";
import type { Prisma } from "@prisma/client";

type DominantEmotion = "ANGER" | "HUMOR" | "DIVISION" | "MIXED";
type IssueStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED" | "ARCHIVED";
type TimelinePhase = "TRIGGER" | "ESCALATION" | "PEAK" | "COOLING";
type ReactionEmotionType = "ANGER" | "HUMOR" | "DIVISION" | "SUPPORT" | "NEUTRAL";

interface SeedIssueInput {
  slug: string;
  title: string;
  contextSummary: string;
  verdictLine: string;
  dominantEmotion: DominantEmotion;
  angerScore: number;
  humorScore: number;
  divisionScore: number;
  tags: string[];
  status: IssueStatus;
  publishedAt?: Date;
  timelineEvents: Array<{
    phase: TimelinePhase;
    label: string;
    detail: string;
    order: number;
  }>;
  reactions: Array<{
    emotionType: ReactionEmotionType;
    text: string;
    intensity: number;
  }>;
}

function issueData(input: SeedIssueInput): Prisma.IssueCreateInput {
  return {
    slug: input.slug,
    title: input.title,
    contextSummary: input.contextSummary,
    verdictLine: input.verdictLine,
    dominantEmotion: input.dominantEmotion,
    angerScore: input.angerScore,
    humorScore: input.humorScore,
    divisionScore: input.divisionScore,
    tags: input.tags.join(","),
    status: input.status,
    publishedAt: input.publishedAt,
    timelineEvents: {
      create: input.timelineEvents.map((event) => ({
        phase: event.phase,
        label: event.label,
        detail: event.detail,
        order: event.order
      }))
    },
    reactions: {
      create: input.reactions.map((reaction) => ({
        emotionType: reaction.emotionType,
        text: reaction.text,
        intensity: reaction.intensity
      }))
    }
  };
}

const now = new Date();

const seedIssues: SeedIssueInput[] = [
  {
    slug: "algorithmic-waitlist",
    title: "A Waitlist Algorithm Starts Ranking People Publicly",
    contextSummary:
      "A new service shows live ranks for people waiting on access. Some call it transparent; others call it anxiety as a feature.",
    verdictLine: "Performance culture meets public scoring",
    dominantEmotion: "DIVISION",
    angerScore: 68,
    humorScore: 41,
    divisionScore: 86,
    tags: ["product", "culture", "ranking"],
    status: "PUBLISHED",
    publishedAt: now,
    timelineEvents: [
      {
        phase: "TRIGGER",
        label: "Trigger",
        detail: "Screenshots of live ranks spread with captions like 'we are gamifying patience now.'",
        order: 0
      },
      {
        phase: "ESCALATION",
        label: "Escalation",
        detail: "Fans framed it as radical transparency; critics called it a manufactured stress loop.",
        order: 1
      },
      {
        phase: "PEAK",
        label: "Peak Reaction",
        detail: "The debate turned into a referendum on whether motivation and manipulation are now the same thing.",
        order: 2
      },
      {
        phase: "COOLING",
        label: "Cooling",
        detail: "Interest cools until another leaderboard clip resurfaces and reopens the argument.",
        order: 3
      }
    ],
    reactions: [
      { emotionType: "ANGER", text: "Public ranking is not a user benefit.", intensity: 4 },
      { emotionType: "DIVISION", text: "I hate this but I also want to see my rank.", intensity: 3 },
      { emotionType: "HUMOR", text: "This app is literally 'stress as a service.'", intensity: 3 },
      { emotionType: "SUPPORT", text: "At least it is honest about the queue.", intensity: 2 },
      { emotionType: "DIVISION", text: "Transparency without dignity is still a loss.", intensity: 4 },
      { emotionType: "NEUTRAL", text: "The idea is simple; the feeling it creates is not.", intensity: 2 },
      { emotionType: "ANGER", text: "We keep rewarding systems that make people feel small.", intensity: 5 },
      { emotionType: "HUMOR", text: "Can't wait to compare waitlist ranks like fantasy scores.", intensity: 2 },
      { emotionType: "DIVISION", text: "This depends on whether you see queues as logistics or identity.", intensity: 4 }
    ]
  },
  {
    slug: "campus-quiet-hours-ai",
    title: "An AI Enforces Quiet Hours in Shared Housing",
    contextSummary:
      "A pilot program uses sound detection to flag noise violations. Some see peace; others see algorithmic tattling.",
    verdictLine: "Calm promised, surveillance felt",
    dominantEmotion: "ANGER",
    angerScore: 79,
    humorScore: 36,
    divisionScore: 73,
    tags: ["ai", "housing", "privacy"],
    status: "PUBLISHED",
    publishedAt: now,
    timelineEvents: [
      {
        phase: "TRIGGER",
        label: "Trigger",
        detail: "A short clip showed residents getting warnings within seconds of laughing too loudly.",
        order: 0
      },
      {
        phase: "ESCALATION",
        label: "Escalation",
        detail: "Supporters called it fairness; critics called it guilt-by-decibel.",
        order: 1
      },
      {
        phase: "PEAK",
        label: "Peak Reaction",
        detail: "The program became a symbol for 'automation replacing neighborly negotiation.'",
        order: 2
      },
      {
        phase: "COOLING",
        label: "Cooling",
        detail: "Discussion cools until new stories of false positives appear.",
        order: 3
      }
    ],
    reactions: [
      { emotionType: "ANGER", text: "The problem is noise; the feeling is policing.", intensity: 5 },
      { emotionType: "DIVISION", text: "I want quiet, but not like this.", intensity: 4 },
      { emotionType: "HUMOR", text: "Imagine whispering to avoid the AI hall monitor.", intensity: 3 },
      { emotionType: "SUPPORT", text: "People begged for quiet hours and no one listened.", intensity: 3 },
      { emotionType: "ANGER", text: "Automation keeps winning because it is cheaper than empathy.", intensity: 4 },
      { emotionType: "NEUTRAL", text: "The feature solves one conflict by creating another.", intensity: 2 },
      { emotionType: "DIVISION", text: "This will be loved by people who never get flagged.", intensity: 4 },
      { emotionType: "HUMOR", text: "This is the loudest quiet hours announcement ever.", intensity: 2 }
    ]
  },
  {
    slug: "auto-reply-graduation",
    title: "Auto-Replies Start Sending 'Congrats' Messages for You",
    contextSummary:
      "A messaging platform offers a feature that sends automatic celebration notes for life milestones. Some feel supported; others feel replaced.",
    verdictLine: "Convenience collides with sincerity",
    dominantEmotion: "MIXED",
    angerScore: 54,
    humorScore: 69,
    divisionScore: 71,
    tags: ["social", "product", "etiquette"],
    status: "PUBLISHED",
    publishedAt: now,
    timelineEvents: [
      {
        phase: "TRIGGER",
        label: "Trigger",
        detail: "People noticed that celebration messages looked eerily identical across different friend groups.",
        order: 0
      },
      {
        phase: "ESCALATION",
        label: "Escalation",
        detail: "The conversation shifted from 'funny bug' to 'are we automating care now?'.",
        order: 1
      },
      {
        phase: "PEAK",
        label: "Peak Reaction",
        detail: "The feature became a mirror for how thin social rituals already feel online.",
        order: 2
      },
      {
        phase: "COOLING",
        label: "Cooling",
        detail: "The jokes keep circulating even as outrage fades.",
        order: 3
      }
    ],
    reactions: [
      { emotionType: "HUMOR", text: "We outsourced 'proud of you' to a button.", intensity: 4 },
      { emotionType: "DIVISION", text: "This is either thoughtful scaling or emotional fraud.", intensity: 4 },
      { emotionType: "SUPPORT", text: "For people who forget, this could actually help.", intensity: 3 },
      { emotionType: "ANGER", text: "Automated warmth still feels cold.", intensity: 3 },
      { emotionType: "NEUTRAL", text: "The feature reveals a demand: people want to show up but lack time.", intensity: 2 },
      { emotionType: "HUMOR", text: "My auto-reply is more consistent than I am.", intensity: 3 },
      { emotionType: "DIVISION", text: "Some rituals survive automation. Others do not.", intensity: 3 },
      { emotionType: "ANGER", text: "We keep optimizing away the human part.", intensity: 4 }
    ]
  },
  {
    slug: "city-sunlight-tax",
    title: "A City Proposes a 'Sunlight Access' Tax for Tall Buildings",
    contextSummary:
      "A policy proposal would charge developers who block sunlight in dense neighborhoods. Some call it justice; others call it fantasy math.",
    verdictLine: "Fairness framed as physics",
    dominantEmotion: "DIVISION",
    angerScore: 63,
    humorScore: 38,
    divisionScore: 82,
    tags: ["policy", "urban", "fairness"],
    status: "DRAFT",
    timelineEvents: [
      {
        phase: "TRIGGER",
        label: "Trigger",
        detail: "A diagram showing shadow maps went viral with captions about 'paying rent for sunlight now.'",
        order: 0
      },
      {
        phase: "ESCALATION",
        label: "Escalation",
        detail: "Advocates framed it as reclaiming public good; skeptics framed it as symbolic policy theater.",
        order: 1
      },
      {
        phase: "PEAK",
        label: "Peak Reaction",
        detail: "The idea became a proxy debate about who cities are built for and who gets left in the shade.",
        order: 2
      },
      {
        phase: "COOLING",
        label: "Cooling",
        detail: "It cools as a technical detail fight, but returns whenever housing stress spikes.",
        order: 3
      }
    ],
    reactions: [
      { emotionType: "DIVISION", text: "This sounds fake until you live in the shadow.", intensity: 4 },
      { emotionType: "ANGER", text: "Developers shouldn't bill the sky and then block it.", intensity: 4 },
      { emotionType: "HUMOR", text: "Next up: premium air subscriptions.", intensity: 2 },
      { emotionType: "SUPPORT", text: "This is one of the few policies that feels human-scale.", intensity: 3 },
      { emotionType: "NEUTRAL", text: "The math is messy but the feeling is clear: people want dignity in density.", intensity: 2 },
      { emotionType: "DIVISION", text: "Fairness policies get called naive right before they become normal.", intensity: 3 },
      { emotionType: "ANGER", text: "If we can price parking, we can price sunlight loss.", intensity: 3 },
      { emotionType: "HUMOR", text: "The sun just entered the chat and wants royalties.", intensity: 2 }
    ]
  },
  {
    slug: "school-feedback-streaks",
    title: "Schools Pilot 'Feedback Streaks' for Homework",
    contextSummary:
      "A new classroom tool rewards students for maintaining streaks of teacher feedback. Some see motivation; others see burnout loops.",
    verdictLine: "Motivation systems are never neutral",
    dominantEmotion: "ANGER",
    angerScore: 72,
    humorScore: 33,
    divisionScore: 77,
    tags: ["education", "gamification", "wellbeing"],
    status: "PUBLISHED",
    publishedAt: now,
    timelineEvents: [
      {
        phase: "TRIGGER",
        label: "Trigger",
        detail: "Students posted screenshots of streak counters dropping to zero after a missed assignment.",
        order: 0
      },
      {
        phase: "ESCALATION",
        label: "Escalation",
        detail: "Teachers said it encouraged consistency; students said it punished complexity.",
        order: 1
      },
      {
        phase: "PEAK",
        label: "Peak Reaction",
        detail: "The tool became a symbol for 'turning learning into dashboards.'",
        order: 2
      },
      {
        phase: "COOLING",
        label: "Cooling",
        detail: "Debate cools between semesters, then returns when new streak screenshots appear.",
        order: 3
      }
    ],
    reactions: [
      { emotionType: "ANGER", text: "Streaks teach fear of breaking streaks.", intensity: 5 },
      { emotionType: "DIVISION", text: "Some students thrive on streaks; others drown in them.", intensity: 4 },
      { emotionType: "SUPPORT", text: "Consistent feedback is good; the streak wrapper is optional.", intensity: 3 },
      { emotionType: "HUMOR", text: "School app: your anxiety has a leaderboard now.", intensity: 3 },
      { emotionType: "NEUTRAL", text: "The system optimizes for visible effort, not invisible struggle.", intensity: 2 },
      { emotionType: "ANGER", text: "We keep confusing engagement metrics with care.", intensity: 4 },
      { emotionType: "DIVISION", text: "Motivation tools always reward the already-resourced first.", intensity: 4 },
      { emotionType: "HUMOR", text: "My streak is impressive if you ignore reality.", intensity: 2 }
    ]
  }
];

async function upsertIssue(input: SeedIssueInput) {
  await prisma.issue.deleteMany({ where: { slug: input.slug } });

  await prisma.issue.create({
    data: issueData(input)
  });
}

async function seedAdminUsers() {
  await prisma.adminUser.upsert({
    where: { email: "owner@emotionradar.dev" },
    update: { role: "OWNER" },
    create: { email: "owner@emotionradar.dev", role: "OWNER" }
  });

  await prisma.adminUser.upsert({
    where: { email: "editor@emotionradar.dev" },
    update: { role: "EDITOR" },
    create: { email: "editor@emotionradar.dev", role: "EDITOR" }
  });
}

async function seedAppSetting() {
  const existing = await prisma.appSetting.findFirst();
  if (existing) return;

  await prisma.appSetting.create({
    data: {
      n8nWebhookUrl: null,
      shortsWebhookSecret: process.env.SHORTS_WEBHOOK_SECRET ?? "dev-short-secret-change-me",
      siteName: "Emotion Radar",
      brandColor: "#7c5cff"
    }
  });
}

async function seedUsers() {
  const freeUser = await prisma.user.upsert({
    where: { email: "free@emotionradar.dev" },
    update: {},
    create: { email: "free@emotionradar.dev" }
  });

  const proUser = await prisma.user.upsert({
    where: { email: "pro@emotionradar.dev" },
    update: {},
    create: { email: "pro@emotionradar.dev" }
  });

  await prisma.subscription.deleteMany({ where: { userId: freeUser.id } });
  await prisma.subscription.deleteMany({ where: { userId: proUser.id } });

  await prisma.subscription.createMany({
    data: [
      { userId: freeUser.id, plan: "FREE", status: "ACTIVE" },
      { userId: proUser.id, plan: "PRO", status: "ACTIVE" }
    ]
  });
}

async function seedSeedQueue() {
  await prisma.seedItem.deleteMany();

  await prisma.seedItem.createMany({
    data: [
      {
        text: "A school replaces detentions with public behavior scoreboards.",
        sourceType: "MANUAL",
        status: "PENDING"
      },
      {
        text: "A delivery app starts charging extra for 'nice weather' days.",
        sourceType: "MANUAL",
        status: "PENDING"
      },
      {
        text: "A streaming platform auto-skips emotional scenes by default.",
        sourceType: "MANUAL",
        status: "PENDING"
      },
      {
        text: "A city proposes a limit on billboard brightness after midnight.",
        sourceType: "MANUAL",
        status: "PENDING"
      },
      {
        text: "A workplace introduces 'focus alarms' that notify your team when you break concentration.",
        sourceType: "MANUAL",
        status: "PENDING"
      }
    ]
  });
}

async function main() {
  for (const issue of seedIssues) {
    await upsertIssue(issue);
  }

  await seedAdminUsers();
  await seedAppSetting();
  await seedUsers();
  await seedSeedQueue();

  // eslint-disable-next-line no-console
  console.log(`Seeded ${seedIssues.length} issues, admin users, app settings, users/subscriptions, and seed queue.`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error("Seeding failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

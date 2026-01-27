import type { IssueSeed } from "@/lib/types";

export const seedIssues: IssueSeed[] = [
  {
    slug: "drone-delivery-curfew",
    title: "Drone Deliveries Get a Curfew",
    context:
      "A major city limited late-night drone drop-offs after noise complaints. Convenience fans feel punished; others say it was overdue.",
    trigger:
      "A viral clip of buzzing drones hovering outside apartment windows at 2 AM reignited noise and privacy complaints.",
    tags: ["tech", "city-life", "policy"],
    drivers: {
      novelty: 0.62,
      moralViolation: 0.58,
      identityConflict: 0.71,
      humorPotential: 0.44
    },
    baselineVelocity: 0.78,
    timeline: [
      {
        key: "trigger",
        label: "Trigger",
        summary:
          "Night footage spread fast: drones circling bedrooms felt invasive, not futuristic.",
        intensity: 72
      },
      {
        key: "escalation",
        label: "Escalation",
        summary:
          "Delivery fans framed it as anti-innovation. Neighborhood groups organized screenshots and petitions.",
        intensity: 81
      },
      {
        key: "peak",
        label: "Peak Reaction",
        summary:
          "The curfew announcement turned the debate into a culture clash: convenience vs. basic peace.",
        intensity: 88
      },
      {
        key: "cooling",
        label: "Cooling Phase",
        summary:
          "Attention is cooling, but every new drone clip reopens the fight.",
        intensity: 49
      }
    ],
    baggage: [
      "People already feel cities optimize for companies over residents.",
      "Noise complaints have become a proxy war about who gets to shape urban life."
    ],
    culturalContext: [
      "Automation fatigue meets housing anxiety.",
      "Tech convenience now competes directly with sleep and privacy."
    ]
  },
  {
    slug: "ai-narrator-game-update",
    title: "Game Update Adds an AI Narrator",
    context:
      "A popular online game introduced an optional AI narrator voice. Some love the accessibility; others say it cheapens the art.",
    trigger:
      "A patch note promised \"dynamic narration\" and the first wave of clips showed awkward but funny voice lines.",
    tags: ["gaming", "ai", "creativity"],
    drivers: {
      novelty: 0.83,
      moralViolation: 0.41,
      identityConflict: 0.64,
      humorPotential: 0.9
    },
    baselineVelocity: 0.74,
    timeline: [
      {
        key: "trigger",
        label: "Trigger",
        summary:
          "Players posted clips of the narrator misreading fantasy names, and the internet laughed first.",
        intensity: 77
      },
      {
        key: "escalation",
        label: "Escalation",
        summary:
          "Voice actors weighed in indirectly, shifting the conversation from jokes to livelihoods.",
        intensity: 82
      },
      {
        key: "peak",
        label: "Peak Reaction",
        summary:
          "The debate split cleanly: accessibility win vs. creative erosion.",
        intensity: 86
      },
      {
        key: "cooling",
        label: "Cooling Phase",
        summary:
          "People keep sharing the funniest lines, but the outrage wave is tapering.",
        intensity: 55
      }
    ],
    baggage: [
      "AI-in-art debates already carry years of resentment.",
      "Gaming communities are used to fighting over what counts as \"authentic.\""
    ],
    culturalContext: [
      "Accessibility arguments now compete with creator economy fears.",
      "Memes spread faster than nuance, but nuance decides the long tail."
    ]
  },
  {
    slug: "live-ranked-final-exams",
    title: "Final Exams Go Live-Ranked",
    context:
      "A university piloted live leaderboards during finals week. Supporters call it motivating; critics call it a public stress test.",
    trigger:
      "Screenshots of a real-time ranking board from a lecture hall triggered a wave of \"this is dystopian\" reactions.",
    tags: ["education", "performance", "culture"],
    drivers: {
      novelty: 0.7,
      moralViolation: 0.67,
      identityConflict: 0.76,
      humorPotential: 0.52
    },
    baselineVelocity: 0.81,
    timeline: [
      {
        key: "trigger",
        label: "Trigger",
        summary:
          "The leaderboard screenshot felt like turning private anxiety into a spectator sport.",
        intensity: 79
      },
      {
        key: "escalation",
        label: "Escalation",
        summary:
          "Some students said it pushed them to focus; others described it as a panic amplifier.",
        intensity: 85
      },
      {
        key: "peak",
        label: "Peak Reaction",
        summary:
          "The internet framed it as a symbol of performance culture eating everything.",
        intensity: 91
      },
      {
        key: "cooling",
        label: "Cooling Phase",
        summary:
          "Debate cools between semesters, then spikes whenever new screenshots appear.",
        intensity: 52
      }
    ],
    baggage: [
      "School stress is already an emotional powder keg.",
      "Public ranking taps into existing fears about surveillance and worthiness."
    ],
    culturalContext: [
      "Meritocracy discourse is emotionally charged, not neutral.",
      "People project their own school trauma onto new systems quickly."
    ]
  }
];

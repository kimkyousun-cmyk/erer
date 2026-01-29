export interface IssueCollection {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

export const issueCollections: IssueCollection[] = [
  {
    slug: "automation-and-trust",
    title: "Automation & Trust",
    description: "Where convenience collides with consent, oversight, and human judgment.",
    tags: ["ai", "privacy", "work", "product"]
  },
  {
    slug: "city-pressure",
    title: "City Pressure",
    description: "Urban tradeoffs: density, policy, and the emotional price of space.",
    tags: ["policy", "city-life", "housing"]
  },
  {
    slug: "learning-loops",
    title: "Learning Loops",
    description: "Education debates shaped by metrics, motivation systems, and care.",
    tags: ["education", "gamification", "wellbeing"]
  },
  {
    slug: "social-rituals",
    title: "Social Rituals",
    description: "What happens when care, etiquette, and platforms drift apart.",
    tags: ["social", "culture", "etiquette"]
  }
];

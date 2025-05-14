export const questions = [
  {
    id: 1,
    text: "I can recognize my emotions as they happen.",
    category: "Self-awareness"
  },
  {
    id: 2,
    text: "I lose my temper when I feel frustrated.",
    category: "Self-regulation",
    reversed: true // Higher score for disagreement
  },
  {
    id: 3,
    text: "I can understand why other people feel the way they do.",
    category: "Empathy"
  },
  {
    id: 4,
    text: "I find it hard to stay motivated when working towards a goal.",
    category: "Motivation",
    reversed: true
  },
  {
    id: 5,
    text: "I am good at handling disagreements with others.",
    category: "Social skills"
  },
  {
    id: 6,
    text: "I often pause to think about my feelings before acting.",
    category: "Self-regulation"
  },
  {
    id: 7,
    text: "I find it difficult to see things from another person's perspective.",
    category: "Empathy",
    reversed: true
  },
  {
    id: 8,
    text: "I am optimistic about achieving my goals, even when facing challenges.",
    category: "Motivation"
  },
  {
    id: 9,
    text: "I am aware of how my words and actions affect others.",
    category: "Social skills"
  },
  {
    id: 10,
    text: "When I'm upset, I have trouble controlling my reactions.",
    category: "Self-regulation",
    reversed: true
  }
];

export const options = [
  { id: 'a', text: "Strongly Disagree", value: 1 },
  { id: 'b', text: "Disagree", value: 2 },
  { id: 'c', text: "Agree", value: 3 },
  { id: 'd', text: "Strongly Agree", value: 4 },
];

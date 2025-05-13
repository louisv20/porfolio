// src/services/reportService.js
const getScoreTier = (score) => {
  if (score <= 20) return "developing emotional intelligence";
  if (score <= 31) return "proficient emotional intelligence";
  return "masterful emotional intelligence";
};

const formatCategoryInsights = (categoryScores) => {
  const insights = [];
  
  Object.entries(categoryScores).forEach(([category, score]) => {
    let insight = `${category}: ${score}% - `;
    
    if (score < 50) {
      insight += "This is an area for growth. ";
      if (category === "Self-awareness") {
        insight += "Try daily reflection exercises to better understand your emotions.";
      } else if (category === "Self-regulation") {
        insight += "Practice pausing before reacting in emotional situations.";
      } else if (category === "Empathy") {
        insight += "Work on actively listening and imagining others' perspectives.";
      } else if (category === "Motivation") {
        insight += "Set small, achievable goals to build momentum and confidence.";
      } else if (category === "Social skills") {
        insight += "Practice effective communication in low-pressure situations first.";
      }
    } else if (score < 75) {
      insight += "You show good competence in this area. ";
      if (category === "Self-awareness") {
        insight += "Continue developing by connecting emotions to physical sensations.";
      } else if (category === "Self-regulation") {
        insight += "Work on developing strategies for your most challenging triggers.";
      } else if (category === "Empathy") {
        insight += "Practice with people who are different from you to expand your empathic range.";
      } else if (category === "Motivation") {
        insight += "Try connecting daily tasks to your deeper values and purpose.";
      } else if (category === "Social skills") {
        insight += "Focus on navigating difficult conversations with greater confidence.";
      }
    } else {
      insight += "This is an area of strength for you. ";
      if (category === "Self-awareness") {
        insight += "Consider mentoring others in developing their emotional vocabulary.";
      } else if (category === "Self-regulation") {
        insight += "You can now focus on helping others develop this skill.";
      } else if (category === "Empathy") {
        insight += "Your natural empathy makes you well-suited for conflict resolution.";
      } else if (category === "Motivation") {
        insight += "Consider how you can inspire and motivate those around you.";
      } else if (category === "Social skills") {
        insight += "You can leverage this strength in leadership and team-building contexts.";
      }
    }
    
    insights.push(insight);
  });
  
  return insights.join("\n\n");
};

const generatePersonalizedPlan = (categoryScores) => {
  const lowestCategory = Object.entries(categoryScores).reduce(
    (lowest, current) => {
      return current[1] < lowest[1] ? current : lowest;
    },
    ["", 100]
  );
  
  let plan = `Based on your results, we recommend focusing first on improving your ${lowestCategory[0]} skills.\n\n`;
  
  if (lowestCategory[0] === "Self-awareness") {
    plan += "Weekly Exercise: At the end of each day, write down three emotions you experienced and what triggered them.";
  } else if (lowestCategory[0] === "Self-regulation") {
    plan += "Weekly Exercise: Practice the 5-second pause before responding in situations that typically trigger strong emotions.";
  } else if (lowestCategory[0] === "Empathy") {
    plan += "Weekly Exercise: When someone shares a problem, focus only on understanding their perspective before offering any advice.";
  } else if (lowestCategory[0] === "Motivation") {
    plan += "Weekly Exercise: Set one small goal each day and celebrate completing it to build positive momentum.";
  } else if (lowestCategory[0] === "Social skills") {
    plan += "Weekly Exercise: Practice active listening in conversations by summarizing what others have said before responding.";
  }
  
  plan += "\n\nRecommended Schedule: Spend 15 minutes each day on these exercises for the next 30 days, then reassess.";
  
  return plan;
};

const generateDetailedReport = (userData) => {
  const { score, categoryScores, email } = userData;
  
  const report = {
    recipientEmail: email,
    subject: "Your Detailed Emotional Intelligence Report",
    scoreData: {
      overallScore: score,
      categoryBreakdown: categoryScores,
    },
    sections: [
      {
        title: "Understanding Your EQ Score",
        content: `Your overall EQ score is ${score}, which indicates ${getScoreTier(score)}.`,
      },
      {
        title: "Category Breakdown",
        content: formatCategoryInsights(categoryScores),
      },
      {
        title: "Personalized Development Plan",
        content: generatePersonalizedPlan(categoryScores),
      },
      {
        title: "Next Steps",
        content: "We recommend reassessing your EQ in 3-6 months to track your progress.",
      },
    ],
    resourceLinks: [
      { title: "EQ in the Workplace", url: "https://example.com/eq-workplace" },
      { title: "Emotional Intelligence Exercises", url: "https://example.com/eq-exercises" },
      { title: "Recommended Reading", url: "https://example.com/eq-books" },
    ],
  };
  
  console.log("Report generated for:", email);
  return report;
};

module.exports = { generateDetailedReport };
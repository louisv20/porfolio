// src/services/reportService.js
const getScoreTier = (score) => {
  if (score <= 20) return "developing emotional intelligence";
  if (score <= 31) return "proficient emotional intelligence";
  return "masterful emotional intelligence";
};

const getScoreType = (score) => {
  if (score <= 20) return "Developing EQ";
  if (score <= 31) return "Proficient EQ";
  return "Masterful EQ";
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

const generateStrengthsAnalysis = (categoryScores) => {
  const strengths = Object.entries(categoryScores)
    .filter(([_, score]) => score >= 75)
    .map(([category]) => category);
  
  if (strengths.length === 0) {
    return "While you don't have any categories that score as exceptionally strong yet, your EQ assessment shows potential for growth. Focus on the development plan to build your emotional intelligence competencies.";
  }
  
  let analysis = `Your assessment reveals notable strengths in ${strengths.join(', ')}. `;
  
  if (strengths.includes("Self-awareness")) {
    analysis += "Your high self-awareness allows you to accurately recognize your emotions and understand how they affect your thoughts and behavior. This foundation enables better decision-making and self-management. ";
  }
  
  if (strengths.includes("Self-regulation")) {
    analysis += "Your ability to regulate emotions effectively helps you stay calm under pressure, adapt to change, and maintain control in challenging situations. This skill is particularly valuable in high-stress environments. ";
  }
  
  if (strengths.includes("Empathy")) {
    analysis += "Your empathic abilities enable you to understand others' perspectives and emotions, making you particularly effective in building rapport and navigating social situations. This strength can be leveraged in leadership and relationship-building. ";
  }
  
  if (strengths.includes("Motivation")) {
    analysis += "Your high motivation indicates strong internal drive and resilience. You likely pursue goals with energy and persistence, and can bounce back from setbacks more readily than others. ";
  }
  
  if (strengths.includes("Social skills")) {
    analysis += "Your advanced social skills help you navigate complex interpersonal dynamics, influence others effectively, and build strong relationships. This is a particularly valuable skill set for leadership and teamwork. ";
  }
  
  return analysis;
};

const generateGrowthOpportunities = (categoryScores) => {
  const growthAreas = Object.entries(categoryScores)
    .filter(([_, score]) => score < 60)
    .sort(([_, scoreA], [__, scoreB]) => scoreA - scoreB)
    .map(([category]) => category);
  
  if (growthAreas.length === 0) {
    return "Your assessment shows balanced development across all EQ categories. To continue your growth, consider pushing into more challenging emotional intelligence scenarios that test the boundaries of your current capabilities.";
  }
  
  let opportunities = `Based on your assessment, focusing on ${growthAreas.join(' and ')} would yield the most significant improvements in your overall emotional intelligence. `;
  
  if (growthAreas.includes("Self-awareness")) {
    opportunities += "Developing greater self-awareness begins with regular reflection and mindfulness practices. Consider keeping an emotion journal to track patterns in your emotional responses. ";
  }
  
  if (growthAreas.includes("Self-regulation")) {
    opportunities += "Improving self-regulation involves developing specific strategies for managing emotional triggers. Techniques like deep breathing, cognitive reframing, and creating healthy outlets for emotions can be particularly effective. ";
  }
  
  if (growthAreas.includes("Empathy")) {
    opportunities += "Enhancing empathy requires active practice in perspective-taking. Try dedicating focused attention to understanding others' experiences without immediately relating them back to your own. ";
  }
  
  if (growthAreas.includes("Motivation")) {
    opportunities += "Building intrinsic motivation comes from connecting daily activities to meaningful personal values and goals. Clarifying your core values and creating a personal mission statement can help strengthen this area. ";
  }
  
  if (growthAreas.includes("Social skills")) {
    opportunities += "Developing stronger social skills involves practicing effective communication techniques and expanding your comfort zone in social situations. Consider joining groups or activities that require collaborative interaction. ";
  }
  
  return opportunities;
};

const generateDetailedReport = (userData) => {
  const { score, categoryScores, email, name } = userData;
  const scoreType = getScoreType(score);
  
  const report = {
    recipientEmail: email,
    recipientName: name || email.split('@')[0],
    subject: "Your Detailed Emotional Intelligence Report",
    scoreType: scoreType,
    scoreData: {
      overallScore: score,
      categoryBreakdown: categoryScores,
    },
    sections: [
      {
        title: "Understanding Your EQ Score",
        content: `Your overall EQ score is ${score}, which indicates ${getScoreTier(score)}. Emotional intelligence is the ability to understand and manage your emotions, as well as recognize and influence the emotions of others. Your score reflects your current emotional intelligence capabilities across five key dimensions.`
      },
      {
        title: "Category Breakdown",
        content: formatCategoryInsights(categoryScores)
      },
      {
        title: "Strengths Analysis",
        content: generateStrengthsAnalysis(categoryScores)
      },
      {
        title: "Growth Opportunities",
        content: generateGrowthOpportunities(categoryScores)
      },
      {
        title: "Personalized Development Plan",
        content: generatePersonalizedPlan(categoryScores)
      },
      {
        title: "Practical Applications",
        content: "Developing your emotional intelligence can have significant benefits in multiple areas of your life:\n\n• Work: Better collaboration, leadership potential, and conflict resolution\n\n• Relationships: Deeper connections, improved communication, and greater empathy\n\n• Personal Wellbeing: Reduced stress, better resilience, and increased self-awareness\n\nApply your learnings from this assessment to real-world situations, and make a habit of reflecting on emotional aspects of your daily interactions."
      },
      {
        title: "Next Steps",
        content: "We recommend reassessing your EQ in 3-6 months to track your progress. In the meantime, focus on implementing your personalized development plan and exploring the resources below."
      },
    ],
    resourceLinks: [
      { 
        title: "EQ in the Workplace", 
        url: "https://example.com/eq-workplace",
        description: "Learn how to leverage emotional intelligence for career advancement and leadership"
      },
      { 
        title: "Emotional Intelligence Exercises", 
        url: "https://example.com/eq-exercises",
        description: "Practical daily exercises to strengthen your emotional intelligence muscles"
      },
      { 
        title: "Recommended Reading", 
        url: "https://example.com/eq-books",
        description: "Curated list of books that deepen understanding of emotional intelligence concepts"
      },
      { 
        title: "EQ Coaching Services", 
        url: "https://luisgcastro.com/coaching",
        description: "One-on-one coaching to accelerate your emotional intelligence development"
      },
    ],
  };
  
  console.log("Report generated for:", email);
  return report;
};

module.exports = { generateDetailedReport };
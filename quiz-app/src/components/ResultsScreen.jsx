import React, { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';
import EQMeter from './EQMeter';
import EmailForm from './EmailForm';

const ResultsScreen = () => {
  const { 
    score, 
    retakeQuiz, 
    totalQuestions, 
    categoryScores, 
    submitEmail,
    isReportSubmitting,
    isReportSent,
    userEmail
  } = useContext(QuizContext);
  
  const maxScore = totalQuestions * 4; // Max possible score

  let tier = { title: "", description: "", tips: [], color: "text-feedback-low" };

  if (score >= 10 && score <= 20) {
    tier = {
      title: "Developing EQ",
      description: "Your EQ journey is just beginning! Focus on recognizing your feelings and understanding others.",
      tips: [
        "Practice mindfulness: Take a few minutes each day to notice your emotions without judgment.",
        "Ask clarifying questions in conversations to better understand others' perspectives.",
        "Keep an emotion journal to track your feelings and triggers."
      ],
      color: "text-feedback-low"
    };
  } else if (score >= 21 && score <= 31) {
    tier = {
      title: "Proficient EQ",
      description: "You have a good grasp of emotional intelligence. Keep refining your skills!",
      tips: [
        "Seek feedback on how you handle challenging situations.",
        "Practice active listening: Focus fully on the speaker and reflect on what they say.",
        "Identify your long-term goals and connect them to your daily motivation."
      ],
      color: "text-feedback-medium"
    };
  } else if (score >= 32 && score <= maxScore) {
    tier = {
      title: "Masterful EQ",
      description: "You demonstrate strong emotional intelligence! Continue leveraging these skills.",
      tips: [
        "Mentor others in developing their own EQ.",
        "Practice handling complex social situations with empathy and diplomacy.",
        "Use your self-awareness to manage stress effectively and inspire others."
      ],
      color: "text-feedback-high"
    };
  }

  // Render the category breakdown if available
  const renderCategoryBreakdown = () => {
    if (!categoryScores || Object.keys(categoryScores).length === 0) return null;
    
    return (
      <div className="mt-6 bg-neutral-light p-4 rounded-md">
        <h3 className="font-semibold mb-2 text-neutral-darker">Your EQ by Category:</h3>
        <div className="space-y-3">
          {Object.entries(categoryScores).map(([category, score]) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-neutral-dark">{category}</span>
                <span className="text-neutral-dark">{score}%</span>
              </div>
              <div className="w-full bg-neutral rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${getCategoryColor(score)}`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Helper function to get category color based on score
  const getCategoryColor = (score) => {
    if (score < 50) return 'bg-feedback-low';
    if (score < 75) return 'bg-feedback-medium';
    return 'bg-feedback-high';
  };

  // Render report sent confirmation
  const renderReportSent = () => {
    if (!isReportSent) return null;
    
    return (
      <div className="mt-4 p-3 bg-feedback-high/10 border border-feedback-high/20 rounded-md text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto text-feedback-high mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <p className="text-sm text-neutral-darker">
          Your detailed EQ report has been sent to <span className="font-semibold">{userEmail}</span>
        </p>
        <p className="text-xs text-neutral-dark mt-1">
          Check your inbox for personalized insights and improvement strategies
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow-xl text-center animate-fadeIn">
      <h1 className="text-3xl font-bold mb-4 text-primary-dark">Quiz Complete!</h1>
      <p className="text-lg mb-2 text-neutral-darker">Your EQ Score:</p>
      <div className="text-5xl font-bold mb-4" >
         <span className={tier.color}>{score}</span>
         <span className="text-neutral text-3xl"> / {maxScore}</span>
      </div>

      <EQMeter score={score} maxScore={maxScore} />

      <div className="mt-6 text-left bg-neutral-light p-4 rounded-md">
        <h2 className={`text-2xl font-semibold mb-3 ${tier.color}`}>{tier.title}</h2>
        <p className="text-neutral-darker mb-4">{tier.description}</p>
        {tier.tips.length > 0 && (
          <>
            <h3 className="font-semibold mb-2 text-neutral-darker">Next Steps & Tips:</h3>
            <ul className="list-disc list-inside space-y-1 text-neutral-darker">
              {tier.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {renderCategoryBreakdown()}
      
      {renderReportSent() || (
        <EmailForm 
          onSubmit={submitEmail} 
          isSubmitting={isReportSubmitting} 
        />
      )}

      <button
        onClick={retakeQuiz}
        className="btn btn-primary mt-8"
      >
        Retake Quiz
      </button>
    </div>
  );
};

export default ResultsScreen;

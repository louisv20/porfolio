import React, { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

const WelcomeScreen = () => {
  const { startQuiz, lastScore } = useContext(QuizContext);

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-xl text-center animate-fadeIn">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-primary-dark">Discover Your EQ</h1>
      <p className="text-neutral-darker mb-3">
        Answer 10 quick questions to see your Emotional Intelligence score!
      </p>
      <p className="text-sm text-neutral-dark mb-6">
        After completing the assessment, you can receive a comprehensive report with personalized insights by email.
      </p>
      {lastScore !== null && (
         <p className="text-sm text-neutral-dark mb-6">
            Your last score was: <strong>{lastScore}</strong>. Let's see how you do this time!
         </p>
      )}
      <button
        onClick={startQuiz}
        className="btn btn-primary text-lg"
        aria-label="Start the EQ quiz"
      >
        Start Quiz
      </button>
    </div>
  );
};

export default WelcomeScreen;

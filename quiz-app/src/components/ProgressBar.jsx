import React, { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

const ProgressBar = () => {
  const { currentQuestionIndex, totalQuestions } = useContext(QuizContext);
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="w-full bg-neutral rounded-full h-2.5 mb-6">
      <div
        className="bg-primary h-2.5 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="Quiz progress"
      ></div>
      <span className="text-sm text-neutral-dark mt-1 block text-center">
        Question {currentQuestionIndex + 1} of {totalQuestions}
      </span>
    </div>
  );
};

export default ProgressBar;

import React, { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';
import Question from './Question';
import ProgressBar from './ProgressBar';

const QuizScreen = () => {
  const {
    currentQuestionIndex,
    totalQuestions,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    selectedAnswer
  } = useContext(QuizContext);

  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  const handleNext = () => {
    if (isLastQuestion) {
      submitQuiz();
    } else {
      nextQuestion();
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 bg-white rounded-lg shadow-xl">
      <ProgressBar />
      <Question key={currentQuestionIndex} /> {/* Add key to force re-render on question change */}
      <div className="flex justify-between mt-8">
        <button
          onClick={prevQuestion}
          disabled={isFirstQuestion}
          className="btn btn-outline"
          aria-label="Previous question"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={selectedAnswer === undefined} // Disable next/submit if no answer selected
          className="btn btn-primary"
          aria-label={isLastQuestion ? "Submit quiz" : "Next question"}
        >
          {isLastQuestion ? 'Submit' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default QuizScreen;

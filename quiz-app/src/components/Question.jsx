import React, { useContext } from 'react';
import { QuizContext } from '../context/QuizContext';

const Question = () => {
  const { currentQuestion, options, answerQuestion, selectedAnswer } = useContext(QuizContext);

  if (!currentQuestion) {
    return <p>Loading question...</p>;
  }

  return (
    <div className="animate-slideIn">
      <h2 className="text-xl md:text-2xl font-semibold mb-6 text-center text-neutral-darker">
        {currentQuestion.text}
      </h2>
      <fieldset className="space-y-4">
        <legend className="sr-only">Choose an option for question {currentQuestion.id}</legend>
        {options.map((option) => (
          <label
            key={option.id}
            htmlFor={`q${currentQuestion.id}_${option.id}`}
            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors duration-200 ease-in-out ${
              selectedAnswer === option.value
                ? 'bg-primary/10 border-primary ring-2 ring-primary'
                : 'border-neutral hover:bg-neutral-light'
            }`}
          >
            <input
              type="radio"
              id={`q${currentQuestion.id}_${option.id}`}
              name={`question_${currentQuestion.id}`}
              value={option.value}
              checked={selectedAnswer === option.value}
              onChange={() => answerQuestion(currentQuestion.id, option.value)}
              className="h-4 w-4 text-primary focus:ring-primary border-neutral-dark mr-3"
            />
            <span className="text-neutral-darker">{option.text}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
};

export default Question;

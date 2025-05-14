import React from 'react';

const EQMeter = ({ score, maxScore = 40 }) => {
  const percentage = (score / maxScore) * 100;
  let bgColor = 'bg-feedback-low'; // Default to low
  if (score > 20 && score <= 31) {
    bgColor = 'bg-feedback-medium';
  } else if (score > 31) {
    bgColor = 'bg-feedback-high';
  }

  return (
    <div className="w-full bg-neutral rounded-full h-6 my-4 overflow-hidden">
      <div
        className={`h-6 rounded-full ${bgColor} transition-all duration-1000 ease-out flex items-center justify-center text-white text-sm font-medium`}
        style={{ width: `${percentage}%` }}
        role="meter"
        aria-valuenow={score}
        aria-valuemin="10"
        aria-valuemax={maxScore}
        aria-label={`EQ Score: ${score} out of ${maxScore}`}
      >
         {score} / {maxScore}
      </div>
    </div>
  );
};

export default EQMeter;

import React, { createContext, useState, useMemo, useEffect } from 'react';
import { questions, options } from '../data/questions';

export const QuizContext = createContext();

const initialState = {
  questions: questions,
  options: options,
  answers: {}, // { questionId: optionValue }
  currentQuestionIndex: 0,
  score: 0,
  isStarted: false,
  isFinished: false,
  lastScore: null,
  isReportSubmitting: false,
  isReportSent: false,
  userEmail: null,
  categoryScores: {},
};

export const QuizProvider = ({ children }) => {
  const [state, setState] = useState(() => {
    const savedScore = localStorage.getItem('lastEqScore');
    return {
      ...initialState,
      lastScore: savedScore ? parseInt(savedScore, 10) : null,
    };
  });

  useEffect(() => {
    if (state.isFinished) {
      localStorage.setItem('lastEqScore', state.score.toString());
    }
  }, [state.isFinished, state.score]);

  // Calculate category scores when quiz is finished
  useEffect(() => {
    if (state.isFinished) {
      const categoryScores = {};
      const categoryCounts = {};
      
      // Initialize categories
      questions.forEach(q => {
        if (!categoryScores[q.category]) {
          categoryScores[q.category] = 0;
          categoryCounts[q.category] = 0;
        }
      });
      
      // Calculate scores per category
      questions.forEach(q => {
        const answerValue = state.answers[q.id];
        if (answerValue !== undefined) {
          let value = answerValue;
          if (q.reversed) {
            // Reverse scoring: 1 becomes 4, 2 becomes 3, 3 becomes 2, 4 becomes 1
            value = (5 - answerValue);
          }
          categoryScores[q.category] += value;
          categoryCounts[q.category]++;
        }
      });
      
      // Convert to percentages (0-100)
      Object.keys(categoryScores).forEach(category => {
        const maxPossible = categoryCounts[category] * 4; // 4 is max per question
        const percentage = Math.round((categoryScores[category] / maxPossible) * 100);
        categoryScores[category] = percentage;
      });
      
      setState(prev => ({ ...prev, categoryScores }));
    }
  }, [state.isFinished, state.answers]);

  const startQuiz = () => {
    setState(prev => ({ 
      ...prev, 
      isStarted: true, 
      isFinished: false, 
      currentQuestionIndex: 0, 
      answers: {}, 
      score: 0,
      isReportSubmitting: false,
      isReportSent: false,
      userEmail: null 
    }));
  };

  const answerQuestion = (questionId, optionValue) => {
    setState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: optionValue,
      },
    }));
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.questions.length - 1) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }));
    }
  };

  const prevQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({ ...prev, currentQuestionIndex: prev.currentQuestionIndex - 1 }));
    }
  };

  const submitQuiz = () => {
    let totalScore = 0;
    state.questions.forEach(q => {
      const answerValue = state.answers[q.id];
      if (answerValue !== undefined) {
        if (q.reversed) {
          // Reverse scoring: 1 becomes 4, 2 becomes 3, 3 becomes 2, 4 becomes 1
          totalScore += (5 - answerValue);
        } else {
          totalScore += answerValue;
        }
      }
    });
    setState(prev => ({ ...prev, score: totalScore, isFinished: true, lastScore: totalScore }));
  };

  const retakeQuiz = () => {
    const savedScore = localStorage.getItem('lastEqScore');
    setState({
        ...initialState,
        lastScore: savedScore ? parseInt(savedScore, 10) : null,
    });
  };

  const submitEmail = async (email) => {
    setState(prev => ({ ...prev, isReportSubmitting: true }));
    
    try {
      // Generate the detailed report
      const reportData = {
        email,
        score: state.score,
        categoryScores: state.categoryScores,
        // You might want to add more details to the report if needed
        // e.g., timestamp, full answers, etc.
      };

      // Make the API call to your Netlify serverless function
      const response = await fetch('https://luisgcastro.com/.netlify/functions/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        // Handle non-successful responses (e.g., 4xx, 5xx)
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send report. Server returned an error.');
      }

      // Assuming the serverless function returns a success message or status
      const result = await response.json(); 
      console.log('Report submission successful:', result);
      
      setState(prev => ({ 
        ...prev, 
        isReportSubmitting: false, 
        isReportSent: true,
        userEmail: email 
      }));
      
      // In production, store this in a database instead of localStorage
      localStorage.setItem('userEmail', email);
      
      return true;
    } catch (error) {
      console.error('Error sending report:', error);
      setState(prev => ({ ...prev, isReportSubmitting: false, isReportSent: false })); // Ensure isReportSent is false on error
      // Optionally, you can set an error message in the state to display to the user
      // setState(prev => ({ ...prev, reportError: error.message }));
      return false;
    }
  };

  const value = useMemo(() => ({
    ...state,
    startQuiz,
    answerQuestion,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    retakeQuiz,
    submitEmail,
    currentQuestion: state.questions[state.currentQuestionIndex],
    totalQuestions: state.questions.length,
    selectedAnswer: state.answers[state.questions[state.currentQuestionIndex]?.id],
  }), [state]);

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
};

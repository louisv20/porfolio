import React, { useContext } from 'react';
import { QuizContext, QuizProvider } from './context/QuizContext';
import WelcomeScreen from './components/WelcomeScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';

function AppContent() {
  const { isStarted, isFinished } = useContext(QuizContext);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-light via-white to-secondary-light">
      {!isStarted && !isFinished && <WelcomeScreen />}
      {isStarted && !isFinished && <QuizScreen />}
      {isFinished && <ResultsScreen />}
    </div>
  );
}

function App() {
  return (
    <QuizProvider>
      <AppContent />
    </QuizProvider>
  );
}

export default App;

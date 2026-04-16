import React, { useState } from 'react';

const EmailForm = ({ onSubmit, isSubmitting }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  const validateEmail = (email) => {
    // Basic email validation regex
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!accepted) {
      setError('Please accept the terms to receive your report');
      return;
    }

    setError('');
    onSubmit(email);
  };

  return (
    <div className="mt-8 bg-primary/5 rounded-lg p-4 border border-primary/20">
      <h3 className="text-lg font-semibold text-primary-dark mb-3">
        Get Your Detailed EQ Report
      </h3>
      <p className="text-sm text-neutral-dark mb-4">
        Enter your email address to receive a comprehensive report with personalized
        insights and actionable steps to improve your emotional intelligence.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="w-full px-4 py-2 border border-neutral rounded-md focus:ring-primary focus:border-primary text-neutral-darker"
            disabled={isSubmitting}
          />
          {error && <p className="mt-1 text-sm text-accent-dark">{error}</p>}
        </div>
        
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="accept-terms"
              type="checkbox"
              checked={accepted}
              onChange={() => setAccepted(!accepted)}
              className="h-4 w-4 border-neutral-dark rounded text-primary focus:ring-primary"
              disabled={isSubmitting}
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="accept-terms" className="text-neutral-dark">
              I agree to receive my EQ report and occasional improvement tips via email
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Sending...
            </span>
          ) : (
            'Get My Detailed Report'
          )}
        </button>
      </form>
    </div>
  );
};

export default EmailForm;

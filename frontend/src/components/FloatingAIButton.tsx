import React from 'react';
import './FloatingAIButton.css';

interface FloatingAIButtonProps {
  onClick: () => void;
}

export const FloatingAIButton: React.FC<FloatingAIButtonProps> = ({ onClick }) => {
  return (
    <button className="floating-ai-button" onClick={onClick} title="AI Booking Assistant">
      <div className="floating-ai-icon">
        <span className="ai-sparkle">✨</span>
        <span className="ai-robot">🤖</span>
      </div>
      <div className="floating-ai-pulse"></div>
      <div className="floating-ai-pulse-2"></div>
    </button>
  );
};
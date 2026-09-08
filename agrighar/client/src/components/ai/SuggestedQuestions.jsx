import React from "react";

const DEFAULT_QUESTIONS = [
  "Mere tomato ke patte peele ho rahe hain, kya problem ho sakti hai?",
  "September me tomato ki farming ke liye kya precautions lene chahiye?",
  "How can I improve soil quality?",
  "Meri wheat crop ki growth slow hai, kya karu?",
];

const SuggestedQuestions = ({ questions = DEFAULT_QUESTIONS, onSelect, disabled }) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {questions.map((q, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => onSelect(q)}
          className="text-xs sm:text-sm bg-primary-50 hover:bg-primary-100 text-primary-700 border border-primary-100 rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          {q}
        </button>
      ))}
    </div>
  );
};

export default SuggestedQuestions;

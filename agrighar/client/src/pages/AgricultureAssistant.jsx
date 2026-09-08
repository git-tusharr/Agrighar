import React from "react";
import { useLocation, Link } from "react-router-dom";
import { FaChevronLeft } from "react-icons/fa";
import AIChatInterface from "../components/ai/AIChatInterface";

const AgricultureAssistant = () => {
  const location = useLocation();
  const relatedAnalysis = location.state?.analysis || null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/agri-sahayak"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <FaChevronLeft className="text-xs" /> AGRI Sahayak AI
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">💬 Ask AI</h1>
      <p className="text-gray-500 mb-6">Farming questions, answered in English, Hindi, or Hinglish.</p>

      <AIChatInterface relatedAnalysis={relatedAnalysis} />
    </div>
  );
};

export default AgricultureAssistant;

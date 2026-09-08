import React from "react";
import { Link } from "react-router-dom";
import { FaCamera, FaComments, FaArrowRight, FaLeaf } from "react-icons/fa";

const AgricultureAI = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
          <FaLeaf /> AI-Powered
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-3">
          🌾 AGRI Sahayak AI
        </h1>
        <p className="text-lg text-primary-600 font-medium mb-2">Scan. Understand. Grow.</p>
        <p className="text-gray-500 max-w-xl mx-auto">
          Upload a photo of your crop to get an AI-based health check, or chat with our
          agriculture assistant in English, Hindi, or Hinglish.
        </p>
      </div>

      {/* Option cards */}
      <div className="grid sm:grid-cols-2 gap-6">
        <Link
          to="/agri-sahayak/scan"
          className="card p-8 flex flex-col items-start hover:-translate-y-1 transition-transform group"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center text-2xl mb-5">
            <FaCamera />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">📷 Scan Crop</h2>
          <p className="text-gray-500 mb-5 flex-1">
            Upload a crop or leaf image and detect possible diseases, severity, and what to do next.
          </p>
          <span className="inline-flex items-center gap-2 text-primary-600 font-semibold group-hover:gap-3 transition-all">
            Start Scanning <FaArrowRight />
          </span>
        </Link>

        <Link
          to="/agri-sahayak/assistant"
          className="card p-8 flex flex-col items-start hover:-translate-y-1 transition-transform group"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent-400/20 text-accent-600 flex items-center justify-center text-2xl mb-5">
            <FaComments />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">💬 Ask AI</h2>
          <p className="text-gray-500 mb-5 flex-1">
            Ask farming questions — crop care, soil health, irrigation, seasonal guidance — and get smart help.
          </p>
          <span className="inline-flex items-center gap-2 text-accent-600 font-semibold group-hover:gap-3 transition-all">
            Open Assistant <FaArrowRight />
          </span>
        </Link>
      </div>
    </div>
  );
};

export default AgricultureAI;

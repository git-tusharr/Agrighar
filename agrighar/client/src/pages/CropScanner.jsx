import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaChevronLeft } from "react-icons/fa";
import CropImageUploader from "../components/ai/CropImageUploader";
import CropAnalysisResult from "../components/ai/CropAnalysisResult";
import { analyzeCropImage } from "../api/axios";

const CropScanner = () => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async (file) => {
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await analyzeCropImage(file);
      setAnalysis(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || "Crop analysis failed. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = () => {
    navigate("/agri-sahayak/assistant", { state: { analysis } });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        to="/agri-sahayak"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-6 transition-colors"
      >
        <FaChevronLeft className="text-xs" /> AGRI Sahayak AI
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mb-1">📷 Scan Crop</h1>
      <p className="text-gray-500 mb-6">Upload a clear photo of the affected leaf or crop for an AI-based assessment.</p>

      <div className="space-y-6">
        <CropImageUploader onAnalyze={handleAnalyze} loading={loading} />
        {analysis && <CropAnalysisResult analysis={analysis} onAskAI={handleAskAI} />}
      </div>
    </div>
  );
};

export default CropScanner;

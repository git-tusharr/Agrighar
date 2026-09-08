import React from "react";
import {
  FaLeaf, FaExclamationTriangle, FaCheckCircle, FaShieldAlt,
  FaUserMd, FaComments, FaClipboardList,
} from "react-icons/fa";

const severityStyles = {
  none: "bg-green-50 text-green-700 border-green-200",
  mild: "bg-yellow-50 text-yellow-700 border-yellow-200",
  moderate: "bg-orange-50 text-orange-700 border-orange-200",
  severe: "bg-red-50 text-red-700 border-red-200",
};

const getSeverityClass = (severity = "") => {
  const key = severity.toLowerCase();
  return severityStyles[key] || "bg-gray-50 text-gray-700 border-gray-200";
};

const Section = ({ icon: Icon, title, items, color }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-5 last:mb-0">
      <h4 className={`flex items-center gap-2 font-semibold text-sm mb-2 ${color}`}>
        <Icon /> {title}
      </h4>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-gray-600 flex gap-2">
            <span className="text-gray-300 mt-0.5">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CropAnalysisResult = ({ analysis, onAskAI }) => {
  if (!analysis) return null;

  const {
    cropName, possibleIssue, confidence, severity,
    symptoms, possibleCauses, recommendedActions, preventionTips,
    expertConsultation, imageUrl,
  } = analysis;

  return (
    <div className="card overflow-hidden">
      {imageUrl && (
        <img src={imageUrl} alt={cropName} className="w-full h-48 object-cover" />
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold mb-1">
              AI-Based Assessment
            </p>
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FaLeaf className="text-primary-500" /> {cropName}
            </h3>
          </div>
          <span className={`badge border ${getSeverityClass(severity)}`}>
            {severity}
          </span>
        </div>

        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-primary-700 uppercase tracking-wide mb-1">
            Possible Issue
          </p>
          <p className="text-gray-800 font-medium">{possibleIssue}</p>
          {confidence && (
            <p className="text-xs text-gray-500 mt-1">Confidence: {confidence}</p>
          )}
        </div>

        <Section
          icon={FaExclamationTriangle}
          title="Symptoms Detected"
          items={symptoms}
          color="text-orange-600"
        />
        <Section
          icon={FaClipboardList}
          title="Possible Causes"
          items={possibleCauses}
          color="text-gray-600"
        />
        <Section
          icon={FaCheckCircle}
          title="Recommended Actions"
          items={recommendedActions}
          color="text-primary-600"
        />
        <Section
          icon={FaShieldAlt}
          title="Prevention Tips"
          items={preventionTips}
          color="text-blue-600"
        />

        {expertConsultation && (
          <div className="flex gap-3 items-start bg-gray-50 border border-gray-100 rounded-xl p-4 mt-5">
            <FaUserMd className="text-gray-400 mt-0.5 shrink-0" />
            <p className="text-sm text-gray-500">{expertConsultation}</p>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-4">
          This is an AI-based assessment and should be verified with an agricultural expert for serious crop issues.
        </p>

        {onAskAI && (
          <button
            onClick={onAskAI}
            className="btn-accent w-full mt-5 flex items-center justify-center gap-2 py-3"
          >
            <FaComments /> Ask AI About This Issue
          </button>
        )}
      </div>
    </div>
  );
};

export default CropAnalysisResult;

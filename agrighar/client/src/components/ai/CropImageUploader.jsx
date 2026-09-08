import React, { useRef, useState } from "react";
import { FaCamera, FaCloudUploadAlt, FaTimes, FaMagic } from "react-icons/fa";

const MAX_SIZE_MB = 5;

const CropImageUploader = ({ onAnalyze, loading }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = (selected) => {
    setError("");
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be smaller than ${MAX_SIZE_MB}MB.`);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const clear = () => {
    setFile(null);
    setPreview(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="card p-6">
      {!preview ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-primary-300 rounded-2xl bg-primary-50/50 hover:bg-primary-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-center py-14 px-6"
        >
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-2xl mb-4">
            <FaCloudUploadAlt />
          </div>
          <p className="font-semibold text-gray-700 mb-1">Upload a crop or leaf photo</p>
          <p className="text-sm text-gray-500 mb-4">Drag & drop, or click to browse — JPG/PNG up to {MAX_SIZE_MB}MB</p>
          <span className="btn-secondary inline-flex items-center gap-2 text-sm">
            <FaCamera /> Choose Image
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div>
          <div className="relative rounded-2xl overflow-hidden border border-gray-100">
            <img src={preview} alt="Crop preview" className="w-full max-h-96 object-contain bg-gray-50" />
            <button
              onClick={clear}
              className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 rounded-full p-2 shadow-sm transition-colors"
              aria-label="Remove image"
            >
              <FaTimes />
            </button>
          </div>

          <button
            onClick={() => onAnalyze(file)}
            disabled={loading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2 py-3 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI is analyzing your crop...
              </>
            ) : (
              <>
                <FaMagic /> Analyze Crop
              </>
            )}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
};

export default CropImageUploader;

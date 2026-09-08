import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane, FaLeaf, FaRobot, FaUser, FaExclamationCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import { sendAIChatMessage } from "../../api/axios";
import SuggestedQuestions from "./SuggestedQuestions";

const AIChatInterface = ({ relatedAnalysis }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [chatId, setChatId] = useState(null);
  const bottomRef = useRef(null);

  const relatedAnalysisId = relatedAnalysis?._id || relatedAnalysis?.id || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Seed the conversation with a friendly note when arriving with crop context
  useEffect(() => {
    if (relatedAnalysis) {
      setMessages([
        {
          role: "assistant",
          content: `I have your crop scan ready — ${relatedAnalysis.cropName} with a possible issue of "${relatedAnalysis.possibleIssue}". Ask me anything about it, in English, Hindi, or Hinglish!`,
        },
      ]);
    }
  }, [relatedAnalysis]);

  const send = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await sendAIChatMessage(trimmed, chatId, relatedAnalysisId);
      setChatId(res.data.chatId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.data.reply }]);
    } catch (err) {
      const msg = err.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg, isError: true },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="card flex flex-col h-[70vh] max-h-[720px]">
      {/* Context banner */}
      {relatedAnalysis && (
        <div className="flex items-center gap-2 bg-primary-50 border-b border-primary-100 px-4 py-2.5 rounded-t-2xl text-sm text-primary-700">
          <FaLeaf />
          <span className="truncate">
            Discussing: <strong>{relatedAnalysis.cropName}</strong> — {relatedAnalysis.possibleIssue}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl mb-3">
              <FaRobot />
            </div>
            <p className="font-semibold text-gray-700 mb-1">AGRI Sahayak AI</p>
            <p className="text-sm text-gray-500 mb-5 max-w-xs">
              Ask me anything about crops, soil, irrigation, or pests — in English, Hindi, or Hinglish.
            </p>
            <SuggestedQuestions onSelect={send} disabled={sending} />
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">
                {m.isError ? <FaExclamationCircle className="text-red-500" /> : <FaRobot />}
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-primary-600 text-white rounded-br-md"
                  : m.isError
                  ? "bg-red-50 text-red-700 border border-red-100 rounded-bl-md"
                  : "bg-gray-100 text-gray-700 rounded-bl-md"
              }`}
            >
              {m.content}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm">
                <FaUser />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 shrink-0 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-sm">
              <FaRobot />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3 flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested questions once conversation has started */}
      {messages.length > 0 && (
        <div className="px-4 pb-2">
          <SuggestedQuestions onSelect={send} disabled={sending} />
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about crops, soil, irrigation... (Hindi/Hinglish OK)"
          className="input-field resize-none flex-1 max-h-28"
        />
        <button
          onClick={() => send()}
          disabled={sending || !input.trim()}
          className="btn-primary p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          aria-label="Send message"
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default AIChatInterface;

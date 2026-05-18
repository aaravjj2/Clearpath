"use client";

import { useEffect, useRef, useState } from "react";
import { askQuestion } from "@/lib/api";
import { ChatMessage } from "@/types";
import { Bot, Send } from "lucide-react";

export default function ChatPanel({ documentId, disabled }: { documentId: string; disabled: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading || disabled) return;
    const msg = input.trim();
    const history = [...messages];

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const { answer, cited_clause_id } = await askQuestion(documentId, msg, history);
      setMessages((prev) => [...prev, { role: "assistant", content: answer, cited_clause_id }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't process that question." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 flex flex-col h-[500px]">
      {disabled && <div className="p-4 text-center text-slate-500 text-sm">Analysis still in progress. Chat available when complete.</div>}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !disabled && (
          <div className="text-center text-slate-500 text-sm pt-12">
            <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            Ask anything about your document.
            <br />
            <span className="text-xs">e.g. &quot;Can they raise my rent without notice?&quot;</span>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200"}`}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-400 animate-pulse">Searching document…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-slate-800 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={disabled || loading}
          placeholder="Ask about your document…"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50"
        />
        <button onClick={send} disabled={!input.trim() || loading || disabled} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white p-2 rounded-lg transition-all">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Settings, X, Key, Server, CheckCircle, AlertCircle } from "lucide-react";

interface Provider {
  name: string;
  available: boolean;
  models: string[];
  key_count: number;
  is_local: boolean;
}

export default function ProviderSettings() {
  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string>("anthropic");
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaAvailable, setOllamaAvailable] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/providers`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
      
      const resOllama = await fetch(`${API_BASE}/api/providers/ollama/models`);
      if (resOllama.ok) {
        const dataOllama = await resOllama.json();
        setOllamaAvailable(dataOllama.available);
        setOllamaModels(dataOllama.models);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchProviders();
    }
  }, [open]);

  const handleAddKey = async () => {
    if (!newKey.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/providers/keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, keys: [newKey.trim()] })
      });
      if (res.ok) {
        setNewKey("");
        fetchProviders();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <button 
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-slate-800 hover:bg-slate-700 text-slate-300 p-3 rounded-full shadow-lg border border-slate-700 transition-all flex items-center gap-2 group z-50"
        title="AI Providers & BYOK"
      >
        <Settings className="w-5 h-5 group-hover:rotate-45 transition-all" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium">
          Providers & BYOK
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-400" /> AI Providers & BYOK
              </h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {loading && providers.length === 0 ? (
                <div className="text-center text-slate-500 py-8">Loading providers...</div>
              ) : (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Cloud Providers (Bring Your Own Key)</h3>
                    {providers.filter(p => !p.is_local).map(p => (
                      <div key={p.name} className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          {p.available ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-slate-600" />
                          )}
                          <div>
                            <div className="font-semibold capitalize">{p.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{p.key_count} key(s) configured</div>
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          {p.models.slice(0, 2).join(", ")} {p.models.length > 2 && "..."}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4 text-blue-400" /> Add API Key
                    </h4>
                    <div className="flex gap-2">
                      <select 
                        value={selectedProvider} 
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                      >
                        {providers.filter(p => !p.is_local).map(p => (
                          <option key={p.name} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                      <input 
                        type="password"
                        placeholder="sk-..."
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={handleAddKey}
                        disabled={!newKey.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Local Providers (Offline)</h3>
                    <div className="flex items-center justify-between bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        {ollamaAvailable ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-amber-500" />
                        )}
                        <div>
                          <div className="font-semibold">Ollama</div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {ollamaAvailable ? `${ollamaModels.length} local models` : "Not running locally (http://localhost:11434)"}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 max-w-[200px] text-right truncate">
                        {ollamaModels.length > 0 ? ollamaModels.join(", ") : "No models pulled"}
                      </div>
                    </div>
                    {!ollamaAvailable && (
                      <p className="text-xs text-slate-500 pl-1">
                        To use offline, install Ollama and run <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-200">ollama run llama3.2</code>
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

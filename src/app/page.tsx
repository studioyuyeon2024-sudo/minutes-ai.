"use client";

import { useState, useRef } from "react";

type SummaryResult = {
  title: string;
  date: string;
  committee: string;
  attendees: string[];
  agendas: {
    title: string;
    summary: string;
    speakers: { name: string; key_points: string[] }[];
    decision: string;
    follow_up: string;
  }[];
  overall_summary: string;
};

export default function Home() {
  const [mode, setMode] = useState<"paste" | "url">("paste");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const fetchFromUrl = async () => {
    if (!url.trim()) return;
    setFetchingUrl(true);
    setError("");
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "URL에서 텍스트를 가져올 수 없습니다");
      setText(data.text);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetchingUrl(false);
    }
  };

  const analyze = async () => {
    const input = text.trim();
    if (!input) { setError("회의록 텍스트를 입력해 주세요."); return; }
    if (input.length < 100) { setError("텍스트가 너무 짧습니다. 회의록 전문을 입력해 주세요."); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 중 오류가 발생했습니다");
      setResult(data.result);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-stone-900 tracking-tight">회의록 AI 분석</h1>
            <p className="text-xs text-stone-500">전북특별자치도의회 교육위원회</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-stone-200">
            {(["paste", "url"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-3.5 text-sm font-medium transition-colors ${mode === m ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-stone-500 hover:text-stone-700 hover:bg-stone-50"}`}>
                {m === "paste" ? "텍스트 붙여넣기" : "전자회의록 URL"}
              </button>
            ))}
          </div>

          <div className="p-5">
            {mode === "url" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-stone-700 mb-2">전자회의록 페이지 URL</label>
                <div className="flex gap-2">
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://r.jbstatecouncil.jeonbuk.kr/..."
                    className="flex-1 px-4 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-stone-400"/>
                  <button onClick={fetchFromUrl} disabled={fetchingUrl || !url.trim()}
                    className="px-5 py-2.5 bg-stone-800 text-white text-sm font-medium rounded-lg hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap">
                    {fetchingUrl ? "가져오는 중..." : "텍스트 가져오기"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-stone-400">전자회의록 시스템의 회의록 상세 페이지 URL을 입력하세요</p>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-stone-700">
                  {mode === "url" ? "가져온 회의록 텍스트" : "회의록 텍스트"}
                </label>
                <span className={`text-xs ${text.length > 500 ? "text-green-600" : "text-stone-400"}`}>
                  {text.length.toLocaleString()}자
                </span>
              </div>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={12}
                placeholder={mode === "paste"
                  ? "전자회의록에서 회의록 텍스트를 복사하여 붙여넣으세요.\n\n(Ctrl+A → Ctrl+C로 전체 선택 후 복사)"
                  : "위에서 URL을 입력하고 '텍스트 가져오기' 버튼을 누르면 여기에 텍스트가 표시됩니다."}
                className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-stone-400 resize-y font-mono"/>
            </div>

            {error && (
              <div className="mt-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
            )}

            <button onClick={analyze} disabled={loading || !text.trim()}
              className="mt-4 w-full py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  AI가 회의록을 분석하고 있습니다...
                </span>
              ) : "AI 분석 시작"}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div ref={resultRef} className="space-y-5 animate-in fade-in">
            {/* Header */}
            <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-stone-900">{result.title}</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.date && <span className="px-2.5 py-1 bg-stone-100 text-stone-600 rounded-md text-xs font-medium">{result.date}</span>}
                {result.committee && <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{result.committee}</span>}
              </div>
              {result.overall_summary && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-semibold text-amber-800 mb-1">전체 요약</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{result.overall_summary}</p>
                </div>
              )}
              {result.attendees?.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-stone-500 mb-2">참석자</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.attendees.map((a, i) => (
                      <span key={i} className="px-2 py-0.5 bg-stone-100 text-stone-600 rounded text-xs">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agendas */}
            {result.agendas?.map((agenda, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <h3 className="font-semibold text-stone-900 text-sm leading-snug">{agenda.title}</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-stone-500 mb-1">안건 요약</p>
                    <p className="text-sm text-stone-700 leading-relaxed">{agenda.summary}</p>
                  </div>
                  {agenda.speakers?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 mb-2">주요 발언</p>
                      <div className="space-y-2.5">
                        {agenda.speakers.map((s, j) => (
                          <div key={j} className="pl-4 border-l-2 border-indigo-200">
                            <p className="text-sm font-semibold text-indigo-700">{s.name}</p>
                            <ul className="mt-1 space-y-0.5">
                              {s.key_points.map((p, k) => (
                                <li key={k} className="text-sm text-stone-600 leading-relaxed">· {p}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {agenda.decision && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-semibold text-green-800 mb-0.5">의결 사항</p>
                      <p className="text-sm text-green-800">{agenda.decision}</p>
                    </div>
                  )}
                  {agenda.follow_up && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs font-semibold text-blue-800 mb-0.5">후속 조치</p>
                      <p className="text-sm text-blue-800">{agenda.follow_up}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end">
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `회의록분석_${result.date || "결과"}.json`; a.click();
              }} className="px-4 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors">
                분석 결과 내보내기 (JSON)
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-stone-200 mt-12">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <p className="text-xs text-stone-400 text-center">전북특별자치도의회 교육위원회 · AI 기반 회의록 분석 시스템 (PoC)</p>
        </div>
      </footer>
    </div>
  );
}

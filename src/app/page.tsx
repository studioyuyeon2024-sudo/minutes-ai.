"use client";

import { useState, useRef, useEffect } from "react";

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

type SessionInfo = {
  csNum: number;
  csSdate: string;
  csTypeNm: string;
  cnt: number;
  bCnt: number;
  sCnt: number;
};

type DocInfo = {
  cdUid: number;
  cdCode: string;
  cdChasoo: string;
  cdDate: string;
  cdImsi: string;
  ctNm: string;
  ctGroup: string;
  cdRitual: number;
  cdRitualNm: string;
  cdPgamsa: string;
  itemCnt: number;
  cvUid: string;
};

type MemberInfo = {
  cmUid: number;
  cmNm: string;
  speakCnt: number;
};

type SearchResult = {
  cdCode: string;
  csNum: string;
  chasu: string;
  ctNm: string;
  cdDate: string;
  ciNum: string;
  ciNm: string;
  content: string;
  highlighting: string;
  daesu: string;
};

export default function Home() {
  const [mode, setMode] = useState<"browse" | "paste" | "url">("browse");
  const [browseTab, setBrowseTab] = useState<"session" | "keyword" | "member">("session");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [error, setError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  // Session browse state
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedCtGroup, setSelectedCtGroup] = useState("B");
  const [fetchingDoc, setFetchingDoc] = useState(false);

  // Keyword search state
  const [keyword, setKeyword] = useState("");
  const [keywordResults, setKeywordResults] = useState<SearchResult[]>([]);
  const [keywordTotal, setKeywordTotal] = useState({ item: 0, document: 0 });
  const [searchingKeyword, setSearchingKeyword] = useState(false);

  // Member search state
  const [members, setMembers] = useState<MemberInfo[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberInfo | null>(null);
  const [memberResults, setMemberResults] = useState<SearchResult[]>([]);
  const [memberTotal, setMemberTotal] = useState(0);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [searchingMember, setSearchingMember] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [selectedCtGroup]);

  useEffect(() => {
    if (browseTab === "member" && members.length === 0) loadMembers();
  }, [browseTab]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    setSessions([]);
    setDocuments([]);
    setSelectedSession(null);
    try {
      const res = await fetch(`/api/fetch-meetings?action=sessions&csDaesoo=12&ctGroup=${selectedCtGroup}`);
      const data = await res.json();
      if (Array.isArray(data)) setSessions(data);
    } catch {
      setError("회기 목록을 불러올 수 없습니다.");
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadDocuments = async (csSession: number) => {
    setSelectedSession(csSession);
    setLoadingDocs(true);
    setDocuments([]);
    try {
      const res = await fetch(`/api/fetch-meetings?action=documents&csSession=${csSession}&ctGroup=${selectedCtGroup}`);
      const data = await res.json();
      if (Array.isArray(data)) setDocuments(data);
    } catch {
      setError("회의록 목록을 불러올 수 없습니다.");
    } finally {
      setLoadingDocs(false);
    }
  };

  const selectDocument = async (doc: DocInfo) => {
    const viewerUrl = `https://r.jbstatecouncil.jeonbuk.kr/assem/viewer.do?cdUid=${doc.cdUid}`;
    setFetchingDoc(true);
    setError("");
    try {
      const res = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: viewerUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "회의록 텍스트를 가져올 수 없습니다");
      setText(data.text);
      setMode("paste");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setFetchingDoc(false);
    }
  };

  // Keyword search
  const searchByKeyword = async () => {
    if (!keyword.trim() || keyword.trim().length < 2) {
      setError("검색어를 2글자 이상 입력해주세요.");
      return;
    }
    setSearchingKeyword(true);
    setError("");
    setKeywordResults([]);
    try {
      const res = await fetch("/api/fetch-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "keyword-search", searchWord: keyword.trim() }),
      });
      const data = await res.json();
      const items: SearchResult[] = data.itemSearchResultList || [];
      const docs: SearchResult[] = data.conferenceSearchResultList || [];
      setKeywordResults([...items, ...docs]);
      setKeywordTotal({
        item: data.itemResultModel?.documentSize || 0,
        document: data.conferenceResultModel?.documentSize || 0,
      });
    } catch {
      setError("검색 중 오류가 발생했습니다.");
    } finally {
      setSearchingKeyword(false);
    }
  };

  // Member search
  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const res = await fetch("/api/fetch-meetings?action=members&csDaesoo=12");
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch {
      setError("의원 목록을 불러올 수 없습니다.");
    } finally {
      setLoadingMembers(false);
    }
  };

  const searchByMember = async (member: MemberInfo) => {
    setSelectedMember(member);
    setSearchingMember(true);
    setError("");
    setMemberResults([]);
    try {
      const res = await fetch("/api/fetch-meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-speeches", cmUid: String(member.cmUid), csDaesoo: "12" }),
      });
      const data = await res.json();
      const list: SearchResult[] = data.conferenceSearchResultList || [];
      setMemberResults(list);
      setMemberTotal(data.totalCnt || 0);
    } catch {
      setError("의원 발언 검색 중 오류가 발생했습니다.");
    } finally {
      setSearchingMember(false);
    }
  };

  const openViewer = (cdCode: string, ciNum: string) => {
    window.open(`https://r.jbstatecouncil.jeonbuk.kr/assem/viewer.do?cdCode=${cdCode}#bill${ciNum}`, "_blank");
  };

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

  const tabs = [
    { key: "browse", label: "회의록 검색", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    )},
    { key: "paste", label: "직접 입력", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
    )},
    { key: "url", label: "URL 입력", icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
    )},
  ];

  const ctGroupOptions = [
    { value: "B", label: "본회의" },
    { value: "S", label: "상임위원회" },
    { value: "T", label: "특별위원회" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 glass">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">회의록 AI 분석</h1>
              <p className="text-[11px] text-slate-400 font-medium">전북특별자치도의회</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-soft" />
            <span className="text-[11px] font-semibold text-emerald-700">AI 분석 가능</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Input Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm shadow-slate-200/50 overflow-hidden">
          {/* Tab Bar */}
          <div className="flex bg-slate-50/80 border-b border-slate-200/80 p-1.5 gap-1">
            {tabs.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setMode(key as "browse" | "paste" | "url")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                  ${mode === key
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200/80"
                    : "text-slate-400 hover:text-slate-600 hover:bg-white/50"}`}>
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Browse Mode */}
            {mode === "browse" && (
              <div className="space-y-5 animate-in">
                {/* Browse Sub-tabs */}
                <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
                  {([["session", "회기별"], ["keyword", "키워드 검색"], ["member", "의원별"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setBrowseTab(key)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${browseTab === key ? "bg-white text-blue-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Keyword Search */}
                {browseTab === "keyword" && (
                  <div className="space-y-4 animate-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">검색어 입력</label>
                      <div className="flex gap-2">
                        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && searchByKeyword()}
                          placeholder="회의록에서 찾을 키워드를 입력하세요"
                          className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white placeholder:text-slate-300 transition-all"/>
                        <button onClick={searchByKeyword} disabled={searchingKeyword || !keyword.trim()}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 transition-all whitespace-nowrap shadow-md shadow-blue-600/20">
                          {searchingKeyword ? "검색 중..." : "검색"}
                        </button>
                      </div>
                    </div>
                    {keywordResults.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-3">
                          안건 <span className="text-blue-600">{keywordTotal.item}건</span> · 본문 <span className="text-blue-600">{keywordTotal.document}건</span> 검색됨
                        </p>
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
                          {keywordResults.map((r, i) => (
                            <button key={i} onClick={() => openViewer(r.cdCode, r.ciNum)}
                              className="group w-full text-left px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 transition-all duration-200">
                              <p className="text-xs text-blue-600 font-semibold">제{r.daesu || "12"}대 제{r.csNum}회 {r.chasu} {r.ctNm}</p>
                              <p className="text-sm font-medium text-slate-800 mt-1">{r.ciNm}</p>
                              {r.highlighting && <p className="text-xs text-slate-400 mt-1 line-clamp-2" dangerouslySetInnerHTML={{ __html: r.highlighting }} />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Member Search */}
                {browseTab === "member" && (
                  <div className="space-y-4 animate-in">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        의원 선택 (제12대)
                        {loadingMembers && <span className="ml-2 text-blue-500 normal-case animate-pulse-soft">불러오는 중...</span>}
                      </label>
                      <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scroll p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                        {members.map((m) => (
                          <button key={m.cmUid} onClick={() => searchByMember(m)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150
                              ${selectedMember?.cmUid === m.cmUid
                                ? "bg-blue-600 text-white shadow-sm"
                                : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"}`}>
                            {m.cmNm}
                            {m.speakCnt > 0 && <span className="ml-1 opacity-60">({m.speakCnt})</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                    {selectedMember && (
                      <div>
                        <p className="text-xs font-bold text-slate-500 mb-3">
                          <span className="text-blue-600">{selectedMember.cmNm}</span> 의원 — 총 <span className="text-blue-600">{memberTotal}건</span> 발언
                          {searchingMember && <span className="ml-2 text-blue-500 animate-pulse-soft">검색 중...</span>}
                        </p>
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
                          {memberResults.map((r, i) => (
                            <button key={i} onClick={() => openViewer(r.cdCode, r.ciNum)}
                              className="group w-full text-left px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 transition-all duration-200">
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-blue-600 font-semibold">{r.ctNm} 제{r.csNum}회 {r.chasu}</p>
                                <span className="text-xs text-slate-400">{r.cdDate ? `${r.cdDate.substring(0,4)}.${r.cdDate.substring(4,6)}.${r.cdDate.substring(6,8)}` : ""}</span>
                              </div>
                              <p className="text-sm font-medium text-slate-800 mt-1">{r.ciNm}</p>
                              {r.content && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{r.content.substring(0, 100)}...</p>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Session Browse (existing) */}
                {browseTab === "session" && <>
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">회의 종류</label>
                  <div className="flex gap-2">
                    {ctGroupOptions.map((opt) => (
                      <button key={opt.value} onClick={() => setSelectedCtGroup(opt.value)}
                        className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200
                          ${selectedCtGroup === opt.value
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/25"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sessions */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    회기 선택
                    {loadingSessions && <span className="ml-2 text-blue-500 normal-case animate-pulse-soft">불러오는 중...</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scroll p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    {sessions.length === 0 && !loadingSessions && (
                      <p className="text-sm text-slate-400 p-2">회기 목록이 없습니다.</p>
                    )}
                    {sessions.map((s) => (
                      <button key={s.csNum} onClick={() => loadDocuments(s.csNum)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150
                          ${selectedSession === s.csNum
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-white text-slate-500 border border-slate-200 hover:border-blue-300 hover:text-blue-600"}`}>
                        {s.csNum > 999 ? `${s.csNum}년도` : `${s.csNum}회`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Documents */}
                {selectedSession !== null && (
                  <div className="animate-in">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      회의록 목록
                      {loadingDocs && <span className="ml-2 text-blue-500 normal-case animate-pulse-soft">불러오는 중...</span>}
                    </label>
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scroll">
                      {documents.length === 0 && !loadingDocs && (
                        <p className="text-sm text-slate-400 p-4 text-center">회의록이 없습니다.</p>
                      )}
                      {documents.map((doc) => {
                        const label = doc.cdChasoo !== "0" ? `제${doc.cdChasoo}차` : "";
                        const ritual = doc.cdRitual > 0 ? ` ${doc.cdRitualNm}` : "";
                        const imsi = doc.cdImsi === "Y" ? " [임시]" : "";
                        return (
                          <button key={doc.cdUid} onClick={() => selectDocument(doc)} disabled={fetchingDoc}
                            className="group w-full text-left px-4 py-3.5 bg-white border border-slate-200/80 rounded-xl hover:border-blue-400 hover:shadow-md hover:shadow-blue-100 transition-all duration-200 disabled:opacity-40">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                                  ${doc.ctGroup === "B" ? "bg-blue-100 text-blue-700" : doc.ctGroup === "S" ? "bg-violet-100 text-violet-700" : "bg-amber-100 text-amber-700"}`}>
                                  {doc.cdChasoo !== "0" ? doc.cdChasoo : "-"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{doc.ctNm}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{label}{ritual}{imsi}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-medium">{doc.cdDate}</span>
                                <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {fetchingDoc && (
                  <div className="flex items-center justify-center py-6 animate-in">
                    <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 rounded-xl">
                      <svg className="animate-spin w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      <span className="text-sm font-medium text-blue-700">회의록 텍스트를 가져오는 중...</span>
                    </div>
                  </div>
                )}
                </>}
              </div>
            )}

            {/* URL Mode */}
            {mode === "url" && (
              <div className="mb-4 animate-in">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">전자회의록 URL</label>
                <div className="flex gap-2">
                  <input type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://r.jbstatecouncil.jeonbuk.kr/..."
                    className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white placeholder:text-slate-300 transition-all"/>
                  <button onClick={fetchFromUrl} disabled={fetchingUrl || !url.trim()}
                    className="px-6 py-3 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-30 transition-all whitespace-nowrap">
                    {fetchingUrl ? "가져오는 중..." : "가져오기"}
                  </button>
                </div>
              </div>
            )}

            {/* Text Area */}
            {(mode === "paste" || mode === "url") && (
              <div className="animate-in">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {mode === "url" ? "가져온 텍스트" : "회의록 텍스트"}
                  </label>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${text.length > 500 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
                    {text.length.toLocaleString()}자
                  </span>
                </div>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={14}
                  placeholder={mode === "paste"
                    ? "전자회의록에서 회의록 텍스트를 복사하여 붙여넣으세요.\n\n위 '회의록 검색' 탭에서 자동으로 가져올 수도 있습니다."
                    : "위에서 URL을 입력하고 '가져오기' 버튼을 누르면 여기에 텍스트가 표시됩니다."}
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white placeholder:text-slate-300 resize-y font-mono transition-all"/>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-3 px-4 py-3.5 bg-red-50 border border-red-200/80 rounded-xl animate-in">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Analyze Button */}
            <button onClick={analyze} disabled={loading || !text.trim()}
              className="mt-5 w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 text-sm">
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
          <div ref={resultRef} className="space-y-5 animate-slide-up">
            {/* Header Card */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 leading-tight">{result.title}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {result.date && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {result.date}
                      </span>
                    )}
                    {result.committee && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        {result.committee}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {result.overall_summary && (
                <div className="mt-5 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">전체 요약</p>
                  <p className="text-sm text-amber-900 leading-relaxed">{result.overall_summary}</p>
                </div>
              )}

              {result.attendees?.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">참석자</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.attendees.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Agenda Cards */}
            {result.agendas?.map((agenda, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden animate-in" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xs font-bold flex items-center justify-center shadow-sm">{i + 1}</span>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{agenda.title}</h3>
                </div>
                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">안건 요약</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{agenda.summary}</p>
                  </div>

                  {agenda.speakers?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">주요 발언</p>
                      <div className="space-y-3">
                        {agenda.speakers.map((s, j) => (
                          <div key={j} className="pl-4 border-l-[3px] border-blue-400 py-1">
                            <p className="text-sm font-bold text-blue-700">{s.name}</p>
                            <ul className="mt-1.5 space-y-1">
                              {s.key_points.map((p, k) => (
                                <li key={k} className="text-sm text-slate-600 leading-relaxed flex gap-2">
                                  <span className="text-blue-400 mt-0.5 flex-shrink-0">-</span>
                                  <span>{p}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {agenda.decision && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-xl">
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1.5">의결 사항</p>
                      <p className="text-sm text-emerald-800 leading-relaxed">{agenda.decision}</p>
                    </div>
                  )}

                  {agenda.follow_up && (
                    <div className="p-4 bg-sky-50 border border-sky-200/60 rounded-xl">
                      <p className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1.5">후속 조치</p>
                      <p className="text-sm text-sky-800 leading-relaxed">{agenda.follow_up}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Export */}
            <div className="flex justify-end">
              <button onClick={() => {
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `회의록분석_${result.date || "결과"}.json`; a.click();
              }} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                결과 내보내기 (JSON)
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">전북특별자치도의회 · AI 기반 회의록 분석 시스템</p>
          <p className="text-[10px] text-slate-300">Powered by Gemini</p>
        </div>
      </footer>
    </div>
  );
}

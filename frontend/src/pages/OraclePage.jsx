import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Sidebar from "@/components/Sidebar";
import { toast } from "sonner";
import {
  Bot, Send, Plus, Search, Pin, Trash2, MoreHorizontal, Edit3,
  Bookmark, BookmarkCheck, Copy, Download, Upload, FileText,
  ExternalLink, Loader2, ChevronDown, ChevronRight, MessageSquare,
  PanelLeftClose, PanelLeftOpen, Sparkles, ShieldCheck, Newspaper, GraduationCap,
} from "lucide-react";

// ─────────── Tab + tier metadata ───────────
const TABS = [
  { id: "general",     label: "General IPO Query", icon: MessageSquare, default: true },
  { id: "drhp",        label: "DRHP Deep Research", icon: FileText },
  { id: "application", label: "Application Queries", icon: Sparkles },
];

const SOURCE_FILTERS = [
  { id: "all",      label: "All Sources",   icon: Sparkles },
  { id: "official", label: "Official Only", icon: ShieldCheck },
  { id: "news",     label: "News Only",     icon: Newspaper },
  { id: "academic", label: "Academic",      icon: GraduationCap },
];

const tierClasses = (tier) => ({
  1: "bg-amber-50 text-amber-700 border-amber-200",
  2: "bg-slate-50 text-slate-700 border-slate-200",
  3: "bg-orange-50 text-orange-700 border-orange-200",
  4: "bg-blue-50 text-blue-700 border-blue-200",
  5: "bg-purple-50 text-purple-700 border-purple-200",
  6: "bg-gray-50 text-gray-600 border-gray-200",
}[tier] || "bg-gray-50 text-gray-600 border-gray-200");

// ───────────────────────────────────────────────────────────────
const OraclePage = ({ user, apiClient }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [tab, setTab] = useState("general");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Threads
  const [buckets, setBuckets] = useState({});
  const [historySearch, setHistorySearch] = useState("");
  const [activeThread, setActiveThread] = useState(null);   // { thread_id, title, mode, drhp_filename }
  const [messages, setMessages] = useState([]);
  const [renamingThread, setRenamingThread] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletingThread, setDeletingThread] = useState(null);

  // Chat input
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // DRHP upload
  const [uploadingDrhp, setUploadingDrhp] = useState(false);
  const fileInputRef = useRef(null);

  // Bookmarks
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  // ─────────── Initial load + URL-thread support ───────────
  useEffect(() => { loadThreads(); loadBookmarks(); }, []);
  useEffect(() => {
    const tid = new URLSearchParams(location.search).get("thread");
    if (tid && tid !== activeThread?.thread_id) openThread(tid);
    // eslint-disable-next-line
  }, [location.search]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 60);
  };

  const loadThreads = async () => {
    try {
      const res = await apiClient.get("/oracle/threads");
      setBuckets(res.data.buckets || {});
    } catch { /* ignore */ }
  };

  const loadBookmarks = async () => {
    try {
      const res = await apiClient.get("/oracle/bookmarks");
      setBookmarkedIds(new Set((res.data.bookmarks || []).map(b => b.message_id)));
    } catch { /* ignore */ }
  };

  const openThread = async (thread_id) => {
    try {
      const res = await apiClient.get(`/oracle/threads/${thread_id}`);
      setActiveThread(res.data.thread);
      setMessages(res.data.messages || []);
      setTab(res.data.thread.mode || "general");
    } catch { toast.error("Could not open thread"); }
  };

  const newChat = () => {
    setActiveThread(null);
    setMessages([]);
    setQuery("");
    setTab("general");
    inputRef.current?.focus();
  };

  // ─────────── Send message ───────────
  const send = async () => {
    const q = query.trim();
    if (!q || sending) return;
    setSending(true);
    // Optimistic user-message render
    const optimistic = { message_id: `tmp_${Date.now()}`, role: "user", content: q };
    setMessages(m => [...m, optimistic]);
    setQuery("");

    try {
      const res = await apiClient.post("/oracle/chat", {
        query: q,
        thread_id: activeThread?.thread_id,
        mode: tab,
        source_filter: sourceFilter,
      });
      setActiveThread(t => ({ ...(t || {}), thread_id: res.data.thread_id, title: res.data.thread_title, mode: tab }));
      setMessages(m => [...m.filter(x => x.message_id !== optimistic.message_id),
                        { ...optimistic, message_id: optimistic.message_id, content: q },
                        res.data.message]);
      loadThreads();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Oracle is unavailable. Please retry.");
      setMessages(m => m.filter(x => x.message_id !== optimistic.message_id));
    }
    setSending(false);
    inputRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // ─────────── DRHP upload ───────────
  const onUploadDrhp = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { toast.error("PDF must be 30 MB or smaller"); return; }
    setUploadingDrhp(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (activeThread?.thread_id) fd.append("thread_id", activeThread.thread_id);
      const res = await apiClient.post("/oracle/drhp/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Indexed ${res.data.chunks} sections. Ask away.`);
      setTab("drhp");
      await openThread(res.data.thread_id);
      loadThreads();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Upload failed");
    }
    setUploadingDrhp(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ─────────── Thread actions ───────────
  const togglePin = async (t) => {
    try {
      await apiClient.patch(`/oracle/threads/${t.thread_id}`, { pinned: !t.pinned });
      loadThreads();
    } catch { toast.error("Could not pin"); }
  };
  const renameThread = async () => {
    if (!renameValue.trim()) return;
    try {
      await apiClient.patch(`/oracle/threads/${renamingThread.thread_id}`, { title: renameValue.trim() });
      setRenamingThread(null);
      setRenameValue("");
      loadThreads();
      if (activeThread?.thread_id === renamingThread.thread_id)
        setActiveThread(a => ({ ...a, title: renameValue.trim() }));
    } catch { toast.error("Rename failed"); }
  };
  const deleteThread = async () => {
    try {
      await apiClient.delete(`/oracle/threads/${deletingThread.thread_id}`);
      if (activeThread?.thread_id === deletingThread.thread_id) newChat();
      setDeletingThread(null);
      loadThreads();
    } catch { toast.error("Delete failed"); }
  };

  // ─────────── Bookmarks ───────────
  const toggleBookmark = async (m) => {
    if (bookmarkedIds.has(m.message_id)) { return; /* keep simple — no unbookmark for now */ }
    try {
      await apiClient.post("/oracle/bookmarks", { message_id: m.message_id });
      setBookmarkedIds(s => new Set([...s, m.message_id]));
      toast.success("Bookmarked");
    } catch { toast.error("Bookmark failed"); }
  };

  // ─────────── Export ───────────
  const copyMarkdown = async (m) => {
    const text = m.content || "";
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied as markdown");
    } catch {
      // Fallback for restricted iframe / older browsers
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        toast.success("Copied as markdown");
      } catch {
        toast.error("Copy unavailable in this browser");
      }
    }
  };
  const downloadPdf = (m) => {
    // Lightweight: open a print-friendly window — user prints to PDF
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Oracle Response</title>
      <style>body{font-family:Inter,system-ui;padding:32px;color:#111;max-width:780px;margin:auto}
      h1,h2,h3{margin-top:1.4em}code{background:#f5f5f5;padding:2px 4px;border-radius:3px}
      ol,ul{padding-left:1.4em}a{color:#1DA1F2}</style></head><body>
      <h2>Oracle (IPO.GPT) — Response</h2>
      <pre style="white-space:pre-wrap;font-family:Inter,system-ui">${(m.content || "").replace(/</g,"&lt;")}</pre>
      </body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  // ─────────── Filtered history ───────────
  const filteredBuckets = useMemo(() => {
    if (!historySearch.trim()) return buckets;
    const q = historySearch.toLowerCase();
    const out = {};
    for (const k of Object.keys(buckets)) {
      out[k] = (buckets[k] || []).filter(t => t.title.toLowerCase().includes(q));
    }
    return out;
  }, [buckets, historySearch]);

  // ─────────── Render helpers ───────────
  const renderBucket = (key, label) => {
    const items = filteredBuckets[key] || [];
    if (!items.length) return null;
    return (
      <div key={key} className="mb-3">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <ul>
          {items.map(t => (
            <li key={t.thread_id}>
              <div className={`group flex items-center px-2 py-1.5 rounded-md mx-1 cursor-pointer hover:bg-blue-50 transition ${activeThread?.thread_id === t.thread_id ? "bg-blue-50 border border-blue-200" : ""}`}>
                <button
                  onClick={() => openThread(t.thread_id)}
                  className="flex-1 flex items-center gap-2 text-left min-w-0"
                  data-testid={`thread-${t.thread_id}`}
                >
                  {t.pinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" />}
                  <span className="truncate text-[12.5px] text-gray-700">{t.title}</span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded">
                      <MoreHorizontal className="w-3.5 h-3.5 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => togglePin(t)}>
                      <Pin className="w-3.5 h-3.5 mr-2" /> {t.pinned ? "Unpin" : "Pin"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setRenamingThread(t); setRenameValue(t.title); }}>
                      <Edit3 className="w-3.5 h-3.5 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => setDeletingThread(t)}>
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-white" data-testid="oracle-page">
      {/* App-level Sidebar (always visible) */}
      <Sidebar user={user} apiClient={apiClient} />

      {/* Oracle layout */}
      <main className="flex-1 ml-64 flex h-screen overflow-hidden bg-gradient-to-br from-blue-50/30 via-white to-white">
        {/* Oracle History Sidebar */}
        {sidebarOpen && (
          <aside className="w-72 border-r border-gray-200 bg-white/80 backdrop-blur flex flex-col">
            <div className="p-3 border-b border-gray-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center shadow">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-[13px] font-bold text-gray-900 flex-1">Oracle <span className="text-gray-400 font-normal">{"{IPO.GPT}"}</span></h2>
                <button onClick={() => setSidebarOpen(false)} title="Collapse" className="p-1 hover:bg-gray-100 rounded" data-testid="sidebar-collapse">
                  <PanelLeftClose className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <Button onClick={newChat} className="w-full h-9 bg-[#1DA1F2] hover:bg-[#0C7ABF] text-white text-[12px] font-semibold gap-1.5" data-testid="new-chat-btn">
                <Plus className="w-3.5 h-3.5" /> New Chat
              </Button>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  value={historySearch}
                  onChange={e => setHistorySearch(e.target.value)}
                  placeholder="Search history…"
                  className="pl-8 h-8 text-[12px] bg-gray-50 border-gray-200"
                  data-testid="history-search"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="py-2">
                {renderBucket("pinned", "📌 Pinned")}
                {renderBucket("today", "Today")}
                {renderBucket("yesterday", "Yesterday")}
                {renderBucket("last_7", "Last 7 days")}
                {renderBucket("last_30", "Last 30 days")}
                {renderBucket("older", "Older")}
                {Object.values(filteredBuckets).every(v => !v?.length) && (
                  <div className="px-4 py-12 text-center text-[12px] text-gray-400">
                    No chats yet. Start a new conversation →
                  </div>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main chat panel */}
        <section className="flex-1 flex flex-col min-w-0">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="absolute top-3 left-72 ml-2 p-1.5 hover:bg-gray-100 rounded-md z-10" data-testid="sidebar-expand">
              <PanelLeftOpen className="w-4 h-4 text-gray-500" />
            </button>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-white/70 backdrop-blur px-6 pt-4">
            <div className="flex gap-1.5">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    data-testid={`tab-${t.id}`}
                    className={`px-4 py-2 rounded-t-lg text-[12.5px] font-semibold transition border-b-2 flex items-center gap-1.5 ${
                      tab === t.id
                        ? "text-[#1DA1F2] border-[#1DA1F2] bg-white shadow-[0_0_15px_rgba(29,161,242,0.08)]"
                        : "text-gray-500 border-transparent hover:text-gray-800 hover:bg-blue-50/40"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6"
               style={{ backgroundImage: "linear-gradient(rgba(29,161,242,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(29,161,242,0.025) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
            {messages.length === 0 ? (
              <EmptyState tab={tab} onPick={(q) => { setQuery(q); setTimeout(() => inputRef.current?.focus(), 50); }} />
            ) : (
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map(m => (
                  m.role === "user"
                    ? <UserBubble key={m.message_id} m={m} />
                    : <AssistantBubble
                        key={m.message_id} m={m}
                        bookmarked={bookmarkedIds.has(m.message_id)}
                        onBookmark={() => toggleBookmark(m)}
                        onCopy={() => copyMarkdown(m)}
                        onDownload={() => downloadPdf(m)}
                        onFollowUp={(q) => { setQuery(q); inputRef.current?.focus(); }}
                      />
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1DA1F2]" />
                    Oracle is thinking…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-gray-200 bg-white/95 backdrop-blur px-6 py-4">
            <div className="max-w-3xl mx-auto">
              {tab === "drhp" && activeThread?.drhp_filename && (
                <div className="mb-2 inline-flex items-center gap-2 text-[11px] bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full">
                  <FileText className="w-3 h-3" /> Indexed: <span className="font-semibold">{activeThread.drhp_filename}</span>
                </div>
              )}
              <div className="relative bg-white border border-gray-200 rounded-2xl shadow-sm focus-within:border-[#1DA1F2] focus-within:shadow-[0_0_25px_rgba(29,161,242,0.1)] transition-all">
                <textarea
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={
                    tab === "drhp"
                      ? "Ask anything about the uploaded DRHP — Risk Factors, Objects of the Issue, related parties…"
                      : "Ask anything about IPOs, DRHPs, SEBI filings, Stock Pricing, Valuations, Market history…"
                  }
                  rows={1}
                  className="w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[13.5px] text-gray-800 placeholder:text-gray-400 focus:outline-none rounded-2xl"
                  style={{ minHeight: 48, maxHeight: 180 }}
                  data-testid="chat-input"
                />
                <div className="flex items-center justify-between px-3 pb-2 pt-1">
                  <div className="flex items-center gap-2">
                    {tab !== "drhp" ? (
                      <Select value={sourceFilter} onValueChange={setSourceFilter}>
                        <SelectTrigger className="h-7 text-[11px] bg-gray-50 border-gray-200 gap-1.5 px-2.5 w-auto" data-testid="source-filter">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOURCE_FILTERS.map(f => (
                            <SelectItem key={f.id} value={f.id} className="text-[12px]">
                              <span className="flex items-center gap-1.5">
                                <f.icon className="w-3 h-3" /> {f.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        <input
                          type="file"
                          accept=".pdf"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={onUploadDrhp}
                          data-testid="drhp-file-input"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingDrhp}
                          className="h-7 text-[11px] border-amber-200 text-amber-700 hover:bg-amber-50 gap-1"
                          data-testid="upload-drhp-btn"
                        >
                          {uploadingDrhp
                            ? <><Loader2 className="w-3 h-3 animate-spin" /> Indexing…</>
                            : <><Upload className="w-3 h-3" /> Upload DRHP PDF</>
                          }
                        </Button>
                      </>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={send}
                    disabled={sending || !query.trim()}
                    className="h-8 w-8 p-0 bg-[#1DA1F2] hover:bg-[#0C7ABF] rounded-full"
                    data-testid="send-btn"
                  >
                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
              <p className="text-[10.5px] text-gray-400 text-center mt-2 px-4 leading-snug">
                Responses are generated by IPOLabs AI Pvt Ltd for informational purposes and do not constitute registered financial or legal advice.
              </p>
            </div>
          </div>
        </section>

        {/* Rename dialog */}
        <AlertDialog open={!!renamingThread} onOpenChange={(o) => !o && setRenamingThread(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename chat</AlertDialogTitle>
              <AlertDialogDescription>Give this conversation a new title.</AlertDialogDescription>
            </AlertDialogHeader>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} className="mt-2" data-testid="rename-input" />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={renameThread} data-testid="rename-confirm">Save</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete confirm */}
        <AlertDialog open={!!deletingThread} onOpenChange={(o) => !o && setDeletingThread(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove all messages in this thread.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={deleteThread} className="bg-red-600 hover:bg-red-700" data-testid="delete-confirm">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
};

// ──────────────────────── Sub-components ────────────────────────
const EmptyState = ({ tab, onPick }) => {
  const samples = tab === "drhp"
    ? ["Summarise the Risk Factors", "What are the Objects of the Issue?", "List all related-party transactions", "What industry projections does the DRHP cite?"]
    : tab === "application"
      ? ["How do I check IPO allotment status?", "What is ASBA and how to apply?", "Why was my IPO application rejected?", "How to revise a bid in book-building?"]
      : ["What was Zomato's IPO GMP on listing day?", "List all IPOs in India above ₹5,000 Cr in last 5 years", "Explain SEBI ICDR regulations for SME IPOs", "Compare GMP trends 2023 vs 2024"];

  return (
    <div className="max-w-2xl mx-auto pt-12 pb-6 text-center" data-testid="empty-state">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1DA1F2] to-blue-700 shadow-lg mb-4">
        <Bot className="w-7 h-7 text-white" strokeWidth={2.2} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Oracle <span className="text-gray-400 font-normal">{"{IPO.GPT}"}</span></h1>
      <p className="text-[13px] text-gray-500 mt-1.5 max-w-md mx-auto">
        Your India IPO Intel. Search SEBI filings, DRHPs, GMP history, listing data, and capital-market regulation — with graded source citations.
      </p>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-2.5 max-w-xl mx-auto">
        {samples.map(s => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="text-left px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 hover:shadow-[0_0_15px_rgba(29,161,242,0.1)] transition text-[12.5px] text-gray-700"
            data-testid={`sample-${s.slice(0,10)}`}
          >
            <Sparkles className="w-3 h-3 inline-block mr-1.5 text-blue-500" /> {s}
          </button>
        ))}
      </div>
    </div>
  );
};

const UserBubble = ({ m }) => (
  <div className="flex justify-end" data-testid={`msg-user-${m.message_id}`}>
    <div className="max-w-[85%] px-4 py-2.5 rounded-2xl bg-[#1DA1F2] text-white text-[13px] shadow-sm">
      {m.content}
    </div>
  </div>
);

const AssistantBubble = ({ m, bookmarked, onBookmark, onCopy, onDownload, onFollowUp }) => {
  const [showRefs, setShowRefs] = useState(true);
  return (
    <div className="space-y-3" data-testid={`msg-assistant-${m.message_id}`}>
      <div className="flex gap-3">
        <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#1DA1F2] to-blue-600 flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="prose prose-sm prose-gray max-w-none text-[13px] leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content || "*No content*"}
            </ReactMarkdown>
          </div>

          {/* References Used */}
          {m.references?.length > 0 && (
            <div className="mt-4 border border-gray-200 rounded-lg bg-white/80 backdrop-blur" data-testid="references-block">
              <button
                onClick={() => setShowRefs(s => !s)}
                className="w-full flex items-center gap-2 px-3 py-2 text-[11.5px] font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-50"
              >
                {showRefs ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                📎 References Used ({m.references.length})
              </button>
              {showRefs && (
                <ul className="px-3 py-2 space-y-1.5">
                  {m.references.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]">
                      <Badge className={`${tierClasses(r.grade?.tier)} text-[10px] px-1.5 py-0 h-5 flex-shrink-0`} variant="outline">
                        {r.grade?.emoji} {r.grade?.label}
                      </Badge>
                      <span className="flex-1 truncate text-gray-700">{r.label}</span>
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noreferrer"
                           className="text-[#1DA1F2] hover:text-blue-700 flex items-center gap-0.5 text-[11px] flex-shrink-0">
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Follow-ups */}
          {m.follow_ups?.length > 0 && (
            <div className="mt-3" data-testid="follow-ups">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">💬 Follow-up suggestions</div>
              <div className="flex flex-wrap gap-1.5">
                {m.follow_ups.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => onFollowUp(q)}
                    className="text-left text-[11.5px] px-2.5 py-1.5 rounded-full border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action row */}
          <div className="mt-3 flex items-center gap-1 text-gray-500">
            <button onClick={onCopy} title="Copy markdown" className="p-1.5 rounded hover:bg-gray-100" data-testid="action-copy">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={onDownload} title="Download / Print PDF" className="p-1.5 rounded hover:bg-gray-100" data-testid="action-pdf">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={onBookmark} title="Bookmark" className="p-1.5 rounded hover:bg-gray-100" data-testid="action-bookmark">
              {bookmarked
                ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
                : <Bookmark className="w-3.5 h-3.5" />
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OraclePage;

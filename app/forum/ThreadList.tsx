"use client"

import React, {useState, useEffect} from "react";
import ThreadModal from "./ThreadModal";

type Thread = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  timestamp: string;
  votes: number;
  createdAt: number; // ms
};

const sampleThreads: Thread[] = [
  {id: 't1', title: 'Did you see that 3rd quarter!', author: 'Sam', excerpt: 'Unreal shot by #23', timestamp: '2m ago', votes: 2, createdAt: Date.now() - 1000 * 60 * 2},
  {id: 't2', title: 'Injury update?', author: 'Alex', excerpt: 'Looks like a minor tweak', timestamp: '10m ago', votes: 1, createdAt: Date.now() - 1000 * 60 * 10},
  {id: 't3', title: 'Prop predictions', author: 'Jordan', excerpt: 'Will he hit over 25 pts?', timestamp: '12m ago', votes: 0, createdAt: Date.now() - 1000 * 60 * 12},
];

export default function ThreadList() {
  const [threads, setThreads] = useState<Thread[]>(sampleThreads);
  const [openThread, setOpenThread] = useState<Thread | null>(null);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    // load threads from backend
    fetch('/api/forum/threads').then(r => r.json()).then(data => {
      if (Array.isArray(data)) setThreads(data as Thread[]);
    }).catch(() => {});
  }, []);

  function createThread() {
    if (!newTitle.trim()) return;
    const payload = {
      title: newTitle,
      excerpt: '',
      author: 'You',
      votes: 0,
    };
    fetch('/api/forum/threads', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r => r.json())
      .then(t => {
        setThreads(prev => [t, ...prev]);
        setNewTitle("");
      }).catch(() => {
        // fallback local
        const t: Thread = {
          id: `t-${Date.now()}`,
          title: newTitle,
          author: 'You',
          excerpt: 'New thread',
          timestamp: 'just now',
          votes: 0,
          createdAt: Date.now(),
        };
        setThreads([t, ...threads]);
        setNewTitle("");
      });
  }

  // persist simple vote state in localStorage by thread id
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('forum_threads_v1');
      if (raw) {
        const stored: Record<string, number> = JSON.parse(raw);
        // merge stored votes into threads
        setThreads(prev => prev.map(t => ({...t, votes: stored[t.id] ?? t.votes})));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  function persistVotes(updated: Thread[]) {
    try {
      const map: Record<string, number> = {};
      updated.forEach(t => map[t.id] = t.votes);
      localStorage.setItem('forum_threads_v1', JSON.stringify(map));
    } catch (e) {}
  }

  function vote(threadId: string, delta: number) {
    // optimistic update
    setThreads(prev => {
      const updated = prev.map(t => t.id === threadId ? {...t, votes: Math.max(-9999, t.votes + delta)} : t);
      updated.sort((a,b) => (b.votes - a.votes) || (b.createdAt - a.createdAt));
      persistVotes(updated);
      return [...updated];
    });

    fetch(`/api/forum/threads/${threadId}/vote`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ delta }) })
      .catch(() => {});
  }

  return (
    <div>
      <div className="mb-6 flex items-center">
        <input
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          placeholder="Start a thread..."
          className="flex-1 px-4 py-3 rounded-lg bg-[#242424] border border-white/10 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <button onClick={createThread} className="ml-4 px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
          Post Thread
        </button>
      </div>

      {/* Game-like thread cards */}
      <div className="grid gap-4">
        {threads.sort((a,b) => (b.votes - a.votes) || (b.createdAt - a.createdAt)).map(t => (
          <div key={t.id} className="bg-[#242424] rounded-lg border border-white/10 overflow-hidden hover:border-white/20">
            {/* Stats bar */}
            <div className="flex items-center px-4 py-2 bg-black/20 border-b border-white/10 text-sm">
              <div className="flex items-center gap-2 text-white/40 mr-4">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Live
              </div>
              <div className="text-white/60 mr-4">
                {t.timestamp}
              </div>
              <div className="text-white/60">
                {t.author}
              </div>
            </div>

            {/* Main content */}
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Vote column */}
                <div className="flex flex-col items-center bg-white/5 rounded px-2 py-1">
                  <button 
                    onClick={() => vote(t.id, 1)}
                    className={`hover:text-white ${t.votes > 0 ? 'text-green-400' : 'text-white/40'}`}
                  >
                    ▲
                  </button>
                  <div className="my-1 font-medium text-white">{t.votes}</div>
                  <button 
                    onClick={() => vote(t.id, -1)}
                    className={`hover:text-white ${t.votes < 0 ? 'text-red-400' : 'text-white/40'}`}
                  >
                    ▼
                  </button>
                </div>

                {/* Content column */}
                <div className="flex-1" onClick={() => setOpenThread(t)}>
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-lg font-medium text-white hover:text-blue-400 cursor-pointer">
                      {t.title}
                    </h3>
                    {t.votes >= 3 && (
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-500/10 text-yellow-400 rounded">
                        <span className="animate-pulse">🔥</span> Trending
                      </span>
                    )}
                  </div>
                  <p className="text-white/60">{t.excerpt}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {openThread && <ThreadModal thread={openThread} onClose={() => setOpenThread(null)} />}
    </div>
  );
}
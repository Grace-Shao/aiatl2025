"use client"

import React, {useState, useEffect} from "react";

type Thread = {
  id: string;
  title: string;
  author: string;
  excerpt?: string;
  timestamp?: string;
};

export default function ThreadModal({thread, onClose}: {thread: Thread; onClose: () => void}) {
  const [comments, setComments] = useState<Array<{id:string;text:string;author:string;timestamp:string;votes:number}>>((thread as any)?.comments ?? []);
  const [text, setText] = useState("");

  async function refreshThread() {
    try {
      const r = await fetch('/api/forum/threads');
      const data = await r.json();
      const fresh = data.find((t: any) => t.id === thread.id);
      if (fresh) setComments(fresh.comments || []);
    } catch (e) {}
  }

  useEffect(() => { refreshThread(); }, []);

  async function addComment() {
    if (!text.trim()) return;
    try {
      const res = await fetch(`/api/forum/threads/${thread.id}/comments`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ text, author: 'You' }) });
      const json = await res.json();
      setComments(prev => [...prev, json]);
      setText("");
    } catch (e) {
      setComments(prev => [...prev, { id: `c-${Date.now()}`, text: text.trim(), author: 'You', timestamp: new Date().toISOString(), votes: 0 }]);
      setText("");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#242424] w-[800px] max-h-[80vh] rounded-xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-black/20 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-xl font-medium text-white">{thread.title}</h2>
            <div className="text-sm text-white/60 mt-1">
              {thread.author} · {thread.timestamp}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/60 hover:text-white"
            aria-label="Close thread"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-white/80">{thread.excerpt}</p>

          {/* Comments section */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-4">Comments</h3>
            
            <div className="space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="p-3 rounded-lg bg-white/5 flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <button onClick={async () => {
                      // vote comment +1
                      try { await fetch(`/api/forum/comments/${c.id}/vote`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ threadId: thread.id, delta: 1 }) }); } catch(e){}
                      setComments(prev => prev.map(x => x.id===c.id?{...x, votes: (x.votes||0)+1}:x));
                    }} className="text-green-400">▲</button>
                    <div className="text-white font-medium">{c.votes ?? 0}</div>
                    <button onClick={async () => {
                      try { await fetch(`/api/forum/comments/${c.id}/vote`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ threadId: thread.id, delta: -1 }) }); } catch(e){}
                      setComments(prev => prev.map(x => x.id===c.id?{...x, votes: (x.votes||0)-1}:x));
                    }} className="text-red-400">▼</button>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{c.author}</div>
                        <div className="text-sm text-white/50">{new Date(c.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                    <p className="text-white/90 mt-2">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="mt-6 flex gap-3">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={addComment}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

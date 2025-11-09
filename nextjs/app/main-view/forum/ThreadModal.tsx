"use client"

import React, {useState} from "react";

type Thread = {
  id: string;
  title: string;
  author: string;
  excerpt?: string;
  timestamp?: string;
  votes: number;
};

type Comment = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  votes: number;
};

const sampleComments: Comment[] = [
  {id: 'c1', text: 'Great play!', author: 'Basketball Fan', timestamp: '1m ago', votes: 2},
  {id: 'c2', text: 'That was clutch', author: 'Sports Expert', timestamp: '30s ago', votes: 1},
];

export default function ThreadModal({thread, onClose}: {thread: Thread; onClose: () => void}) {
  const [comments, setComments] = useState<Comment[]>(sampleComments);
  const [text, setText] = useState("");

  function addComment() {
    if (!text.trim()) return;
    const comment: Comment = {
      id: `c-${Date.now()}`,
      text: text.trim(),
      author: 'You',
      timestamp: 'just now',
      votes: 0
    };
    setComments([...comments, comment]);
    setText("");
  }

  function voteComment(commentId: string, delta: number) {
    setComments(prev => prev.map(c => 
      c.id === commentId 
        ? {...c, votes: Math.max(-9999, c.votes + delta)}
        : c
    ));
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
              {comments.map(c => (
                <div key={c.id} className="flex gap-4 p-3 rounded-lg bg-white/5">
                  {/* Comment votes */}
                  <div className="flex flex-col items-center">
                    <button 
                      onClick={() => voteComment(c.id, 1)}
                      className={`hover:text-white ${c.votes > 0 ? 'text-green-400' : 'text-white/40'}`}
                    >
                      ▲
                    </button>
                    <div className="my-1 font-medium text-white">{c.votes}</div>
                    <button 
                      onClick={() => voteComment(c.id, -1)}
                      className={`hover:text-white ${c.votes < 0 ? 'text-red-400' : 'text-white/40'}`}
                    >
                      ▼
                    </button>
                  </div>

                  {/* Comment content */}
                  <div className="flex-1">
                    <p className="text-white/90">{c.text}</p>
                    <div className="text-sm text-white/40 mt-1">
                      {c.author} · {c.timestamp}
                    </div>
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
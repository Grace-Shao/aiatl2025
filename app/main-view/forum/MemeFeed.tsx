"use client"

import React from "react";

type Meme = {
  id: string;
  src: string;
  caption: string;
  author: string;
  timestamp: string;
  likes: number;
};

const sampleMemes: Meme[] = [
  {
    id: 'm1',
    src: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&q=80',
    caption: 'When your pick hits 🎯',
    author: '@sportsfan',
    timestamp: '2m ago',
    likes: 45
  },
  {
    id: 'm2',
    src: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=400&q=80',
    caption: 'That clutch moment! 🔥',
    author: '@hoopsdreams',
    timestamp: '5m ago',
    likes: 32
  },
  {
    id: 'm3',
    src: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80',
    caption: 'Fan reaction to that last play 😂',
    author: '@memester',
    timestamp: '15m ago',
    likes: 28
  }
];

export default function MemeFeed() {
  return (
    <div className="space-y-3">
      {sampleMemes.map(meme => (
        <div key={meme.id} className="bg-[#242424] rounded-lg border border-white/10 overflow-hidden">
          {/* Image */}
          <div className="aspect-video relative">
            <img
              src={meme.src}
              alt={meme.caption}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-3">
            <p className="text-white font-medium mb-1">{meme.caption}</p>
            
            {/* Meta info */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                {meme.author} · {meme.timestamp}
              </div>
              <div className="flex items-center gap-1 text-white/60">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {meme.likes}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
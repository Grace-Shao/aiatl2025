"use client"

import React, { useState, useEffect, useRef } from "react";

type Meme = {
  id: string;
  src: string;
  caption: string;
  author: string;
  timestamp: string;
  likes: number;
};

// Function to generate mock memes
function generateMemes(startId: number, count: number): Meme[] {
  const images = [
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4',
    'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1'
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `m${startId + i}`,
    src: `${images[i % images.length]}?w=400&q=80&random=${startId + i}`,
    caption: [
      'When your pick hits 🎯',
      'That clutch moment! 🔥',
      'Fan reaction to that last play 😂',
      'This aged well 👀',
      'Basketball never lies 🏀'
    ][Math.floor(Math.random() * 5)],
    author: ['@sportsfan', '@hoopsdreams', '@memester'][Math.floor(Math.random() * 3)],
    timestamp: `${Math.floor(Math.random() * 59) + 1}m ago`,
    likes: Math.floor(Math.random() * 100) + 1
  }));
}

export default function MemeFeed() {
  const [memes, setMemes] = useState<Meme[]>(generateMemes(0, 5));
  const [loading, setLoading] = useState(false);
  const loader = useRef<HTMLDivElement>(null);
  const currentPage = useRef(1);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 1.0 });
    
    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleObserver = (entities: IntersectionObserverEntry[]) => {
    const target = entities[0];
    if (target.isIntersecting && !loading) {
      loadMore();
    }
  };

  const loadMore = () => {
    setLoading(true);
    // Simulate API delay
    setTimeout(() => {
      const newMemes = generateMemes(currentPage.current * 5, 5);
      setMemes(prev => [...prev, ...newMemes]);
      currentPage.current += 1;
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-4 overflow-auto max-h-[calc(100vh-8rem)] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      {memes.map(meme => (
        <div key={meme.id} className="bg-[#242424] rounded-lg border border-white/10 overflow-hidden hover:border-white/20">
          {/* Image */}
          <div className="aspect-video relative bg-black/20">
            <img
              src={meme.src}
              alt={meme.caption}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="p-3">
            <p className="text-white font-medium mb-2">{meme.caption}</p>
            
            {/* Meta info */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-white/60">
                {meme.author} · {meme.timestamp}
              </div>
              <button className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {meme.likes}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      <div ref={loader} className="py-4 text-center">
        {loading && (
          <div className="text-white/40 text-sm">
            Loading more memes...
          </div>
        )}
      </div>
    </div>
  );
}

"use client"

import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Repeat2, Bookmark, Share, MoreHorizontal, Image as ImageIcon, Smile, CalendarDays } from "lucide-react";
import { sampleGifs, sampleMemes, funnyTweetTemplates } from "@/lib/social-content";

interface Tweet {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: string;
  likes: number;
  retweets: number;
  replies: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'gif' | 'video';
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
}

export default function TwitterFeed() {
  const [tweets, setTweets] = useState<Tweet[]>([
    // Initial sample tweets with GIFs and memes
    {
      id: "sample-1",
      author: {
        name: "PrizePicks AI",
        username: "PrizePicksAI",
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=PrizePicksAI`,
        verified: true,
      },
      content: "🏈 GAME TIME! Ravens vs Chiefs about to be WILD! Drop your hot takes below 👇",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 42,
      retweets: 15,
      replies: 8,
      mediaUrl: sampleGifs[0],
      mediaType: 'gif',
    },
    {
      id: "sample-2",
      author: {
        name: "NFL Fan",
        username: "nflfan2025",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=nflfan`,
        verified: false,
      },
      content: "When you see Derrick Henry break through the defense 💀",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      likes: 128,
      retweets: 34,
      replies: 12,
      mediaUrl: sampleMemes[0],
      mediaType: 'image',
    },
    {
      id: "sample-3",
      author: {
        name: "Sports Bettor",
        username: "sportsbetking",
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=betking`,
        verified: false,
      },
      content: "@PrizePicksAI What are Lamar Jackson's chances for 300+ yards tonight?",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      likes: 23,
      retweets: 5,
      replies: 3,
    },
  ]);
  const [newTweetText, setNewTweetText] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
      // Fetch existing threads from API and prepend to sample tweets
    fetch('/api/forum/threads')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          const formattedTweets: Tweet[] = data.map(thread => ({
            id: thread.id,
            author: {
              name: thread.author,
              username: thread.author.toLowerCase().replace(/\s/g, ''),
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${thread.author}`,
              verified: thread.author.includes('Bot')
            },
            content: thread.title + (thread.excerpt ? `\n\n${thread.excerpt}` : ''),
            timestamp: new Date(thread.timestamp).toLocaleDateString(),
            likes: thread.votes || 0,
            retweets: Math.floor(Math.random() * 20),
            replies: thread.comments?.length || 0,
          }));
            // Prepend new tweets from API to sample tweets
            setTweets(prev => [...formattedTweets, ...prev]);
        }
      })
      .catch(console.error);
  }, []);

  const handlePostTweet = async () => {
    if (!newTweetText.trim()) return;

    const newTweet: Tweet = {
      id: `t-${Date.now()}`,
      author: {
        name: "You",
        username: "you",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=you",
      },
      content: newTweetText,
      timestamp: "Just now",
      likes: 0,
      retweets: 0,
      replies: 0,
    };

    // Post to backend
    try {
      await fetch('/api/forum/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTweetText.substring(0, 100),
          content: newTweetText,
          author: 'You',
        }),
      });

      setTweets([newTweet, ...tweets]);
      setNewTweetText("");
      setIsComposing(false);

      // Check if AI agent is tagged
      if (newTweetText.includes('@PrizePicksAI')) {
        setTimeout(() => {
          const aiResponse: Tweet = {
            id: `ai-${Date.now()}`,
            author: {
              name: "PrizePicks AI",
              username: "PrizePicksAI",
              avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AI",
              verified: true,
            },
            content: `Based on today's matchup, I'm seeing strong value on these picks:\n\n🏀 LeBron James - OVER 26.5 points\n🏈 Travis Kelce - OVER 65.5 receiving yards\n⚾ Aaron Judge - OVER 1.5 total bases\n\nConfidence: 🔥🔥🔥`,
            timestamp: "Just now",
            likes: 0,
            retweets: 0,
            replies: 0,
          };
          setTweets(prev => [aiResponse, ...prev]);
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to post tweet:', error);
    }
  };

  const handleLike = (tweetId: string) => {
    setTweets(tweets.map(tweet => 
      tweet.id === tweetId 
        ? { ...tweet, isLiked: !tweet.isLiked, likes: tweet.isLiked ? tweet.likes - 1 : tweet.likes + 1 }
        : tweet
    ));
  };

  const handleRetweet = (tweetId: string) => {
    setTweets(tweets.map(tweet => 
      tweet.id === tweetId 
        ? { ...tweet, isRetweeted: !tweet.isRetweeted, retweets: tweet.isRetweeted ? tweet.retweets - 1 : tweet.retweets + 1 }
        : tweet
    ));
  };

  const handleBookmark = (tweetId: string) => {
    setTweets(tweets.map(tweet => 
      tweet.id === tweetId 
        ? { ...tweet, isBookmarked: !tweet.isBookmarked }
        : tweet
    ));
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Compose Tweet Box */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex gap-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=you" 
            alt="Your avatar" 
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={newTweetText}
              onChange={(e) => setNewTweetText(e.target.value)}
              onFocus={() => setIsComposing(true)}
              placeholder="What's happening?! Tag @PrizePicksAI for insights..."
              className="w-full bg-transparent text-xl outline-none resize-none placeholder-gray-600"
              rows={isComposing ? 3 : 1}
            />
            
            {isComposing && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                    <button aria-label="Add image" className="p-2 hover:bg-blue-500/10 rounded-full transition">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                  </button>
                    <button aria-label="Add emoji" className="p-2 hover:bg-blue-500/10 rounded-full transition">
                    <Smile className="w-5 h-5 text-blue-500" />
                  </button>
                    <button aria-label="Schedule tweet" className="p-2 hover:bg-blue-500/10 rounded-full transition">
                    <CalendarDays className="w-5 h-5 text-blue-500" />
                  </button>
                </div>
                <button
                  onClick={handlePostTweet}
                  disabled={!newTweetText.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-full transition"
                >
                  Post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="divide-y divide-gray-800">
        {tweets.map((tweet) => (
          <div key={tweet.id} className="p-4 hover:bg-gray-900/50 transition cursor-pointer">
            <div className="flex gap-3">
              {/* Avatar */}
              <img 
                src={tweet.author.avatar} 
                alt={tweet.author.name}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold hover:underline">{tweet.author.name}</span>
                  {tweet.author.verified && (
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                    </svg>
                  )}
                  <span className="text-gray-500">@{tweet.author.username}</span>
                  <span className="text-gray-500">·</span>
                  <span className="text-gray-500">{tweet.timestamp}</span>
                </div>

                {/* Tweet Text */}
                <p className="mt-1 whitespace-pre-wrap break-words">{tweet.content}</p>

                {/* Media */}
                {tweet.mediaUrl && (
                  <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                    <img src={tweet.mediaUrl} alt="Tweet media" className="w-full" />
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between max-w-md">
                  <button className="flex items-center gap-2 text-gray-500 hover:text-blue-500 group">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm">{tweet.replies || ''}</span>
                  </button>

                  <button 
                    onClick={() => handleRetweet(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition">
                      <Repeat2 className="w-5 h-5" />
                    </div>
                    <span className="text-sm">{tweet.retweets || ''}</span>
                  </button>

                  <button 
                    onClick={() => handleLike(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition">
                      <Heart className={`w-5 h-5 ${tweet.isLiked ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-sm">{tweet.likes || ''}</span>
                  </button>

                  <button 
                    onClick={() => handleBookmark(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition">
                      <Bookmark className={`w-5 h-5 ${tweet.isBookmarked ? 'fill-current' : ''}`} />
                    </div>
                  </button>

                    <button aria-label="Share tweet" className="flex items-center gap-2 text-gray-500 hover:text-blue-500 group">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition">
                      <Share className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

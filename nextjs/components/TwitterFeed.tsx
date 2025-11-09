"use client"

import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, Repeat2, Bookmark, MoreHorizontal, Image as ImageIcon, Smile, CalendarDays } from "lucide-react";
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
  // Repost (retweet) support
  isRepost?: boolean;
  repostOfId?: string; // id of the original tweet
  repostMeta?: { by: string; username: string; avatar: string };
  // Replies
  isReply?: boolean;
  replyToId?: string;
}

export default function TwitterFeed() {
  // Initialize with empty array to avoid hydration mismatch - will load from API
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [newTweetText, setNewTweetText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | undefined>(undefined);
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'gif' | 'video' | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showMentionSuggestion, setShowMentionSuggestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [openReply, setOpenReply] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Helper to generate more tweets (older ones) for infinite scroll simulation
  const generateMoreTweets = (count = 6): Tweet[] => {
    const now = Date.now();
    const arr: Tweet[] = [];
    for (let i = 0; i < count; i++) {
      const useGif = Math.random() > 0.5;
      const mediaPool = useGif ? sampleGifs : sampleMemes;
      const media = mediaPool[Math.floor(Math.random() * mediaPool.length)];
      const template = funnyTweetTemplates[Math.floor(Math.random() * funnyTweetTemplates.length)] || "What a game!";
      const hoursAgo = 4 + i + Math.floor(Math.random() * 12); // make them older than samples
      const seed = `user-${Math.floor(Math.random() * 10000)}`;
      arr.push({
        id: `old-${now}-${i}`,
        author: {
          name: `Fan ${seed}`,
          username: seed,
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
          verified: false,
        },
        content: template,
        timestamp: new Date(now - hoursAgo * 3600000).toISOString(),
        likes: Math.floor(Math.random() * 200),
        retweets: Math.floor(Math.random() * 60),
        replies: Math.floor(Math.random() * 40),
        mediaUrl: media,
        mediaType: useGif ? 'gif' : 'image',
      });
    }
    return arr;
  };

  const loadMore = () => {
    if (isLoadingMore || !initialLoadComplete) return;
    setIsLoadingMore(true);
    // Simulate network latency
    setTimeout(() => {
      setTweets(prev => [...prev, ...generateMoreTweets()]);
      setIsLoadingMore(false);
    }, 800);
  };

  // Helper function to format timestamp as relative time
  const formatTimestamp = (timestamp: string | Date): string => {
    if (!timestamp) return "";
    if (timestamp === "Just now") return "Just now";

    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  };

  // Initialize timestamps after mount to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);

    // Fetch both sample tweets and forum threads
    Promise.all([
      fetch('/api/sample-tweets').then(r => r.json()),
      fetch('/api/forum/threads').then(r => r.json())
    ]).then(([sampleData, forumData]) => {
      const sampleTweets = Array.isArray(sampleData) ? sampleData : [];
      
      const forumTweets: Tweet[] = Array.isArray(forumData) 
        ? forumData.map(thread => ({
            id: thread.id,
            author: {
              name: thread.author,
              username: thread.author.toLowerCase().replace(/\s/g, ''),
              avatar: thread.author.includes('AI') || thread.author.includes('Bot') 
                ? "https://api.dicebear.com/7.x/bottts/svg?seed=AI"
                : "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
              verified: thread.author.includes('Bot') || thread.author.includes('AI')
            },
            content: thread.excerpt || thread.title,
            timestamp: thread.timestamp,
            likes: thread.votes || 0,
            retweets: Math.floor(Math.random() * 20),
            replies: thread.comments?.length || 0,
            mediaUrl: thread.mediaUrl,
            mediaType: thread.mediaType,
          }))
        : [];

      // Forum tweets first, then sample tweets
      setTweets([...forumTweets, ...sampleTweets]);
      setInitialLoadComplete(true);
    }).catch(console.error);
  }, []);

  // Observe the bottom sentinel for infinite scroll
  useEffect(() => {
    if (!bottomRef.current) return;
    const el = bottomRef.current;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMore();
      }
    }, { root: null, rootMargin: '200px', threshold: 0 });

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [bottomRef.current, isLoadingMore]);

  // Handle text change and detect @ mentions
  const handleTextChange = (text: string) => {
    setNewTweetText(text);
    
    // Check if user just typed @ followed by nothing or partial text
    const words = text.split(/\s/);
    const lastWord = words[words.length - 1];
    
    if (lastWord.startsWith('@') && lastWord.length >= 1) {
      const query = lastWord.slice(1).toLowerCase();
      // Show suggestion if it matches "prizepicks" or "p"
      if ('prizepicksai'.startsWith(query)) {
        setShowMentionSuggestion(true);
      } else {
        setShowMentionSuggestion(false);
      }
    } else {
      setShowMentionSuggestion(false);
    }
  };

  // Insert @PrizePicksAI mention
  const insertMention = () => {
    const words = newTweetText.split(/\s/);
    words[words.length - 1] = '@PrizePicksAI';
    setNewTweetText(words.join(' ') + ' ');
    setShowMentionSuggestion(false);
    textareaRef.current?.focus();
  };

  // Highlight @mentions in displayed text
  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-blue-500 font-medium">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const handlePostTweet = async () => {
    if (!newTweetText.trim()) return;

    const newTweet: Tweet = {
      id: `t-${Date.now()}`,
      author: {
        name: "You",
        username: "you",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      },
      content: newTweetText,
      timestamp: "Just now",
      likes: 0,
      retweets: 0,
      replies: 0,
      mediaUrl: selectedMediaUrl,
      mediaType: selectedMediaType,
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
          mediaUrl: selectedMediaUrl,
          mediaType: selectedMediaType,
        }),
      });

      setTweets([newTweet, ...tweets]);
      setNewTweetText("");
      setIsComposing(false);
  setSelectedMediaUrl(undefined);
  setSelectedMediaType(undefined);

      // Check if AI agent is tagged -> call server-side Orchestrator
      if (newTweetText.includes('@PrizePicksAI')) {
        try {
          console.log('Calling /api/ai/orchestrate with prompt:', newTweetText);
          const res = await fetch('/api/ai/orchestrate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: newTweetText }),
          });

          const json = await res.json();
          console.log('Orchestrator response:', json);

          const raw = json?.result ?? json?.error ?? 'No response from agent';
          
          // Parse the result to extract text and imageUrl
          let aiContent = '';
          let aiMediaUrl: string | undefined = undefined;
          
          try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            aiContent = parsed.text || parsed || 'Check out this response! 🔥';
            aiMediaUrl = parsed.imageUrl;
          } catch {
            aiContent = typeof raw === 'string' ? raw : JSON.stringify(raw);
          }

          const aiResponse: Tweet = {
            id: `ai-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            author: {
              name: "PrizePicks AI",
              username: "PrizePicksAI",
              avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=AI",
              verified: true,
            },
            content: aiContent,
            mediaUrl: aiMediaUrl,
            timestamp: "Just now",
            likes: 0,
            retweets: 0,
            replies: 0,
          };

          // Save AI response to database
          await fetch('/api/forum/threads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: aiContent.substring(0, 100),
              content: aiContent,
              author: 'PrizePicks AI',
              mediaUrl: aiMediaUrl,
              mediaType: aiMediaUrl ? (aiMediaUrl.includes('.gif') ? 'gif' : 'image') : undefined,
            }),
          });

          setTweets(prev => [aiResponse, ...prev]);
        } catch (err) {
          console.error('Failed to call orchestrator:', err);
        }
      }
    } catch (error) {
      console.error('Failed to post tweet:', error);
    }
  };

  const handleLike = (tweetId: string) => {
    setTweets(tweets.map((tweet: Tweet) => 
      tweet.id === tweetId 
        ? { ...tweet, isLiked: !tweet.isLiked, likes: tweet.isLiked ? tweet.likes - 1 : tweet.likes + 1 }
        : tweet
    ));
  };

  const handleRetweet = (tweetId: string) => {
    setTweets(prev => {
      const idx = prev.findIndex(t => t.id === tweetId);
      if (idx === -1) return prev;

      const original = prev[idx];

      // If this tweet is a repost item, do nothing (or we could target original)
      if (original.isRepost && original.repostOfId) {
        return prev; // avoid reposting a repost card directly
      }

      const you = { by: 'You', username: 'you', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user' };

      // Check if you already reposted this tweet
      const existingRtIndex = prev.findIndex(
        (t) => t.isRepost && t.repostOfId === original.id && t.repostMeta?.username === 'you'
      );

      if (existingRtIndex !== -1) {
        // Undo repost: remove the repost item and decrement original count/state
        const updated = [...prev];
        updated.splice(existingRtIndex, 1);
        updated[idx] = {
          ...original,
          isRetweeted: false,
          retweets: Math.max(0, (original.retweets || 0) - 1),
        };
        return updated;
      }

      // Create a new repost item and bump original counters
      const repost: Tweet = {
        id: `rt-${Date.now()}-${original.id}`,
        author: original.author, // original author's identity is shown in the inner card; outer card notes who reposted
        content: '',
        timestamp: 'Just now',
        likes: 0,
        retweets: 0,
        replies: 0,
        isRepost: true,
        repostOfId: original.id,
        repostMeta: you,
      };

      const updated = [...prev];
      // Update original tweet state
      updated[idx] = {
        ...original,
        isRetweeted: true,
        retweets: (original.retweets || 0) + 1,
      };
      // Prepend repost to the feed
      updated.unshift(repost);
      return updated;
    });
  };

  const handleBookmark = (tweetId: string) => {
    setTweets(tweets.map((tweet: Tweet) => 
      tweet.id === tweetId 
        ? { ...tweet, isBookmarked: !tweet.isBookmarked }
        : tweet
    ));
  };

  const toggleReply = (tweetId: string) => {
    setOpenReply((prev: Record<string, boolean>) => ({ ...prev, [tweetId]: !prev[tweetId] }));
  };

  const handleReplyChange = (tweetId: string, text: string) => {
    setReplyDrafts((prev: Record<string, string>) => ({ ...prev, [tweetId]: text }));
  };

  const handleReplySubmit = (tweetId: string) => {
    const text = (replyDrafts[tweetId] || '').trim();
    if (!text) return;
    setTweets(prev => {
      const idx = prev.findIndex(t => t.id === tweetId);
      if (idx === -1) return prev;
      const parent = prev[idx];

      const reply: Tweet = {
        id: `reply-${Date.now()}-${tweetId}`,
        author: { name: 'You', username: 'you', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user' },
        content: text,
        timestamp: 'Just now',
        likes: 0,
        retweets: 0,
        replies: 0,
        isReply: true,
        replyToId: tweetId,
      };

      // Determine insertion point: after parent and any existing replies to this parent
      let insertAt = idx + 1;
      while (insertAt < prev.length && prev[insertAt].isReply && prev[insertAt].replyToId === tweetId) {
        insertAt++;
      }

      const updated = [...prev];
      updated.splice(insertAt, 0, reply);
      // bump parent reply count
      updated[idx] = { ...parent, replies: (parent.replies || 0) + 1 };
      return updated;
    });
    setReplyDrafts((prev: Record<string, string>) => ({ ...prev, [tweetId]: '' }));
    setOpenReply((prev: Record<string, boolean>) => ({ ...prev, [tweetId]: false }));
  };

  return (
    <div className="text-white">
      {/* Compose Tweet Box */}
      <div className="border-b border-gray-800 p-4">
        <div className="flex gap-3">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
            alt="Your avatar" 
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={newTweetText}
              onChange={(e) => handleTextChange(e.target.value)}
              onFocus={() => setIsComposing(true)}
              placeholder="What's happening?! Tag @PrizePicksAI for insights..."
              className="w-full bg-transparent text-xl outline-none resize-none placeholder-gray-600"
              rows={isComposing ? 3 : 1}
            />
            
            {/* Autocomplete suggestion */}
            {showMentionSuggestion && (
              <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-10 w-64">
                <button
                  onClick={insertMention}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left"
                >
                  <img 
                    src="https://api.dicebear.com/7.x/bottts/svg?seed=AI" 
                    alt="PrizePicksAI" 
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="text-white font-medium flex items-center gap-1">
                      PrizePicks AI
                      <svg className="w-4 h-4 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                      </svg>
                    </div>
                    <div className="text-gray-400 text-sm">@PrizePicksAI</div>
                  </div>
                </button>
              </div>
            )}
            
            {/* Quick preview of attached media */}
            {selectedMediaUrl && (
              <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                <img src={selectedMediaUrl} alt="Selected media" className="w-full" />
              </div>
            )}

            {isComposing && (
              <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-1">
                    <button
                      aria-label="Add image or GIF"
                      onClick={() => {
                        // Randomly attach a meme or GIF
                        const pickGif = Math.random() > 0.5
                        const pool = pickGif ? sampleGifs : sampleMemes
                        const choice = pool[Math.floor(Math.random() * pool.length)]
                        setSelectedMediaUrl(choice)
                        setSelectedMediaType(pickGif ? 'gif' : 'image')
                      }}
                      className="p-2 hover:bg-blue-500/10 rounded-full transition"
                    >
                      <ImageIcon className="w-5 h-5 text-blue-500" />
                    </button>
                    <button
                      aria-label="Add emoji"
                      onClick={() => {
                        const emojis = ['🔥','😂','🏈','🤖','👏','💪','😮','🎯','🏆','✨']
                        const e = emojis[Math.floor(Math.random() * emojis.length)]
                        setNewTweetText((t) => (t ? t + ' ' + e : e))
                      }}
                      className="p-2 hover:bg-blue-500/10 rounded-full transition"
                    >
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
        {tweets.filter(t => !t.isReply).map((tweet) => (
          <div key={tweet.id} className="p-4 hover:bg-gray-900/50 transition cursor-pointer">
            <div className="flex gap-3">
              {/* Avatar */}
              {/* For reposts, show the reposting user's avatar; else author's */}
              <img
                src={(tweet.isRepost && tweet.repostMeta?.avatar) ? tweet.repostMeta.avatar : tweet.author.avatar}
                alt={(tweet.isRepost && tweet.repostMeta?.by) ? tweet.repostMeta.by : tweet.author.name}
                className="w-12 h-12 rounded-full flex-shrink-0"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* For reposts, header shows who reposted */}
                  {tweet.isRepost ? (
                    <>
                      <span className="text-gray-400">{tweet.repostMeta?.by} reposted</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500" suppressHydrationWarning>{isMounted && tweet.timestamp ? formatTimestamp(tweet.timestamp) : ''}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold hover:underline">{tweet.author.name}</span>
                      {tweet.author.verified && (
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                    </svg>
                      )}
                      <span className="text-gray-500">@{tweet.author.username}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-gray-500" suppressHydrationWarning>
                        {isMounted && tweet.timestamp ? formatTimestamp(tweet.timestamp) : ''}
                      </span>
                    </>
                  )}
                </div>

                {/* Content area */}
                {!tweet.isRepost ? (
                  <>
                    <p className="mt-1 whitespace-pre-wrap break-words">
                      {renderContentWithMentions(tweet.content)}
                    </p>
                    {tweet.mediaUrl && (
                      <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                        <img src={tweet.mediaUrl} alt="Tweet media" className="w-full" />
                      </div>
                    )}
                  </>
                ) : (
                  // Repost card: embed original tweet preview
                  (() => {
                    const original = tweets.find(t => t.id === tweet.repostOfId);
                    if (!original) return null;
                    return (
                      <div className="mt-2 border border-gray-800 rounded-xl p-3 bg-black/30">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold hover:underline">{original.author.name}</span>
                          {original.author.verified && (
                            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484zm-6.616-3.334l-4.334 6.5c-.145.217-.382.334-.625.334-.143 0-.288-.04-.416-.126l-.115-.094-2.415-2.415c-.293-.293-.293-.768 0-1.06s.768-.294 1.06 0l1.77 1.767 3.825-5.74c.23-.345.696-.436 1.04-.207.346.23.44.696.21 1.04z"/>
                            </svg>
                          )}
                          <span className="text-gray-500">@{original.author.username}</span>
                          <span className="text-gray-500">·</span>
                          <span className="text-gray-500" suppressHydrationWarning>{isMounted && original.timestamp ? formatTimestamp(original.timestamp) : ''}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words">
                          {renderContentWithMentions(original.content)}
                        </p>
                        {original.mediaUrl && (
                          <div className="mt-3 rounded-2xl overflow-hidden border border-gray-800">
                            <img src={original.mediaUrl} alt="Tweet media" className="w-full" />
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between max-w-md">
                  <button onClick={() => toggleReply(tweet.id)} aria-label={`Reply to @${tweet.author.username}`} className="flex items-center gap-2 text-gray-500 hover:text-blue-500 group">
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm">{tweet.replies || ''}</span>
                  </button>

                  <button 
                    aria-label={tweet.isRetweeted ? 'Undo retweet' : 'Retweet'}
                    onClick={() => !tweet.isRepost && handleRetweet(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isRetweeted ? 'text-green-500' : 'text-gray-500 hover:text-green-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-green-500/10 transition">
                      <Repeat2 className="w-5 h-5" />
                    </div>
                    <span className="text-sm">{tweet.retweets || ''}</span>
                  </button>

                  <button 
                    aria-label={tweet.isLiked ? 'Unlike' : 'Like'}
                    onClick={() => handleLike(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isLiked ? 'text-pink-500' : 'text-gray-500 hover:text-pink-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-pink-500/10 transition">
                      <Heart className={`w-5 h-5 ${tweet.isLiked ? 'fill-current' : ''}`} />
                    </div>
                    <span className="text-sm">{tweet.likes || ''}</span>
                  </button>

                  <button 
                    aria-label={tweet.isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    onClick={() => handleBookmark(tweet.id)}
                    className={`flex items-center gap-2 group ${tweet.isBookmarked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'}`}
                  >
                    <div className="p-2 rounded-full group-hover:bg-blue-500/10 transition">
                      <Bookmark className={`w-5 h-5 ${tweet.isBookmarked ? 'fill-current' : ''}`} />
                    </div>
                  </button>
                </div>

                {/* Reply composer */}
                {openReply[tweet.id] && (
                  <div className="mt-3 pl-12">
                    <div className="flex gap-3 items-start">
                      <img 
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=user" 
                        alt="Your avatar" 
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="flex-1">
                        <textarea
                          value={replyDrafts[tweet.id] || ''}
                          onChange={(e) => handleReplyChange(tweet.id, e.target.value)}
                          placeholder="Post your reply"
                          className="w-full bg-transparent text-base outline-none resize-none placeholder-gray-600 border border-gray-800 rounded-lg p-2"
                          rows={3}
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={() => handleReplySubmit(tweet.id)}
                            disabled={!((replyDrafts[tweet.id] || '').trim())}
                            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white font-bold py-1.5 px-4 rounded-full transition"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Replies list (nested) */}
                {tweets.some(t => t.isReply && t.replyToId === tweet.id) && (
                  <div className="mt-3 space-y-3">
                    {tweets.filter(t => t.isReply && t.replyToId === tweet.id).map(r => (
                      <div key={r.id} className="pl-12">
                        <div className="flex gap-3">
                          <img 
                            src={r.author.avatar}
                            alt={r.author.name}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold hover:underline">{r.author.name}</span>
                              <span className="text-gray-500">@{r.author.username}</span>
                              <span className="text-gray-500">·</span>
                              <span className="text-gray-500" suppressHydrationWarning>{isMounted && r.timestamp ? formatTimestamp(r.timestamp) : ''}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words">
                              {renderContentWithMentions(r.content)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {/* Loading indicator & sentinel */}
        <div className="p-4 text-center text-gray-500">
          {isLoadingMore ? 'Loading more…' : 'Scroll to load more'}
        </div>
        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
}
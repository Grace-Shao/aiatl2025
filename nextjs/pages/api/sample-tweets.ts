import { NextApiRequest, NextApiResponse } from 'next';

console.log('Sample tweets API route hit');

const sampleTweets = [
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
    mediaUrl: "https://example.com/sample-gif.gif",
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
    mediaUrl: "https://example.com/sample-meme.jpg",
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
];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json(sampleTweets);
}
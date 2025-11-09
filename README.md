# 🏈 HypeZone

> **All-in-one social media platform for sports fans worldwide!**

The AI-powered second screen that transforms how you experience live sports—never miss a key moment, meme, or hot take again.

---

## 🎯 The Problem

Sports fans face two massive pain points:
1. **Missing critical moments** - Looking away for 10 seconds and missing the game-changing touchdown
2. **Fragmented engagement** - Bouncing between ESPN for stats, Twitter for reactions, group chats for memes, and streaming services for video

Traditional sports platforms show you stats and scores, but they don't capture the **HYPE**—the real-time energy, the momentum shifts, the instant memes, and the collective roar of millions of fans watching the same play.

## 💡 Our Solution

**HypeZone** is an AI-powered second screen companion that solves both problems:

✨ **Smart AI Agents** automatically detect key moments, generate instant memes, send game updates, fact-check hot takes, and analyze player performance in real-time

🎬 **Interactive Timeline** syncs with video playback, showing exactly when touchdowns, interceptions, and game-changing plays happen

🚀 **Unified Social Experience** combines Twitter-style feeds, AI-generated content, group messaging, and live stats into one seamless platform

🤖 **Agentic AI Workflow** powered by multiple specialized agents working together to enhance engagement and keep fans in the loop

Starting with NFL (with plans to expand to NBA, MLB, soccer, and beyond), HypeZone is the ultimate sports companion for fans who refuse to miss the action.

---

## 🎬 What It Does

### 🔥 Real-Time Key Moment Detection
Our AI analyzes play-by-play data to predict and identify critical moments BEFORE and AS they happen:
- Touchdowns, interceptions, sacks, and game-winning plays
- Red zone opportunities and 4th down conversions
- Momentum shifts based on score differential and time remaining
- Injury updates and player performance milestones

### 🤖 Multi-Agent AI System
Five specialized AI agents work together to maximize user engagement:

1. **🎨 Meme Generator Agent** - Creates instant picture memes using Gemini Imagen 3.0 based on game events and user requests
2. **✅ Fact Checker Agent** - Verifies stats, records, and claims in real-time to settle debates
3. **💭 Opinion Agent** - Generates spicy hot takes and predictions to spark conversations
4. **📊 Game Statistics Agent** - Provides deep-dive player and team analytics on demand
5. **📧 Email Sender Agent** - Composes and sends AI-generated game updates to your friends via Resend API

All agents are orchestrated intelligently based on user mentions of **@PrizePicksAI** in the social feed, with responses automatically saved and persisted.

### 📱 Unified Social Media Feed
Twitter-style interface with enhanced features:
- **@mention autocomplete** for seamless AI interaction
- **Real-time meme generation** with images saved to `/public/generated-memes/`
- **GIF and media support** with persistent storage in MongoDB
- **Infinite scroll** for endless engagement
- **Verified badges** for official AI agents and bots
- **Timestamp sync** with server-side rendering and hydration handling

### ⏱️ Interactive Video Timeline
- Visual timeline synchronized with live game playback
- Click any key moment to jump directly to that play
- Color-coded markers for offensive, defensive, and special teams plays
- Criticality score visualization showing play importance
- Real-time event tracking with Game Event Tracker component

### 💬 Smart Messaging & Notifications
- **AI-composed emails** sent to friends with game highlights and scores
- **Key moment popups** that appear during critical plays
- **Live stats updates** posted by automated GameBot, StatsBot, and InjuryBot agents
- **Thread-based discussions** for organized conversations

### 🎮 Multi-Screen Experience
- Watch video on TV/laptop while tracking hype on mobile
- Synchronized state across devices
- Window messaging API for seamless communication

---

## 🛠️ How We Built It

### **Frontend Stack**
- **Next.js 14** with App Router for modern React architecture
- **TypeScript** for type safety and developer experience
- **Tailwind CSS** for responsive, utility-first styling
- **Radix UI** for accessible component primitives
- **React 19** with server components and client-side state management

### **Backend Stack**
- **FastAPI (Python)** for AI scoring API with play criticality analysis
- **Next.js API Routes** for serverless endpoints and orchestration
- **MongoDB** for persistent storage of threads, comments, and media
- **Resend API** for email delivery and notifications

### **AI/ML Stack**
- **Gemini 2.0 Flash Exp** for text generation (memes, opinions, fact-checking)
- **Gemini Imagen 3.0** for image generation (picture memes)
- **Hugging Face Transformers** for sentiment analysis on game transcripts
- **Custom AI Orchestrator** routes user requests to specialized agents
- **Agentic AI Architecture** with context-aware agent selection

### **Data Pipeline**
- **SportsData.io API** for play-by-play game data
- **Video transcript analysis** using sentiment scoring
- **Custom scoring algorithm** calculates play criticality based on:
  - Time remaining and quarter
  - Score differential
  - Field position (red zone, midfield, own territory)
  - Down and distance
  - Play type (offensive, defensive, special teams)
  - Game situation (2-minute drill, 4th down, etc.)

### **Key Features**
- **Multi-modal data sync** between video transcripts and play-by-play data
- **Server-side rendering** with hydration error handling
- **Real-time state management** using React hooks and context
- **Persistent media storage** with Base64 image encoding
- **API-based architecture** for scalability and modularity

---

## 💪 Challenges We Faced

### 1. **Multi-Modal Data Synchronization**
**Challenge:** Syncing data from two completely different sources:
- Video transcript with sentiment analysis timestamps
- SportsData.io play-by-play data with different time formats

**Solution:** Built a custom data normalization layer that maps both datasets to a unified timeline structure, allowing seamless switching between transcript-based and API-based event tracking.

### 2. **No Live Game Data During Hackathon**
**Challenge:** No live NFL games during the hackathon weekend meant we couldn't test with real-time streaming data.

**Solution:** We took on the additional challenge of simulating a real-time experience using historical game data, building a robust system that can easily switch to live APIs when games are in progress. This forced us to design a flexible architecture that works with both recorded and live data.

### 3. **AI Response Persistence**
**Challenge:** AI agent responses were appearing in the feed but disappearing after page refresh.

**Solution:** Implemented proper database persistence for all AI-generated content by ensuring every agent response is saved to MongoDB alongside user tweets, with proper media URL handling for generated images.

### 4. **React Hydration Errors**
**Challenge:** Server-side rendered timestamps and dynamic content caused hydration mismatches, especially with browser extensions modifying HTML attributes.

**Solution:** Strategic use of `suppressHydrationWarning` on HTML and body elements, combined with client-side timestamp initialization to avoid SSR/CSR conflicts.

### 5. **State Management Race Conditions**
**Challenge:** Sample tweets with GIFs were disappearing because infinite scroll `loadMore()` was firing before initial API data loaded, overwriting the state with empty arrays.

**Solution:** Added `initialLoadComplete` flag to prevent infinite scroll from triggering until initial data fetch completes, using `Promise.all()` to load both sample tweets and forum threads atomically.

### 6. **Complex AI Orchestration**
**Challenge:** Routing user requests to the right AI agent based on context and intent.

**Solution:** Built a sophisticated orchestrator that analyzes prompts using keyword matching and context to route to MemeGenerator, FactChecker, Opinion, GameStats, or EmailSender agents, with fallback handling and error recovery.

---

## 🏆 Accomplishments We're Proud Of

✅ **Built a production-ready platform** with multiple AI agents, real-time features, and polished UI in a hackathon timeframe

✅ **Solved real user engagement problems** for PrizePicks by creating sticky social features that keep users on the platform

✅ **Pioneered agentic AI for sports** with 5 specialized agents working together seamlessly

✅ **Achieved data sync across modalities** by unifying video transcripts and play-by-play APIs

✅ **Created persistent, database-backed social feed** with proper media storage and hydration handling

✅ **Designed beautiful, responsive UI** with Tailwind CSS, smooth animations, and Twitter-inspired interactions

✅ **Implemented autocomplete mentions** with dropdown suggestions and blue highlighting

✅ **Built scalable architecture** ready for multi-sport expansion

---

## 🚀 What's Next for HypeZone

### **Immediate Goals**
🔴 **Live data integration** - Connect to real-time NFL APIs for automatic play ingestion during live games

🎯 **Enhanced AI agents** - Add PlayPredictor, InjuryAnalyzer, and TradeRumorTracker agents

💬 **Private messaging** - Direct messages between users and group chat rooms

📈 **User analytics** - Track engagement metrics, popular moments, and viral memes

### **Mid-Term Goals**
🏀 **Multi-sport expansion** - Add NBA, MLB, NHL, soccer with sport-specific AI agents

📱 **Mobile apps** - Native iOS/Android with push notifications for key moments

🎮 **Gamification** - Prediction contests, leaderboards, and rewards for accurate calls

👥 **Social graph** - Follow friends, join fan communities, create watchparties

### **Long-Term Vision**
🌍 **Global sports coverage** - Premier League, Champions League, Cricket World Cup, Olympics

🤖 **Advanced ML models** - Train on historical data to improve moment prediction accuracy

💰 **Monetization** - Premium subscriptions, sponsored content, fantasy integration

🎥 **Live streaming partnerships** - Direct integration with ESPN+, DAZN, YouTube TV

📊 **Predictive analytics** - Win probability, player projections, betting insights

🏆 **Fantasy sports integration** - Track your fantasy players with real-time alerts

---

## 🎓 Tech Stack Summary

### **Frontend**
- Next.js 14 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Radix UI

### **Backend**
- FastAPI (Python)
- Next.js API Routes
- MongoDB

### **AI/ML**
- Gemini 2.0 Flash Exp
- Gemini Imagen 3.0
- Hugging Face Transformers
- Custom Agentic AI Orchestrator

### **APIs & Services**
- Resend (Email)
- SportsData.io (Game Data)
- Dicebear (Avatars)
- Giphy (GIFs)

### **Tools & Infrastructure**
- Git & GitHub
- npm/pnpm
- VS Code
- macOS development environment

---

## 👥 Team

Built with 🏈 by sports fans who refuse to miss the hype.

---

## 📝 License

MIT License - Built at AI ATL Hackathon 2025

---

**HypeZone** - Because sports are better when you're in the zone. 🔥

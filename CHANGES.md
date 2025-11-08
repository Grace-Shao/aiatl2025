# CodeCast - Implementation Summary

## Overview
Built a complete **CodeCast** application - a Live Pair Video Meetings Helper that uses Google Gemini AI to transcribe sessions, detect code references, generate highlights, and create PRs from commit history.

---

## 📦 Dependencies Added

### Core AI & API Libraries
- **`@google/generative-ai`** (v0.21.0) - Google's Gemini AI SDK for all AI operations
- **`@ai-sdk/google`** (v1.0.0) - Vercel AI SDK adapter for Google
- **`ai`** (v3.0.0) - Vercel AI SDK for AI operations

### GitHub & Git Integration
- **`@octokit/rest`** (v20.0.0) - GitHub REST API client for creating PRs and comments
- **`simple-git`** (v3.22.0) - Git operations (reading commit history, diffs)

### UI & Utilities
- **`lucide-react`** (v0.400.0) - Modern icon library
- **`date-fns`** (v3.0.0) - Date formatting utilities
- **`clsx`** (v2.1.0) - Conditional className utility

---

## 🏗️ Project Structure Created

### 1. **Type Definitions** (`app/types/index.ts`)
Defined TypeScript interfaces for:
- `Session` - Recording session data
- `TranscriptSegment` - Individual transcript entries with timestamps
- `Highlight` - AI-generated key points (decisions, discussions, action items)
- `CodeReference` - Detected file names and line numbers
- `Commit` - Git commit information
- `PRDraft` - Generated PR structure
- `PRComment` - PR review comments

### 2. **Gemini AI Services** (`app/lib/`)

#### `gemini-config.ts`
- Centralized Gemini API configuration
- Functions to get Gemini client and models
- Model selection: `gemini-1.5-pro` (for complex tasks) or `gemini-1.5-flash` (for fast tasks)
- Configuration presets for different use cases (transcription, highlights, PR generation)

#### `gemini-transcription.ts`
- **`transcribeWithGemini()`** - Processes transcript text and extracts:
  - Segmented transcript with timestamps
  - Code references (file names, line numbers)
  - Uses structured JSON prompts for reliable parsing
- **`detectCodeReferences()`** - Fast code reference detection using Gemini Flash
- Detects patterns like "app/page.tsx", "line 42", function names

#### `gemini-highlights.ts`
- **`generateHighlights()`** - Analyzes transcript to extract:
  - Key decisions made
  - Important discussion points
  - Action items
  - Categorizes by importance (high/medium/low)
- **`generateSessionSummary()`** - Creates 2-3 paragraph summary of session

#### `gemini-pr-generator.ts`
- **`generatePRFromCommits()`** - Takes commit history and generates:
  - PR title and description
  - Code review comments
  - List of changed files
  - Uses Gemini to analyze commits and create comprehensive PR
- **`generatePRFromDiff()`** - Generates PR from git diff text
- **Text-only mode** - No video required, just commit history or diff

### 3. **Git & GitHub Services** (`app/lib/`)

#### `git.ts`
- **`getLocalCommitHistory()`** - Reads commit history from local repo
- **`getDiff()`** - Gets diff between branches/commits
- **`getChangedFiles()`** - Lists files changed between branches
- **`getCurrentBranch()`** - Gets current git branch

#### `github.ts`
- **`createDraftPR()`** - Creates draft PR on GitHub
- **`addPRComment()`** - Adds comments to PR (supports line comments)
- **`getRepoInfo()`** - Gets repository information
- **`getCommitHistory()`** - Gets commit history from GitHub API

### 4. **API Routes** (`app/api/`)

#### `transcribe/route.ts`
- POST endpoint that receives transcript text
- Calls Gemini to process and detect code references
- Returns structured transcript with code references

#### `highlights/route.ts`
- POST endpoint that receives transcript
- Uses Gemini to generate highlights
- Returns categorized highlights (decisions, discussions, action items)

#### `pr/generate/route.ts`
- POST endpoint for PR generation
- Supports 3 modes:
  - `auto` - Auto-detects from local git repo
  - `commits` - Uses provided commit history
  - `diff` - Uses provided diff text
- Returns complete PR draft

#### `github/create-pr/route.ts`
- POST endpoint to create draft PR on GitHub
- Takes owner, repo, and PR data
- Returns PR number and URL

#### `github/add-comment/route.ts`
- POST endpoint to add comments to PR
- Supports both line comments and general PR comments
- Can include video snippet URLs

#### `sessions/route.ts`
- GET - Lists all sessions
- POST - Creates new session
- PUT - Updates session (adds transcript, highlights, etc.)
- Currently uses in-memory storage (should use database in production)

### 5. **React Components** (`app/components/`)

#### `VideoRecorder.tsx`
- Browser-based video/audio recording using MediaRecorder API
- Real-time speech recognition for live transcription
- Recording controls (start, pause, stop)
- Shows recording timer
- Calls `onTranscriptUpdate` callback with live transcript

#### `TranscriptView.tsx`
- Displays transcript segments with timestamps
- Shows code references inline
- Clickable segments to jump to video timestamp
- Highlights active segment based on current video time
- Groups code references by file

#### `HighlightsPanel.tsx`
- Displays AI-generated highlights
- Color-coded by type (decision, discussion, action-item)
- Sorted by importance
- Clickable to jump to video timestamp
- Shows highlight count

#### `CodeReviewPanel.tsx`
- Shows all detected code references
- Groups by file name
- Expandable file sections
- Shows line numbers and context
- Clickable to navigate to specific files/lines

#### `PRGenerator.tsx`
- UI for generating PRs from commits
- Three input modes (auto, commits, diff)
- Displays generated PR with:
  - Title and description
  - Files changed
  - Review comments
- Export to GitHub button
- Export to JSON button

#### `SessionList.tsx`
- Lists all recorded sessions
- Shows session status (recording, processing, completed, failed)
- Displays metadata (date, highlight count, code references)
- Links to individual session pages

### 6. **Pages** (`app/`)

#### `page.tsx` (Home/Dashboard)
- Three-tab interface:
  - **Sessions** - List of all sessions
  - **Record** - Video recording interface
  - **Generate PR** - PR generation tool
- Navigation between tabs
- "New Session" button

#### `session/[id]/page.tsx` (Session Detail)
- Side-by-side layout:
  - **Left**: Video player + Transcript
  - **Right**: Highlights + Code Review
- Video playback with synchronized transcript
- "Process Session" button to generate highlights
- "Export to PR" button to send highlights to GitHub
- Real-time transcript updates during recording

### 7. **Configuration Updates**

#### `package.json`
- Updated name to "codecast"
- Added all required dependencies
- Kept existing Next.js, React, TypeScript setup

#### `app/layout.tsx`
- Updated metadata (title, description) for CodeCast

---

## 🔑 Key Features Implemented

### ✅ Video Recording
- Browser-based recording (no server upload needed initially)
- Real-time transcription using Web Speech API
- Automatic session creation

### ✅ AI Transcription & Code Detection
- Uses Gemini to process transcript
- Automatically detects:
  - File paths (e.g., "app/page.tsx")
  - Line numbers (e.g., "line 42")
  - Function/class names
- Timestamp synchronization

### ✅ AI Highlights Generation
- Extracts key discussion points
- Identifies decisions and action items
- Categorizes by importance
- Uses Gemini 1.5 Pro for quality analysis

### ✅ PR Generation (Text-Only)
- **No video required** - works with just commit history
- Analyzes commits and diffs
- Generates comprehensive PR descriptions
- Creates code review comments
- Can auto-detect from local git repo

### ✅ GitHub Integration
- Create draft PRs
- Add comments to existing PRs
- Export highlights as PR comments
- Support for video snippet URLs in comments

### ✅ Side-by-Side UI
- Video + synchronized transcript
- Code review panel
- Highlights panel
- All synchronized with timestamps

---

## 🚀 How It Works

### Recording Flow
1. User clicks "Start Recording"
2. Browser requests camera/microphone access
3. MediaRecorder captures video/audio
4. Web Speech API provides live transcription
5. Transcript sent to `/api/transcribe` for code detection
6. Code references extracted and displayed
7. On stop, video blob created

### Processing Flow
1. User clicks "Process Session"
2. Full transcript sent to `/api/highlights`
3. Gemini analyzes transcript and generates highlights
4. Highlights categorized and timestamped
5. Session updated with highlights

### PR Generation Flow
1. User selects mode (auto/commits/diff)
2. If auto, reads from local git repo
3. Sends data to `/api/pr/generate`
4. Gemini analyzes commits/diff
5. Generates PR title, description, comments
6. User can export to GitHub or download JSON

---

## 🔧 Environment Variables Needed

Create a `.env` file in the root directory with:

```
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

- **GEMINI_API_KEY**: Required. Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **GITHUB_TOKEN**: Optional (only needed for GitHub integration). Create at [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)

---

## 📝 Next Steps

1. **Install dependencies**: `npm install`
2. **Create `.env` file** with API keys
3. **Run dev server**: `npm run dev`
4. **Test recording**: Start a session and record
5. **Test PR generation**: Use the PR generator tab

---

## 🎯 Gemini Track Features

All AI features use **Google Gemini APIs**:
- ✅ Gemini 1.5 Pro for transcription and highlights
- ✅ Gemini 1.5 Flash for fast code detection
- ✅ Structured prompts for reliable JSON parsing
- ✅ Temperature settings optimized for each use case

---

## 💡 Design Decisions

1. **In-memory session storage** - Easy to replace with database later
2. **Browser-based recording** - No server storage needed initially
3. **Web Speech API** - Provides real-time transcription (can be enhanced with Gemini later)
4. **Structured JSON prompts** - Ensures reliable parsing from Gemini responses
5. **Side-by-side layout** - Optimal for pair programming review
6. **Text-only PR mode** - Works independently of video feature

---

## 🔄 Future Enhancements

- Replace in-memory storage with database
- Add video upload/storage
- Enhanced audio transcription using Gemini's audio capabilities
- GitHub OAuth for better authentication
- Real-time collaboration features
- Export to other platforms (GitLab, Bitbucket)


# CodeCast - Live Pair Video Meetings Helper

AI-powered tool for pair programming sessions that automatically transcribes video meetings, detects code references, highlights key discussion points, and generates PRs from commit history.

## Features

### 🎥 Video Recording & Transcription
- Record pair programming sessions with video and audio
- Automatic transcription using Gemini AI
- Real-time code reference detection (file names, line numbers)

### 🤖 AI-Powered Highlights
- Automatically extracts key discussion points
- Identifies important decisions and action items
- Categorizes highlights by importance

### 📝 PR Generation
- Generate detailed Pull Requests from commit history (text-only mode)
- AI analyzes commits and diffs to create comprehensive PR descriptions
- Includes code review comments and suggestions

### 🔗 GitHub Integration
- Export video snippets to PR comments
- Create draft PRs directly from the app
- Sync highlights with GitHub PRs

### 🎯 Side-by-Side View
- Video player with synchronized transcript
- Code review panel showing file references
- Highlights panel with key discussion points

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- GitHub Personal Access Token (optional, for GitHub integration)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd aiatl2025
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```
GEMINI_API_KEY=your_gemini_api_key_here
GITHUB_TOKEN=your_github_token_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Recording a Session

1. Click "Record" tab
2. Click "Start Recording" (grant camera/microphone permissions)
3. Record your pair programming session
4. Click "Stop Recording" when done
5. Click "Process Session" to generate highlights

### Generating a PR

1. Click "Generate PR" tab
2. Choose mode:
   - **Auto**: Automatically detects from local git repo
   - **Commits**: Provide commit history
   - **Diff**: Paste git diff text
3. Click "Generate PR"
4. Review the generated PR
5. Click "Create on GitHub" to publish

### Viewing Sessions

1. Click "Sessions" tab
2. View all recorded sessions
3. Click on a session to view details
4. Export highlights to GitHub PR comments

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **AI**: Google Gemini 1.5 Pro/Flash
- **Styling**: Tailwind CSS
- **Git**: simple-git
- **GitHub**: Octokit REST API
- **Icons**: Lucide React

## Project Structure

```
app/
├── api/              # API routes
│   ├── transcribe/   # Transcription endpoint
│   ├── highlights/   # AI highlights generation
│   ├── pr/           # PR generation
│   └── github/       # GitHub integration
├── components/       # React components
│   ├── VideoRecorder.tsx
│   ├── TranscriptView.tsx
│   ├── HighlightsPanel.tsx
│   ├── CodeReviewPanel.tsx
│   └── PRGenerator.tsx
├── lib/              # Services
│   ├── gemini-*.ts   # Gemini AI services
│   ├── github.ts     # GitHub API
│   └── git.ts        # Git operations
└── types/            # TypeScript types
```

## API Endpoints

- `POST /api/transcribe` - Process transcript and detect code references
- `POST /api/highlights` - Generate AI highlights from transcript
- `POST /api/pr/generate` - Generate PR from commits/diff
- `POST /api/github/create-pr` - Create draft PR on GitHub
- `POST /api/github/add-comment` - Add comment to PR
- `GET /api/sessions` - List all sessions
- `POST /api/sessions` - Create new session
- `PUT /api/sessions` - Update session

## Environment Variables

- `GEMINI_API_KEY` - Required. Your Google Gemini API key
- `GITHUB_TOKEN` - Optional. GitHub Personal Access Token for PR creation

## Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## License

MIT

## Acknowledgments

- Built for AI ATL Hackathon 2025
- Powered by Google Gemini AI
- Uses Next.js and Tailwind CSS

'use client';

import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { CodeReference } from '@/app/types';
import { FileCode, X, Play, Clock, Maximize2, Minimize2 } from 'lucide-react';

interface IDEEditorProps {
  codeReferences: CodeReference[];
  currentTime: number;
  onTimeJump?: (timestamp: number) => void;
  onCodeEdit?: (edit: import('@/app/types').CodeEdit) => void;
  readOnly?: boolean;
}

// Mock file system - simulates files that might be mentioned in pair programming sessions
const mockFiles: Record<string, string> = {
  'app/page.tsx': `import Image from "next/image";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex flex-col items-center gap-6">
        <h1 className="text-3xl font-bold">Welcome to CodeCast</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          AI-powered pair programming session assistant
        </p>
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg">
          Start Recording
        </button>
      </main>
    </div>
  );
}`,
  
  'app/components/VideoRecorder.tsx': `'use client';

import { useState, useRef, useEffect } from 'react';
import { Video, Square, Play, Pause } from 'lucide-react';

export default function VideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.start(1000);
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="space-y-4">
      <video ref={videoRef} autoPlay muted className="w-full rounded-lg" />
      <div className="flex gap-2">
        {!isRecording ? (
          <button onClick={startRecording}>Start Recording</button>
        ) : (
          <button onClick={stopRecording}>Stop Recording</button>
        )}
      </div>
    </div>
  );
}`,

  'app/lib/gemini-config.ts': `import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }
  return new GoogleGenerativeAI(apiKey);
}

// Get the appropriate model based on use case
export function getModel(modelName: 'pro' | 'flash' = 'pro') {
  const client = getGeminiClient();
  const model = modelName === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
  return client.getGenerativeModel({ model });
}`,

  'app/api/transcribe/route.ts': `import { NextRequest, NextResponse } from 'next/server';
import { transcribeWithGemini } from '@/app/lib/gemini-transcription';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, startTime = 0 } = body;
    
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript text is required' },
        { status: 400 }
      );
    }
    
    // Use Gemini to transcribe and detect code references
    const result = await transcribeWithGemini(transcript, startTime);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to process transcription' },
      { status: 500 }
    );
  }
}`,

  'README.md': `# CodeCast - Live Pair Video Meetings Helper

AI-powered tool for pair programming sessions.

## Features

- 🎥 Video Recording & Transcription
- 🤖 AI-Powered Highlights
- 📝 PR Generation
- 🔗 GitHub Integration
- 🎯 Side-by-Side View with Code Editor

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open http://localhost:3000 to view the app.
`,
};

export default function IDEEditor({
  codeReferences,
  currentTime,
  onTimeJump,
  onCodeEdit,
  readOnly = false,
}: IDEEditorProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState<string>('');
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const editorRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);

  // Get unique files from code references, or show all mock files if none
  const referencedFiles = Array.from(new Set(codeReferences.map(ref => ref.fileName)));
  const availableFiles = referencedFiles.length > 0 ? referencedFiles : Object.keys(mockFiles);

  // Auto-select first file if none selected
  useEffect(() => {
    if (!selectedFile && availableFiles.length > 0) {
      setSelectedFile(availableFiles[0]);
    }
  }, [availableFiles, selectedFile]);

  // Load file content when file is selected
  useEffect(() => {
    if (selectedFile) {
      // Get content from mock files
      const content = mockFiles[selectedFile] || `// File: ${selectedFile}\n// Content not available\n\n// This file was mentioned in the session but content is not loaded.\n// In production, this would fetch the actual file from your repository.`;
      setEditorContent(content);
    }
  }, [selectedFile]);

  // Highlight lines based on current time and code references
  useEffect(() => {
    if (!editorRef.current || !selectedFile) return;

    const editor = editorRef.current;
    const model = editor.getModel();
    if (!model) return;

    // Find code references for current file near current time (within 10 seconds)
    const relevantRefs = codeReferences.filter(
      ref => ref.fileName === selectedFile && 
      Math.abs(ref.timestamp - currentTime) < 10
    );

    // Clear previous decorations
    if (decorationsRef.current.length > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }

    // Add new decorations for highlighted lines
    if (relevantRefs.length > 0) {
      const ref = relevantRefs[0]; // Use the most recent reference
      if (ref.lineNumber) {
        const line = ref.lineNumber;
        const decorations = [
          {
            range: {
              startLineNumber: line,
              startColumn: 1,
              endLineNumber: line,
              endColumn: model.getLineMaxColumn(line),
            },
            options: {
              isWholeLine: true,
              className: 'bg-yellow-300 bg-opacity-20',
              glyphMarginClassName: 'bg-yellow-500',
              minimap: {
                color: '#fbbf24',
                position: 2, // Inline
              },
            },
          },
        ];
        decorationsRef.current = editor.deltaDecorations([], decorations);
        setHighlightedLine(line);
        
        // Scroll to line smoothly
        editor.revealLineInCenter(line, 1); // 1 = smooth scroll
      }
    } else {
      setHighlightedLine(null);
    }
  }, [currentTime, codeReferences, selectedFile]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: true },
      fontSize: 14,
      fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      wordWrap: 'on',
      lineNumbers: 'on',
      renderLineHighlight: 'all',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      readOnly: readOnly,
    });

    // Track content changes for code edit events
    if (!readOnly && onCodeEdit) {
      editor.onDidChangeModelContent((event: any) => {
        if (!event.changes || event.changes.length === 0) return;
        if (!selectedFile) return;

        // Process each change
        event.changes.forEach((change: any) => {
          const lineNumber = change.range.startLineNumber;
          const changeType = change.rangeLength === 0 ? 'add' : (change.text === '' ? 'delete' : 'modify');
          
          // Get the before and after text
          const before = change.rangeLength > 0 ? 
            editor.getModel()?.getValueInRange(change.range) || '' : 
            undefined;
          const after = change.text || undefined;

          const edit: import('@/app/types').CodeEdit = {
            id: `edit-${Date.now()}-${Math.random()}`,
            timestamp: currentTime,
            fileName: selectedFile,
            lineNumber: lineNumber,
            changeType: changeType,
            before: before,
            after: after,
            linesBefore: change.range.endLineNumber - change.range.startLineNumber + 1,
            linesAfter: change.text.split('\n').length,
          };

          onCodeEdit(edit);
        });
      });
    }
  };

  const getLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'json': 'json',
      'css': 'css',
      'scss': 'scss',
      'html': 'html',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'c': 'c',
      'cpp': 'cpp',
      'rb': 'ruby',
      'php': 'php',
    };
    return langMap[ext || ''] || 'plaintext';
  };

  const handleFileClick = (fileName: string) => {
    setSelectedFile(fileName);
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.jsx')) {
      return '⚛️';
    } else if (fileName.endsWith('.ts') || fileName.endsWith('.js')) {
      return '📜';
    } else if (fileName.endsWith('.md')) {
      return '📝';
    } else if (fileName.endsWith('.json')) {
      return '🔧';
    } else if (fileName.endsWith('.css') || fileName.endsWith('.scss')) {
      return '🎨';
    }
    return '📄';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col bg-[#1e1e1e] ${isFullscreen ? 'fixed inset-0 z-50' : 'h-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between bg-[#252526] border-b border-[#3e3e42] px-4 py-2">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">Code Editor</h3>
        </div>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 hover:bg-[#3e3e42] rounded text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* File Tabs */}
      <div className="flex items-center gap-0.5 bg-[#252526] border-b border-[#3e3e42] overflow-x-auto">
        {availableFiles.map((file) => (
          <button
            key={file}
            onClick={() => handleFileClick(file)}
            className={`flex items-center gap-2 px-3 py-2 text-sm border-r border-[#3e3e42] transition-colors whitespace-nowrap ${
              selectedFile === file
                ? 'bg-[#1e1e1e] text-white border-t-2 border-t-blue-500'
                : 'bg-[#2d2d30] text-gray-400 hover:bg-[#37373d]'
            }`}
          >
            <span>{getFileIcon(file)}</span>
            <span className="font-mono text-xs">{file.split('/').pop()}</span>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        {selectedFile ? (
          <>
            <Editor
              height="100%"
              language={getLanguage(selectedFile)}
              value={editorContent}
              theme="vs-dark"
              onChange={(value) => setEditorContent(value || '')}
              onMount={handleEditorDidMount}
              options={{
                readOnly: readOnly,
                minimap: { enabled: true },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                glyphMargin: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
            
            {/* Floating time indicator when line is highlighted */}
            {highlightedLine && (
              <div className="absolute top-4 right-4 bg-yellow-500 bg-opacity-95 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-lg flex items-center gap-2 animate-pulse">
                <Clock className="w-4 h-4" />
                <span>Line {highlightedLine} • {formatTime(currentTime)}</span>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No file selected</p>
              <p className="text-sm">Files mentioned in the session will appear in tabs above</p>
            </div>
          </div>
        )}
      </div>

      {/* Code References Timeline */}
      {codeReferences.length > 0 && selectedFile && (
        <div className="bg-[#252526] border-t border-[#3e3e42] p-3 max-h-32 overflow-y-auto">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Play className="w-3 h-3" />
            <span className="font-semibold">Timeline: {selectedFile.split('/').pop()}</span>
            <span className="text-gray-500">
              ({codeReferences.filter(ref => ref.fileName === selectedFile).length} references)
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {codeReferences
              .filter(ref => ref.fileName === selectedFile)
              .sort((a, b) => a.timestamp - b.timestamp)
              .map((ref) => (
                <button
                  key={ref.id}
                  onClick={() => onTimeJump?.(ref.timestamp)}
                  className={`px-3 py-1.5 rounded text-xs transition-all font-mono ${
                    Math.abs(ref.timestamp - currentTime) < 2
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-[#3e3e42] text-gray-300 hover:bg-[#4a4a4f] hover:text-white'
                  }`}
                  title={ref.context || 'Jump to this moment'}
                >
                  <span className="font-bold">L{ref.lineNumber || '?'}</span>
                  <span className="mx-1">@</span>
                  <span>{formatTime(ref.timestamp)}</span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}


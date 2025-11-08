'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Download, Send, Loader2 } from 'lucide-react';
import VideoRecorder from '@/app/components/VideoRecorder';
import UnifiedTranscript from '@/app/components/UnifiedTranscript';
import HighlightsPanel from '@/app/components/HighlightsPanel';
import IDEEditor from '@/app/components/IDEEditor';
import type { Session, TranscriptSegment, CodeReference, Highlight, TranscriptEvent, CodeEdit } from '@/app/types';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.id as string;
  
  const [session, setSession] = useState<Session | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [codeReferences, setCodeReferences] = useState<CodeReference[]>([]);
  const [codeEdits, setCodeEdits] = useState<CodeEdit[]>([]);
  const [events, setEvents] = useState<TranscriptEvent[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchSession();
  }, [sessionId]);

  const fetchSession = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      const found = data.sessions?.find((s: Session) => s.id === sessionId);
      if (found) {
        setSession(found);
        setTranscript(found.transcript || []);
        setCodeReferences(found.codeReferences || []);
        setCodeEdits(found.codeEdits || []);
        setEvents(found.events || []);
        setHighlights(found.highlights || []);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTranscriptUpdate = async (text: string) => {
    // Add speech event to unified timeline
    const speechEvent: TranscriptEvent = {
      id: `speech-${Date.now()}`,
      timestamp: currentTime,
      type: 'speech',
      data: {
        id: `seg-${Date.now()}`,
        timestamp: currentTime,
        text: text,
      },
    };
    setEvents(prev => [...prev, speechEvent]);
    
    // Send transcript to API for processing
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: text,
          startTime: currentTime,
        }),
      });

      const data = await response.json();
      setTranscript(data.transcript || transcript);
      setCodeReferences(prev => [...prev, ...(data.codeReferences || [])]);
    } catch (error) {
      console.error('Error processing transcript:', error);
    }
  };

  const handleCodeEdit = (edit: CodeEdit) => {
    // Add code edit event to unified timeline
    const editEvent: TranscriptEvent = {
      id: edit.id,
      timestamp: edit.timestamp,
      type: 'code-edit',
      data: edit,
    };
    setEvents(prev => [...prev, editEvent]);
    setCodeEdits(prev => [...prev, edit]);
  };

  const processSession = async () => {
    if (!session || transcript.length === 0) return;
    
    setProcessing(true);
    try {
      // Generate highlights
      const fullText = transcript.map(s => s.text).join(' ');
      const highlightsResponse = await fetch('/api/highlights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullText,
          codeReferences,
        }),
      });

      const highlightsData = await highlightsResponse.json();
      setHighlights(highlightsData.highlights || []);

      // Update session
      await fetch('/api/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sessionId,
          transcript,
          codeReferences,
          highlights: highlightsData.highlights,
          status: 'completed',
        }),
      });

      fetchSession();
    } catch (error) {
      console.error('Error processing session:', error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSegmentClick = (timestamp: number) => {
    setCurrentTime(timestamp);
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const exportToPR = async () => {
    if (!session) return;

    const owner = prompt('GitHub owner/org:');
    const repo = prompt('Repository name:');
    const prNumber = prompt('PR number (optional):');

    if (!owner || !repo) return;

    try {
      // Create comments from highlights
      const comments = highlights.slice(0, 5).map(highlight => ({
        path: codeReferences[0]?.fileName || 'README.md',
        line: codeReferences[0]?.lineNumber || 1,
        body: `**${highlight.type}**: ${highlight.text}\n\n[Video timestamp: ${Math.floor(highlight.timestamp)}s]`,
        timestamp: highlight.timestamp,
      }));

      if (prNumber) {
        // Add comments to existing PR
        for (const comment of comments) {
          await fetch('/api/github/add-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              owner,
              repo,
              prNumber: parseInt(prNumber),
              comment,
            }),
          });
        }
        alert('Comments added to PR!');
      } else {
        alert('Please provide a PR number to add comments.');
      }
    } catch (error) {
      console.error('Error exporting to PR:', error);
      alert('Failed to export to PR.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Session not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{session.title}</h1>
              <p className="text-sm text-gray-500">
                {new Date(session.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex gap-2">
              {session.status === 'recording' && transcript.length > 0 && (
                <button
                  onClick={processSession}
                  disabled={processing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Process Session'
                  )}
                </button>
              )}
              {highlights.length > 0 && (
                <button
                  onClick={exportToPR}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Send className="w-4 h-4" />
                  Export to PR
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* Left Column: Video + Unified Transcript */}
          <div className="space-y-4 flex flex-col">
            <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <VideoRecorder
                onTranscriptUpdate={handleTranscriptUpdate}
              />
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <UnifiedTranscript
                events={events}
                currentTime={currentTime}
                onEventClick={handleSegmentClick}
              />
            </div>
          </div>

          {/* Right Column: IDE + Highlights */}
          <div className="space-y-4 flex flex-col">
            <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <IDEEditor
                codeReferences={codeReferences}
                currentTime={currentTime}
                onTimeJump={handleSegmentClick}
                onCodeEdit={handleCodeEdit}
                readOnly={false}
              />
            </div>
            <div className="flex-1 border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <HighlightsPanel
                highlights={highlights}
                onHighlightClick={handleSegmentClick}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


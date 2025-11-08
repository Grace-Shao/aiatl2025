'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Video, GitBranch, Plus, ArrowRight } from 'lucide-react';
import VideoRecorder from './components/VideoRecorder';
import PRGenerator from './components/PRGenerator';
import SessionList from './components/SessionList';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'sessions' | 'record' | 'pr'>('sessions');
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStartSession = async () => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Session ${new Date().toLocaleString()}`,
        }),
      });

      const data = await response.json();
      setSessionId(data.session.id);
      setActiveTab('record');
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <header className="bg-white dark:bg-gray-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold">CodeCast</h1>
              <span className="text-sm text-gray-500">Live Pair Video Meetings Helper</span>
            </div>
            <nav className="flex gap-4">
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'sessions'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Sessions
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'record'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Record
              </button>
              <button
                onClick={() => setActiveTab('pr')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'pr'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Generate PR
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recording Sessions</h2>
              <button
                onClick={handleStartSession}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Session
              </button>
            </div>
            <SessionList />
          </div>
        )}

        {activeTab === 'record' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Record New Session</h2>
              <VideoRecorder
                onRecordingComplete={(blob) => {
                  console.log('Recording complete:', blob);
                  // Handle recording completion
                }}
                onTranscriptUpdate={(text) => {
                  console.log('Transcript update:', text);
                  // Handle transcript updates
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'pr' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Generate PR from Commits</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Use AI to generate detailed Pull Requests from your commit history. 
                No video required - just provide commit history or diff text.
              </p>
              <PRGenerator />
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>CodeCast - AI-powered pair programming session assistant</p>
          <p className="mt-2">Powered by Google Gemini AI</p>
        </div>
      </footer>
    </div>
  );
}

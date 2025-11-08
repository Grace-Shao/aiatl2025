'use client';

import { useState } from 'react';
import { GitBranch, Loader2, Download, Send } from 'lucide-react';
import type { PRDraft } from '@/app/types';

interface PRGeneratorProps {
  onPRGenerated?: (pr: PRDraft) => void;
}

export default function PRGenerator({ onPRGenerated }: PRGeneratorProps) {
  const [mode, setMode] = useState<'auto' | 'commits' | 'diff'>('auto');
  const [loading, setLoading] = useState(false);
  const [pr, setPR] = useState<PRDraft | null>(null);
  const [diffText, setDiffText] = useState('');
  const [baseBranch, setBaseBranch] = useState('main');
  const [headBranch, setHeadBranch] = useState('feature');

  const generatePR = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          diff: mode === 'diff' ? diffText : undefined,
          baseBranch,
          headBranch,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PR');
      }

      const data = await response.json();
      setPR(data.pr);
      onPRGenerated?.(data.pr);
    } catch (error) {
      console.error('Error generating PR:', error);
      alert('Failed to generate PR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToGitHub = async () => {
    if (!pr) return;
    
    const owner = prompt('GitHub owner/org:');
    const repo = prompt('Repository name:');
    
    if (!owner || !repo) return;

    try {
      const response = await fetch('/api/github/create-pr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, pr }),
      });

      if (!response.ok) {
        throw new Error('Failed to create PR');
      }

      const data = await response.json();
      window.open(data.url, '_blank');
      alert('PR created successfully!');
    } catch (error) {
      console.error('Error creating PR:', error);
      alert('Failed to create PR on GitHub.');
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Generate PR from Commits</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="w-full px-3 py-2 border rounded px-3 py-2"
          >
            <option value="auto">Auto-detect from local repo</option>
            <option value="commits">From commit history</option>
            <option value="diff">From diff text</option>
          </select>
        </div>

        {mode === 'diff' && (
          <div>
            <label className="block text-sm font-medium mb-2">Diff Text</label>
            <textarea
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
              placeholder="Paste git diff here..."
              className="w-full h-40 px-3 py-2 border rounded font-mono text-sm"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Base Branch</label>
            <input
              type="text"
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Head Branch</label>
            <input
              type="text"
              value={headBranch}
              onChange={(e) => setHeadBranch(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <button
          onClick={generatePR}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <GitBranch className="w-4 h-4" />
              Generate PR
            </>
          )}
        </button>
      </div>

      {pr && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Generated PR</h3>
            <div className="flex gap-2">
              <button
                onClick={exportToGitHub}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
                Create on GitHub
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(pr, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'pr-draft.json';
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Title</label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                {pr.title}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Description</label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap">{pr.body}</pre>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">Files Changed</label>
              <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <ul className="list-disc list-inside space-y-1">
                  {pr.files.map((file, idx) => (
                    <li key={idx} className="font-mono text-sm">{file}</li>
                  ))}
                </ul>
              </div>
            </div>

            {pr.comments && pr.comments.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-600">Review Comments</label>
                <div className="mt-1 space-y-2">
                  {pr.comments.map((comment, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-sm font-mono text-gray-600 mb-1">
                        {comment.path}:{comment.line}
                      </div>
                      <div className="text-sm">{comment.body}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


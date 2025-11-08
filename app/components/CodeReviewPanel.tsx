'use client';

import { useState } from 'react';
import type { CodeReference } from '@/app/types';
import { FileCode, Code } from 'lucide-react';

interface CodeReviewPanelProps {
  codeReferences: CodeReference[];
  onFileClick?: (fileName: string, lineNumber?: number) => void;
}

export default function CodeReviewPanel({
  codeReferences,
  onFileClick,
}: CodeReviewPanelProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const groupedRefs = codeReferences.reduce((acc, ref) => {
    if (!acc[ref.fileName]) {
      acc[ref.fileName] = [];
    }
    acc[ref.fileName].push(ref);
    return acc;
  }, {} as Record<string, CodeReference[]>);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5" />
          <h3 className="font-semibold">Code References</h3>
          <span className="ml-auto text-sm text-gray-500">
            {codeReferences.length} references
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {codeReferences.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No code references detected yet.</p>
            <p className="text-sm mt-1">Code mentions will appear here during recording.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedRefs).map(([fileName, refs]) => (
              <div
                key={fileName}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => {
                    setSelectedFile(selectedFile === fileName ? null : fileName);
                    onFileClick?.(fileName);
                  }}
                  className="w-full p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span className="font-mono text-sm font-medium">{fileName}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {refs.length} reference{refs.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {selectedFile === fileName && (
                  <div className="p-3 bg-white dark:bg-gray-900 space-y-2 border-t">
                    {refs.map((ref) => (
                      <div
                        key={ref.id}
                        onClick={() => onFileClick?.(ref.fileName, ref.lineNumber)}
                        className="p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          {ref.lineNumber && (
                            <span className="text-xs font-mono text-blue-600 dark:text-blue-400">
                              Line {ref.lineNumber}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(ref.timestamp)}
                          </span>
                        </div>
                        {ref.context && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {ref.context}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


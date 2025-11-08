export interface Session {
  id: string;
  title: string;
  createdAt: Date;
  videoUrl?: string;
  transcript?: TranscriptSegment[];
  codeEdits?: CodeEdit[];
  events?: TranscriptEvent[];
  highlights?: Highlight[];
  codeReferences?: CodeReference[];
  status: 'recording' | 'processing' | 'completed' | 'failed';
}

export interface TranscriptSegment {
  id: string;
  timestamp: number;
  text: string;
  speaker?: string;
}

export interface CodeEdit {
  id: string;
  timestamp: number;
  fileName: string;
  lineNumber: number;
  changeType: 'add' | 'modify' | 'delete';
  before?: string;
  after?: string;
  linesBefore?: number;
  linesAfter?: number;
}

export interface TranscriptEvent {
  id: string;
  timestamp: number;
  type: 'speech' | 'code-edit';
  data: TranscriptSegment | CodeEdit;
}

export interface Highlight {
  id: string;
  timestamp: number;
  text: string;
  type: 'decision' | 'discussion' | 'action-item';
  importance: 'high' | 'medium' | 'low';
}

export interface CodeReference {
  id: string;
  timestamp: number;
  fileName: string;
  lineNumber?: number;
  context?: string;
}

export interface Commit {
  sha: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
}

export interface PRDraft {
  title: string;
  body: string;
  base: string;
  head: string;
  files: string[];
  comments?: PRComment[];
}

export interface PRComment {
  path: string;
  line: number;
  body: string;
  videoSnippetUrl?: string;
  timestamp?: number;
}


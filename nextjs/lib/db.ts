import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'forum.json');

type Comment = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  votes: number;
};

type Thread = {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  timestamp: string;
  votes: number;
  createdAt: number;
  comments: Comment[];
};

type DB = {
  threads: Thread[];
};

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ threads: [] }, null, 2));
  }
}

export async function readDb(): Promise<DB> {
  ensureDb();
  const raw = await fs.promises.readFile(DB_PATH, 'utf-8');
  return JSON.parse(raw) as DB;
}

export async function writeDb(db: DB): Promise<void> {
  ensureDb();
  await fs.promises.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export async function getThreads(): Promise<Thread[]> {
  const db = await readDb();
  return db.threads;
}

export async function addThread(t: Omit<Thread, 'comments' | 'createdAt'>): Promise<Thread> {
  const db = await readDb();
  const thread: Thread = {
    ...t,
    comments: [],
    createdAt: Date.now(),
  };
  db.threads.unshift(thread);
  await writeDb(db);
  return thread;
}

export async function addComment(threadId: string, c: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment | null> {
  const db = await readDb();
  const thread = db.threads.find(t => t.id === threadId);
  if (!thread) return null;
  const comment: Comment = {
    id: `c-${Date.now()}`,
    text: c.text,
    author: c.author,
    timestamp: new Date().toISOString(),
    votes: c.votes ?? 0,
  };
  thread.comments.push(comment);
  await writeDb(db);
  return comment;
}

export async function voteThread(threadId: string, delta: number): Promise<Thread | null> {
  const db = await readDb();
  const thread = db.threads.find(t => t.id === threadId);
  if (!thread) return null;
  thread.votes = (thread.votes ?? 0) + delta;
  await writeDb(db);
  return thread;
}

export async function voteComment(threadId: string, commentId: string, delta: number): Promise<Comment | null> {
  const db = await readDb();
  const thread = db.threads.find(t => t.id === threadId);
  if (!thread) return null;
  const comment = thread.comments.find(c => c.id === commentId);
  if (!comment) return null;
  comment.votes = (comment.votes ?? 0) + delta;
  await writeDb(db);
  return comment;
}

import { MongoClient, Db, Collection } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB || 'forum';

console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY);

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

let client: MongoClient | null = null;
let db: Db | null = null;

async function connectDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI, { tls: true, tlsInsecure: false });
  await client.connect();
  db = client.db(DB_NAME);
  return db;
}

function getThreadsCollection(): Promise<Collection<Thread>> {
  return connectDb().then(db => db.collection<Thread>('threads'));
}

export async function getThreads(): Promise<Thread[]> {
  const collection = await getThreadsCollection();
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function addThread(t: Omit<Thread, 'comments' | 'createdAt'>): Promise<Thread> {
  const collection = await getThreadsCollection();
  const thread: Thread = {
    ...t,
    comments: [],
    createdAt: Date.now(),
  };
  await collection.insertOne(thread);
  return thread;
}

export async function addComment(threadId: string, c: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment | null> {
  const collection = await getThreadsCollection();
  const comment: Comment = {
    id: `c-${Date.now()}`,
    text: c.text,
    author: c.author,
    timestamp: new Date().toISOString(),
    votes: c.votes ?? 0,
  };
  
  const result = await collection.updateOne(
    { id: threadId },
    { $push: { comments: comment } }
  );
  
  return result.matchedCount > 0 ? comment : null;
}

export async function voteThread(threadId: string, delta: number): Promise<Thread | null> {
  const collection = await getThreadsCollection();
  const result = await collection.findOneAndUpdate(
    { id: threadId },
    { $inc: { votes: delta } },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

export async function voteComment(threadId: string, commentId: string, delta: number): Promise<Comment | null> {
  const collection = await getThreadsCollection();
  const result = await collection.findOneAndUpdate(
    { id: threadId, 'comments.id': commentId },
    { $inc: { 'comments.$.votes': delta } },
    { returnDocument: 'after' }
  );
  
  if (!result) return null;
  return result.comments.find(c => c.id === commentId) || null;
}

// Optional: Close connection (useful for serverless)
export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from '@/app/types';

// In-memory storage (replace with database in production)
const sessions: Map<string, Session> = new Map();

export async function GET(request: NextRequest) {
  const sessionsArray = Array.from(sessions.values());
  return NextResponse.json({ sessions: sessionsArray });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title } = body;
    
    const session: Session = {
      id: `session-${Date.now()}`,
      title: title || `Session ${new Date().toLocaleString()}`,
      createdAt: new Date(),
      status: 'recording',
    };
    
    sessions.set(session.id, session);
    
    return NextResponse.json({ session });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const session = sessions.get(id);
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const updated = { ...session, ...updates };
    sessions.set(id, updated);
    
    return NextResponse.json({ session: updated });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    );
  }
}


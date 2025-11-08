'use client';

import { useState, useEffect } from 'react';
import type { Session } from '@/app/types';
import { Video, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Session['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Video className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-gray-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No sessions yet.</p>
          <p className="text-sm mt-1">Start a new recording session to begin.</p>
        </div>
      ) : (
        sessions.map((session) => (
          <Link
            key={session.id}
            href={`/session/${session.id}`}
            className="block p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(session.status)}
                  <h3 className="font-semibold">{session.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                  {session.highlights && session.highlights.length > 0 && (
                    <span>{session.highlights.length} highlights</span>
                  )}
                  {session.codeReferences && session.codeReferences.length > 0 && (
                    <span>{session.codeReferences.length} code refs</span>
                  )}
                </div>
              </div>
              <div className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">
                {session.status}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}


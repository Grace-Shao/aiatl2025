"use client"

import { X, User, MessageSquarePlus } from "lucide-react"

import { Button } from "@/components/ui/button"

interface Message {
  id: string
  name: string
  preview: string
  timestamp: string
  hasUnread: boolean
}

const SAMPLE_MESSAGES: Message[] = [
  {
    id: "1",
    name: "Alex, Ryan, Maya",
    preview: "I think they're going to score",
    timestamp: "2m",
    hasUnread: true,
  },
  {
    id: "2",
    name: "The football BROS",
    preview: "YOO that was an awesome shottt",
    timestamp: "5m",
    hasUnread: true,
  },
  {
    id: "3",
    name: "Sports Fanatics",
    preview: "Did you see that play?",
    timestamp: "15m",
    hasUnread: false,
  },
  {
    id: "4",
    name: "Olivia",
    preview: "Sent",
    timestamp: "1h",
    hasUnread: false,
  },
  {
    id: "5",
    name: "Noah",
    preview: "That was incredible!",
    timestamp: "2h",
    hasUnread: true,
  },
]

interface MessagesPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function MessagesPanel({ isOpen, onClose }: MessagesPanelProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={onClose} />}
      {/* Slide-in Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-black border-l border-gray-800 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-white">Messages</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                // Handle create group chat
                console.log("Create group chat clicked")
              }}
              className="text-white hover:bg-gray-800"
              aria-label="Create group chat"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-gray-800">
            <X className="h-5 w-5" />
          </Button>
        </div>
        {/* Messages List */}
        <div className="overflow-y-auto h-full pb-20">
          {SAMPLE_MESSAGES.map((message) => (
            <div
              key={message.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-900 cursor-pointer transition-colors"
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="h-7 w-7 text-gray-400" />
                </div>
                {message.hasUnread && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 rounded-full border-2 border-black" />
                )}
              </div>
              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-white truncate">{message.name}</p>
                  <span className="text-xs text-gray-400 ml-2">{message.timestamp}</span>
                </div>
                <p className={`text-sm truncate ${message.hasUnread ? "text-white font-medium" : "text-gray-400"}`}>
                  {message.preview}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}


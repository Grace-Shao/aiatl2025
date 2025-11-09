"use client"

import { useState } from "react"
import { X, User, MessageSquarePlus, Mail, Send } from "lucide-react"

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
  const [emailModalOpen, setEmailModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailMessage, setEmailMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle")

  const handleSendEmail = async () => {
    if (!selectedUser || !emailSubject || !emailMessage) return

    setIsSending(true)
    setSendStatus("idle")

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedUser,
          subject: emailSubject,
          message: emailMessage,
        }),
      })

      if (response.ok) {
        setSendStatus("success")
        setTimeout(() => {
          setEmailModalOpen(false)
          setEmailSubject("")
          setEmailMessage("")
          setSendStatus("idle")
        }, 2000)
      } else {
        setSendStatus("error")
      }
    } catch (error) {
      console.error("Failed to send email:", error)
      setSendStatus("error")
    } finally {
      setIsSending(false)
    }
  }

  const openEmailModal = (userName: string) => {
    setSelectedUser(userName)
    setEmailModalOpen(true)
  }

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
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                  alt={message.name}
                  className="w-14 h-14 rounded-full bg-gray-700"
                />
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
              {/* Email Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  openEmailModal(message.name)
                }}
                className="text-purple-400 hover:text-purple-300 hover:bg-gray-800"
                aria-label="Send email"
              >
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Email Modal */}
      {emailModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Send Email to {selectedUser}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEmailModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">Message</label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Type your message..."
                  rows={6}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {sendStatus === "success" && (
                <div className="text-green-500 text-sm flex items-center gap-2">
                  <span className="text-xl">✓</span> Email sent successfully!
                </div>
              )}

              {sendStatus === "error" && (
                <div className="text-red-500 text-sm flex items-center gap-2">
                  <span className="text-xl">✗</span> Failed to send email. Please try again.
                </div>
              )}

              <Button
                onClick={handleSendEmail}
                disabled={!emailSubject || !emailMessage || isSending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


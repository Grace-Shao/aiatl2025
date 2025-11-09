"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface KeyMomentPopupProps {
  moment: {
    id: string
    time: number
    title: string
    description: string
  }
  onClose: () => void
  onMakePost: () => void
  onSendToGC: () => void
}

export function KeyMomentPopup({ moment, onClose, onMakePost, onSendToGC }: KeyMomentPopupProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{
        animation: "fadeIn 0.3s ease-in-out",
      }}
    >
      <Card
        className="relative w-full max-w-md p-6 border-2 border-primary/30 shadow-2xl"
        style={{
          animation: "zoomIn 0.3s ease-in-out",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors shadow-lg border-2 border-background"
          style={{
            top: "-8px",
            right: "-8px",
          }}
        >
          <X className="h-4 w-4 text-foreground" />
        </button>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-foreground text-balance">{moment.description}</h3>
        </div>

        {/* Meme placeholder */}
        <div className="mb-6 aspect-video bg-secondary/30 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🎬</div>
            <p className="text-sm text-muted-foreground">Meme</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={onMakePost}
            variant="outline"
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-primary/30"
          >
            Make Post
          </Button>
          <Button
            onClick={onSendToGC}
            variant="outline"
            className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border-primary/30"
          >
            Send to GC
          </Button>
        </div>
      </Card>
    </div>
  )
}


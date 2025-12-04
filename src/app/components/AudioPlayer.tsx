'use client'

import { useRef, useState } from 'react'

interface AudioPlayerProps {
  audioKey: string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function AudioPlayer({ audioKey }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] border-t border-[var(--color-muted)]/20 p-4">
      <audio
        ref={audioRef}
        src={`/audio/${encodeURIComponent(audioKey)}`}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div className="max-w-3xl mx-auto flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-muted)]/10 hover:bg-[var(--color-muted)]/20 flex items-center justify-center transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] tabular-nums w-10">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 rounded-full appearance-none cursor-pointer accent-[var(--color-accent)] dark:accent-[var(--color-accent-dark)]"
            style={{
              background: `linear-gradient(to right, var(--color-accent) ${progress}%, rgba(128, 128, 128, 0.3) ${progress}%)`,
            }}
          />
          <span className="text-xs text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] tabular-nums w-10 text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  )
}

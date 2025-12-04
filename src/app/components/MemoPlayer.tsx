'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import type { Word } from '../types'

interface MemoPlayerProps {
  audioKey: string
  transcript: string
  words: Word[]
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

export function MemoPlayer({ audioKey, transcript, words }: MemoPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const activeWordRef = useRef<HTMLSpanElement>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)

  // Find the current word index based on time
  const currentWordIndex = words.findIndex(
    (word, i) =>
      currentTime >= word.start &&
      (i === words.length - 1 || currentTime < words[i + 1].start)
  )

  // Auto-scroll to keep active word visible
  useEffect(() => {
    if (activeWordRef.current && transcriptRef.current) {
      const container = transcriptRef.current
      const activeWord = activeWordRef.current
      const containerRect = container.getBoundingClientRect()
      const wordRect = activeWord.getBoundingClientRect()

      // Check if word is outside visible area
      const isAbove = wordRect.top < containerRect.top
      const isBelow = wordRect.bottom > containerRect.bottom

      if (isAbove || isBelow) {
        activeWord.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentWordIndex])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }, [isPlaying])

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

  const handleWordClick = (word: Word) => {
    if (audioRef.current) {
      audioRef.current.currentTime = word.start
      setCurrentTime(word.start)
      if (!isPlaying) {
        audioRef.current.play()
      }
    }
  }

  const cyclePlaybackRate = () => {
    const currentIndex = PLAYBACK_RATES.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % PLAYBACK_RATES.length
    const newRate = PLAYBACK_RATES[nextIndex]
    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // If no words, fall back to plain transcript
  const hasWords = words.length > 0

  return (
    <div className="flex flex-col h-full">
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

      {/* Transcript */}
      <article
        ref={transcriptRef}
        className="flex-1 overflow-y-auto pb-24"
      >
        {hasWords ? (
          <p className="leading-relaxed">
            {words.map((word, i) => {
              const isActive = i === currentWordIndex
              const isPast = i < currentWordIndex

              return (
                <span
                  key={i}
                  ref={isActive ? activeWordRef : null}
                  onClick={() => handleWordClick(word)}
                  className={`cursor-pointer transition-colors hover:text-[var(--color-accent)] dark:hover:text-[var(--color-accent-dark)] ${
                    isActive
                      ? 'text-[var(--color-accent)] dark:text-[var(--color-accent-dark)] font-medium'
                      : isPast
                        ? 'text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]'
                        : ''
                  }`}
                >
                  {word.text}
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              )
            })}
          </p>
        ) : (
          <p className="whitespace-pre-wrap">{transcript}</p>
        )}
      </article>

      {/* Player controls */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)] border-t border-[var(--color-muted)]/20 p-4">
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

          <button
            onClick={cyclePlaybackRate}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-muted)]/10 hover:bg-[var(--color-muted)]/20 flex items-center justify-center transition-colors text-sm font-medium"
            aria-label={`Playback speed: ${playbackRate}x`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  )
}

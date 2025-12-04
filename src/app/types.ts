export interface Word {
  text: string
  start: number
  end: number
}

export interface MemoMetadata {
  title: string
  transcript?: string
  words?: Word[]
  transcribedAt?: string
  transcribing?: boolean
  jobId?: string // Unique ID to prevent duplicate transcriptions
}

// Transcribed memo (shown on index)
export interface Memo {
  id: string
  key: string
  title: string
  uploaded: Date
  transcript: string
  transcribedAt: string
}

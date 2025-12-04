import { env } from 'cloudflare:workers'
import type { Word } from '../types'

interface ElevenLabsResponse {
  text: string
  language_code?: string
  words?: Word[]
}

export interface TranscriptionResult {
  text: string
  words: Word[]
}

export async function transcribeAudio(
  audioData: ArrayBuffer,
  filename: string
): Promise<TranscriptionResult> {
  const apiKey = (env as unknown as { ELEVENLABS_API_KEY?: string }).ELEVENLABS_API_KEY
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not configured')
  }

  // Determine content type from filename
  const ext = filename.split('.').pop()?.toLowerCase()
  const contentTypes: Record<string, string> = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    webm: 'audio/webm',
  }
  const contentType = contentTypes[ext || ''] || 'audio/mp4'

  // Create form data
  const formData = new FormData()
  formData.append('file', new Blob([audioData], { type: contentType }), filename)
  formData.append('model_id', 'scribe_v1')

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Eleven Labs API error: ${response.status} ${errorText}`)
  }

  const result = (await response.json()) as ElevenLabsResponse
  return {
    text: result.text,
    words: result.words || [],
  }
}

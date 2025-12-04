import { render, route } from 'rwsdk/router'
import { defineApp } from 'rwsdk/worker'
import { env } from 'cloudflare:workers'

import { Document } from '@/app/Document'
import { setCommonHeaders } from '@/app/headers'
import { Home } from '@/app/pages/Home'
import { MemoPage } from '@/app/pages/MemoPage'
import { transcribeAudio } from '@/app/lib/transcribe'
import type { MemoMetadata } from '@/app/types'

export type AppContext = {}

const app = defineApp([
  setCommonHeaders(),
  ({ ctx }) => {
    ctx
  },
  // Serve audio files from R2
  route('/audio/:key', async ({ params }: { params: { key: string } }) => {
    const key = decodeURIComponent(params.key)
    const object = await env.R2.get(key)

    if (!object) {
      return new Response('Not found', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', object.httpMetadata?.contentType || 'audio/mp4')
    headers.set('Content-Length', object.size.toString())
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=31536000')

    return new Response(object.body, { headers })
  }),
  render(Document, [
    route('/', Home),
    route('/:id', ({ params }: { params: { id: string } }) => <MemoPage id={params.id} />),
  ]),
])

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<{ key: string; jobId: string }>) {
    for (const message of batch.messages) {
      const { key, jobId } = message.body
      console.log(`Processing transcription for: ${key} (job: ${jobId})`)

      try {
        // Check metadata first to see if we should process this job
        const metadataKey = key.replace(/\.[^.]+$/, '.json')
        const existingMetadataObject = await env.R2.get(metadataKey)

        if (existingMetadataObject) {
          const existingMetadata = (await existingMetadataObject.json()) as MemoMetadata

          // Already transcribed - skip
          if (existingMetadata.transcript) {
            console.log(`Already transcribed: ${key}`)
            message.ack()
            continue
          }

          // Different job won the race - skip
          if (existingMetadata.jobId !== jobId) {
            console.log(`Job ${jobId} lost race for ${key} (winner: ${existingMetadata.jobId})`)
            message.ack()
            continue
          }
        }

        const object = await env.R2.get(key)
        if (!object) {
          console.error(`File not found: ${key}`)
          message.ack()
          continue
        }

        const audioData = await object.arrayBuffer()
        const result = await transcribeAudio(audioData, key)

        const metadata: MemoMetadata = {
          title: key
            .replace(/\.[^.]+$/, '')
            .replace(/^\d+-/, '')
            .replace(/-/g, ' '),
          transcript: result.text,
          words: result.words,
          transcribedAt: new Date().toISOString(),
          transcribing: false,
        }

        await env.R2.put(metadataKey, JSON.stringify(metadata), {
          httpMetadata: { contentType: 'application/json' },
        })

        console.log(`Transcription complete for: ${key}`)
        message.ack()
      } catch (error) {
        console.error(`Transcription failed for ${key}:`, error)
        message.retry()
      }
    }
  },
}

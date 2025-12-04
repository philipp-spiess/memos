import { env } from 'cloudflare:workers'
import type { Memo, MemoMetadata } from '../types'

function extractId(key: string): string {
  return key.replace(/\.[^.]+$/, '')
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

async function getMemosAndEnqueuePending(): Promise<Memo[]> {
  const list = await env.R2.list()
  const memos: Memo[] = []

  for (const object of list.objects) {
    // Skip JSON metadata files
    if (object.key.endsWith('.json')) continue

    // Only include audio files
    if (!object.key.match(/\.(m4a|mp3|wav|ogg|webm)$/i)) continue

    const metadataKey = object.key.replace(/\.[^.]+$/, '.json')
    let metadata: MemoMetadata | null = null

    try {
      const metadataObject = await env.R2.get(metadataKey)
      if (metadataObject) {
        metadata = (await metadataObject.json()) as MemoMetadata
      }
    } catch {
      // No metadata file yet
    }

    // If has transcript, add to list
    if (metadata?.transcript && metadata?.transcribedAt) {
      const title =
        metadata.title ||
        object.key
          .replace(/\.[^.]+$/, '')
          .replace(/^\d+-/, '')
          .replace(/-/g, ' ')

      memos.push({
        id: extractId(object.key),
        key: object.key,
        title,
        uploaded: object.uploaded,
        transcript: metadata.transcript,
        transcribedAt: metadata.transcribedAt,
      })
    } else if (!metadata?.transcribing) {
      // Not transcribed and not currently transcribing - enqueue it
      // Generate unique job ID to prevent duplicate processing
      const jobId = crypto.randomUUID()

      const newMetadata: MemoMetadata = {
        title: object.key
          .replace(/\.[^.]+$/, '')
          .replace(/^\d+-/, '')
          .replace(/-/g, ' '),
        transcribing: true,
        jobId,
      }

      await env.R2.put(metadataKey, JSON.stringify(newMetadata), {
        httpMetadata: { contentType: 'application/json' },
      })

      // Enqueue with the jobId so consumer can verify it's the right job
      await env.TRANSCRIPTION_QUEUE.send({ key: object.key, jobId })
      console.log(`Enqueued transcription for: ${object.key} (job: ${jobId})`)
    }
  }

  // Sort by key (which includes the number prefix) - newest first
  memos.sort((a, b) => b.key.localeCompare(a.key))

  return memos
}

export async function Home() {
  const memos = await getMemosAndEnqueuePending()

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Memos</h1>

      {memos.length === 0 ? (
        <p className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)]">
          No transcribed memos yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {memos.map((memo) => (
            <li key={memo.id} className="flex items-baseline justify-between gap-4">
              <a
                href={`/${memo.id}`}
                className="text-[var(--color-accent)] dark:text-[var(--color-accent-dark)] hover:underline"
              >
                {memo.title}
              </a>
              <span className="text-[var(--color-muted)] dark:text-[var(--color-muted-dark)] text-sm whitespace-nowrap">
                {formatDate(memo.uploaded)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

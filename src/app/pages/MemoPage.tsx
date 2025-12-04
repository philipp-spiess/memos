import { env } from "cloudflare:workers";
import type { MemoMetadata, Word } from "../types";
import { MemoPlayer } from "../components/MemoPlayer";

interface MemoPageProps {
  id: string;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

async function getMemo(id: string) {
  // Find the audio file with this id
  const list = await env.R2.list({ prefix: id });

  const audioFile = list.objects.find(
    (obj) =>
      !obj.key.endsWith(".json") && obj.key.match(/\.(m4a|mp3|wav|ogg|webm)$/i)
  );

  if (!audioFile) {
    return null;
  }

  const metadataKey = audioFile.key.replace(/\.[^.]+$/, ".json");
  const metadataObject = await env.R2.get(metadataKey);

  if (!metadataObject) {
    return null;
  }

  const metadata = (await metadataObject.json()) as MemoMetadata;

  if (!metadata.transcript) {
    return null;
  }

  return {
    key: audioFile.key,
    id,
    title: metadata.title || id.replace(/^\d+-/, "").replace(/-/g, " "),
    uploaded: audioFile.uploaded,
    transcript: metadata.transcript,
    words: metadata.words || [],
  };
}

export async function MemoPage({ id }: MemoPageProps) {
  const memo = await getMemo(id);

  if (!memo) {
    return (
      <main className="min-h-screen p-8 max-w-3xl mx-auto">
        <a
          href="/"
          className="text-sm text-muted dark:text-muted-dark hover:text-accent dark:hover:text-accent-dark"
        >
          &larr; Back
        </a>
        <p className="mt-8 text-muted dark:text-muted-dark">
          Memo not found or not yet transcribed.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-8 max-w-3xl mx-auto w-full pb-32">
        <a
          href="/"
          className="text-sm text-muted dark:text-muted-dark hover:text-accent dark:hover:text-accent-dark"
        >
          &larr; Back
        </a>

        <header className="mt-8 mb-8">
          <h1 className="font-black text-xl text bg-linear-to-br/oklch from-accent dark:from-accent-dark text-pretty to-orange-300 bg-clip-text text-transparent">
            /{memo.id}
          </h1>
          <p className="text-muted dark:text-muted-dark mt-2">
            {formatDate(memo.uploaded)} • Philipp
          </p>
        </header>

        <MemoPlayer
          audioKey={memo.key}
          transcript={memo.transcript}
          words={memo.words}
        />
      </div>
    </main>
  );
}

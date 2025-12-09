import { env } from "cloudflare:workers";
import type { MemoDetail, MemoMetadata } from "../types";

function cleanId(id: string): string {
  // Strip query strings for lookup, but display id based on the actual object key
  return decodeURIComponent(id).split("?")[0];
}

export async function getMemoDetail(id: string): Promise<MemoDetail | null> {
  const clean = cleanId(id);

  const list = await env.R2.list({ prefix: clean });
  const audioFile = list.objects.find(
    (obj) => !obj.key.endsWith(".json") && obj.key.match(/\.(m4a|mp3|wav|ogg|webm)$/i),
  );

  if (!audioFile) return null;

  const metadataKey = audioFile.key.replace(/\.[^.]+$/, ".json");
  const metadataObject = await env.R2.get(metadataKey);
  if (!metadataObject) return null;

  const metadata = (await metadataObject.json()) as MemoMetadata;
  if (!metadata.transcript) return null;

  const displayId = audioFile.key.replace(/\.[^.]+$/, "");

  return {
    key: audioFile.key,
    id: displayId,
    title: metadata.title || displayId.replace(/^\d+-/, "").replace(/-/g, " "),
    uploaded: audioFile.uploaded,
    transcript: metadata.transcript,
    words: metadata.words || [],
  };
}

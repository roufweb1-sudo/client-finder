import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * A shared cache of Google Places results, kept on disk.
 *
 * Google bills per search request, so the same query asked twice is the same
 * money twice. An in-memory cache lost everything on each deploy and was never
 * shared between users; this one survives restarts and is shared by everyone,
 * which matters because users search the same towns and trades over and over.
 *
 * Kept well inside the 30 days Google's terms allow for caching place content.
 */
const TTL_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ENTRIES = 4000;
const FILE = join(process.cwd(), ".cache", "places.json");

type Entry = { at: number; data: unknown };

let memory: Map<string, Entry> | null = null;
let writeTimer: ReturnType<typeof setTimeout> | null = null;

async function load(): Promise<Map<string, Entry>> {
  if (memory) return memory;
  memory = new Map();
  try {
    const raw = JSON.parse(await readFile(FILE, "utf8")) as Record<string, Entry>;
    const now = Date.now();
    for (const [k, v] of Object.entries(raw)) if (now - v.at < TTL_MS) memory.set(k, v);
  } catch {
    /* no cache file yet, or it is unreadable - start empty */
  }
  return memory;
}

/** Batched so a burst of searches doesn't mean a burst of disk writes. */
function scheduleSave() {
  if (writeTimer) return;
  writeTimer = setTimeout(async () => {
    writeTimer = null;
    if (!memory) return;
    try {
      await mkdir(dirname(FILE), { recursive: true });
      await writeFile(FILE, JSON.stringify(Object.fromEntries(memory)), "utf8");
    } catch {
      /* disk full or read-only: the cache stays in memory, nothing breaks */
    }
  }, 5000);
}

export async function readCache(key: string): Promise<unknown | null> {
  const m = await load();
  const hit = m.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at >= TTL_MS) {
    m.delete(key);
    return null;
  }
  return hit.data;
}

export async function writeCache(key: string, data: unknown): Promise<void> {
  const m = await load();
  m.set(key, { at: Date.now(), data });
  // Drop the oldest entries once the file would get unwieldy.
  if (m.size > MAX_ENTRIES) {
    const oldestFirst = [...m.entries()].sort((a, b) => a[1].at - b[1].at);
    for (const [k] of oldestFirst.slice(0, m.size - MAX_ENTRIES)) m.delete(k);
  }
  scheduleSave();
}

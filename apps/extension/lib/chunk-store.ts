/**
 * IndexedDB crash backup for recordings. Chunks are appended as MediaRecorder
 * emits them, so a recording survives an offscreen/browser crash and can be
 * re-uploaded later. Shared by the offscreen document and the service worker
 * (same extension origin, same database).
 */

const DB_NAME = "roll-recordings";
const DB_VERSION = 1;
const CHUNKS = "chunks";
const RECORDINGS = "recordings";

export interface RecordingMeta {
  id: string;
  mimeType: string;
  createdAt: number;
  durationMs: number;
  /** false while still recording. */
  complete: boolean;
}

interface ChunkRecord {
  recordingId: string;
  index: number;
  data: Blob;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      const chunks = db.createObjectStore(CHUNKS, { keyPath: ["recordingId", "index"] });
      chunks.createIndex("byRecording", "recordingId");
      db.createObjectStore(RECORDINGS, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putRecordingMeta(meta: RecordingMeta): Promise<void> {
  const tx = (await openDb()).transaction(RECORDINGS, "readwrite");
  tx.objectStore(RECORDINGS).put(meta);
  await done(tx);
}

export async function getRecordingMeta(id: string): Promise<RecordingMeta | null> {
  const tx = (await openDb()).transaction(RECORDINGS, "readonly");
  return ((await result(tx.objectStore(RECORDINGS).get(id))) as RecordingMeta | undefined) ?? null;
}

export async function listRecordingMetas(): Promise<RecordingMeta[]> {
  const tx = (await openDb()).transaction(RECORDINGS, "readonly");
  return (await result(tx.objectStore(RECORDINGS).getAll())) as RecordingMeta[];
}

export async function appendChunk(recordingId: string, index: number, data: Blob): Promise<void> {
  const tx = (await openDb()).transaction(CHUNKS, "readwrite");
  tx.objectStore(CHUNKS).put({ recordingId, index, data } satisfies ChunkRecord);
  await done(tx);
}

export async function readRecordingBlob(recordingId: string): Promise<Blob | null> {
  const db = await openDb();
  const meta = await getRecordingMeta(recordingId);
  if (!meta) return null;
  const tx = db.transaction(CHUNKS, "readonly");
  const chunks = (await result(
    tx.objectStore(CHUNKS).index("byRecording").getAll(recordingId),
  )) as ChunkRecord[];
  if (chunks.length === 0) return null;
  chunks.sort((a, b) => a.index - b.index);
  return new Blob(
    chunks.map((c) => c.data),
    { type: meta.mimeType },
  );
}

export async function deleteRecording(recordingId: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction([CHUNKS, RECORDINGS], "readwrite");
  tx.objectStore(RECORDINGS).delete(recordingId);
  const range = IDBKeyRange.bound([recordingId, 0], [recordingId, Number.MAX_SAFE_INTEGER]);
  tx.objectStore(CHUNKS).delete(range);
  await done(tx);
}

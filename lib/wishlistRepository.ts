import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";

export type WishlistItem = {
  listing_id: string;
  name: string;
};

const DEFAULT_NAME = "รายการโปรด";

// When Postgres is unreachable (e.g. Docker isn't running in local dev) we fall
// back to a JSON file so the wishlist keeps working instead of returning 500.
const FALLBACK_PATH = path.join(process.cwd(), "data", "wishlists.json");

type FileRow = {
  user_id: string;
  listing_id: string;
  name: string;
  created_at: string;
};

// Create the table/column on first use, awaited before any query. Memoized, but
// reset on failure so a later request can retry once the DB comes back up.
let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS wishlists (
          user_id TEXT NOT NULL,
          listing_id TEXT NOT NULL,
          name TEXT NOT NULL DEFAULT '${DEFAULT_NAME}',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, listing_id)
        );
      `);
      await db.query(
        `ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '${DEFAULT_NAME}';`,
      );
    })().catch((err) => {
      schemaReady = null;
      throw err;
    });
  }
  return schemaReady;
}

export async function getWishlistListings(userId: string): Promise<WishlistItem[]> {
  try {
    await ensureSchema();
    const result = await db.query<WishlistItem>(
      `
        SELECT listing_id, name
        FROM wishlists
        WHERE user_id = $1
        ORDER BY created_at DESC
      `,
      [userId],
    );
    return result.rows;
  } catch {
    return fileGet(userId);
  }
}

export async function getWishlistListingIds(userId: string): Promise<string[]> {
  const listings = await getWishlistListings(userId);
  return listings.map((row) => row.listing_id);
}

export async function addWishlistListing(userId: string, listingId: string, name: string = DEFAULT_NAME) {
  const finalName = name.trim() || DEFAULT_NAME;
  try {
    await ensureSchema();
    await db.query(
      `
        INSERT INTO wishlists (user_id, listing_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (user_id, listing_id) DO UPDATE SET name = EXCLUDED.name
      `,
      [userId, listingId, finalName],
    );
  } catch {
    await fileAdd(userId, listingId, finalName);
  }
}

export async function removeWishlistListing(userId: string, listingId: string) {
  try {
    await ensureSchema();
    await db.query(
      `
        DELETE FROM wishlists
        WHERE user_id = $1 AND listing_id = $2
      `,
      [userId, listingId],
    );
  } catch {
    await fileRemove(userId, listingId);
  }
}

// --- JSON file fallback ---

async function fileReadAll(): Promise<FileRow[]> {
  try {
    const raw = await readFile(FALLBACK_PATH, "utf8");
    return JSON.parse(raw) as FileRow[];
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function fileWriteAll(rows: FileRow[]) {
  await mkdir(path.dirname(FALLBACK_PATH), { recursive: true });
  await writeFile(FALLBACK_PATH, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
}

async function fileGet(userId: string): Promise<WishlistItem[]> {
  const rows = await fileReadAll();
  return rows
    .filter((row) => row.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((row) => ({ listing_id: row.listing_id, name: row.name }));
}

async function fileAdd(userId: string, listingId: string, name: string) {
  const rows = await fileReadAll();
  const existing = rows.find((row) => row.user_id === userId && row.listing_id === listingId);
  if (existing) {
    existing.name = name;
  } else {
    rows.push({ user_id: userId, listing_id: listingId, name, created_at: new Date().toISOString() });
  }
  await fileWriteAll(rows);
}

async function fileRemove(userId: string, listingId: string) {
  const rows = await fileReadAll();
  const next = rows.filter((row) => !(row.user_id === userId && row.listing_id === listingId));
  await fileWriteAll(next);
}

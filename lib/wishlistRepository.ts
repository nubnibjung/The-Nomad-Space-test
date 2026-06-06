import { db } from "@/lib/db";

// Ensure the name column exists in wishlists table
db.query(`
  ALTER TABLE wishlists ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'รายการโปรด';
`).catch((err) => {
  console.error("Failed to add name column to wishlists table:", err);
});

export type WishlistItem = {
  listing_id: string;
  name: string;
};

export async function getWishlistListings(userId: string): Promise<WishlistItem[]> {
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
}

export async function getWishlistListingIds(userId: string): Promise<string[]> {
  const listings = await getWishlistListings(userId);
  return listings.map((row) => row.listing_id);
}

export async function addWishlistListing(userId: string, listingId: string, name: string = "รายการโปรด") {
  await db.query(
    `
      INSERT INTO wishlists (user_id, listing_id, name)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, listing_id) DO UPDATE SET name = EXCLUDED.name
    `,
    [userId, listingId, name.trim() || "รายการโปรด"],
  );
}

export async function removeWishlistListing(userId: string, listingId: string) {
  await db.query(
    `
      DELETE FROM wishlists
      WHERE user_id = $1 AND listing_id = $2
    `,
    [userId, listingId],
  );
}

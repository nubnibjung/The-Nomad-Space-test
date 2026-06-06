import { db } from "@/lib/db";

export async function getWishlistListingIds(userId: string) {
  const result = await db.query<{ listing_id: string }>(
    `
      SELECT listing_id
      FROM wishlists
      WHERE user_id = $1
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return result.rows.map((row) => row.listing_id);
}

export async function addWishlistListing(userId: string, listingId: string) {
  await db.query(
    `
      INSERT INTO wishlists (user_id, listing_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, listing_id) DO NOTHING
    `,
    [userId, listingId],
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

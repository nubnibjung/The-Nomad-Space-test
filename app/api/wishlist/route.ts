import { auth } from "@/auth";
import { LISTINGS } from "@/lib/data";
import { addWishlistListing, getWishlistListingIds, getWishlistListings, removeWishlistListing } from "@/lib/wishlistRepository";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const wishlists = await getWishlistListings(userId);
  const ids = wishlists.map((w) => w.listing_id);
  return Response.json({ ids, wishlists });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const listingId = body?.listingId;
  const name = body?.name;

  if (!listingId || typeof listingId !== "string" || !LISTINGS.some((l) => l.id === listingId)) {
    return Response.json({ message: "Invalid listing id" }, { status: 400 });
  }

  await addWishlistListing(userId, listingId, typeof name === "string" ? name : undefined);
  
  const wishlists = await getWishlistListings(userId);
  const ids = wishlists.map((w) => w.listing_id);
  return Response.json({ ids, wishlists });
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const listingId = body?.listingId;

  if (!listingId || typeof listingId !== "string" || !LISTINGS.some((l) => l.id === listingId)) {
    return Response.json({ message: "Invalid listing id" }, { status: 400 });
  }

  await removeWishlistListing(userId, listingId);

  const wishlists = await getWishlistListings(userId);
  const ids = wishlists.map((w) => w.listing_id);
  return Response.json({ ids, wishlists });
}

async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

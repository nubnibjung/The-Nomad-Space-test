import { auth } from "@/auth";
import { LISTINGS } from "@/lib/data";
import { addWishlistListing, getWishlistListingIds, removeWishlistListing } from "@/lib/wishlistRepository";

export const runtime = "nodejs";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const ids = await getWishlistListingIds(userId);
  return Response.json({ ids });
}

export async function POST(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const listingId = await getListingIdFromRequest(request);
  if (!listingId) return Response.json({ message: "Invalid listing id" }, { status: 400 });

  await addWishlistListing(userId, listingId);
  return Response.json({ ids: await getWishlistListingIds(userId) });
}

export async function DELETE(request: Request) {
  const userId = await getSessionUserId();
  if (!userId) return Response.json({ message: "Unauthorized" }, { status: 401 });

  const listingId = await getListingIdFromRequest(request);
  if (!listingId) return Response.json({ message: "Invalid listing id" }, { status: 400 });

  await removeWishlistListing(userId, listingId);
  return Response.json({ ids: await getWishlistListingIds(userId) });
}

async function getSessionUserId() {
  const session = await auth();
  return session?.user?.id ?? null;
}

async function getListingIdFromRequest(request: Request) {
  const body = await request.json().catch(() => null);
  const listingId = typeof body?.listingId === "string" ? body.listingId : "";
  return LISTINGS.some((listing) => listing.id === listingId) ? listingId : null;
}

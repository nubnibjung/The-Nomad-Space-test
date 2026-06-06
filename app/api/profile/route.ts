import { auth } from "@/auth";
import { updateUser } from "@/lib/userStore";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return Response.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, image } = body;
    if (name !== undefined && typeof name !== "string") {
      return Response.json({ error: "Name must be a string" }, { status: 400 });
    }
    if (image !== undefined && typeof image !== "string") {
      return Response.json({ error: "Image must be a string" }, { status: 400 });
    }

    const updatedUser = await updateUser(userId, { name, image });
    return Response.json({ success: true, user: updatedUser });
  } catch (error: any) {
    return Response.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}

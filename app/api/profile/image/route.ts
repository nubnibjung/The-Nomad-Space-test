import { NextRequest } from "next/server";
import { getUserById } from "@/lib/userStore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Missing id parameter", { status: 400 });
  }

  const user = await getUserById(id);
  if (!user || !user.image) {
    return new Response("Not found", { status: 404 });
  }

  const imageStr = user.image;

  // Handle standard URL (e.g. http:// or https://)
  if (imageStr.startsWith("http://") || imageStr.startsWith("https://")) {
    return Response.redirect(imageStr, 302);
  }

  // Handle data URI
  const matches = imageStr.match(/^data:([^;]+);([^,]+),(.*)$/);
  if (!matches) {
    return new Response("Invalid image data format", { status: 400 });
  }

  const contentType = matches[1];
  const encoding = matches[2];
  const rawData = matches[3];

  let buffer: Buffer;
  if (encoding === "base64") {
    buffer = Buffer.from(rawData, "base64");
  } else if (encoding.startsWith("utf8")) {
    const decoded = decodeURIComponent(rawData);
    buffer = Buffer.from(decoded, "utf8");
  } else {
    // Try to decode as raw text if not base64/utf8
    buffer = Buffer.from(rawData, "utf-8");
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, must-revalidate",
    },
  });
}

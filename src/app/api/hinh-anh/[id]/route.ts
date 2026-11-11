import { NextRequest } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return new Response("Missing id", { status: 400 });
  }

  try {
    const record = await db.hinhAnh.findUnique({
      where: { id },
      select: {
        duLieuBase64: true,
        mimeType: true,
      },
    });

    if (!record || !record.duLieuBase64) {
      return new Response("Not found", { status: 404 });
    }

    const base64Data = record.duLieuBase64.replace(
      /^data:image\/\w+;base64,/,
      ""
    );
    const buffer = Buffer.from(base64Data, "base64");

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": record.mimeType || "image/jpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving forum image:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}


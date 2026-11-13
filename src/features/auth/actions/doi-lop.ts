"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { COOKIE_LOP, laLopHopLe } from "@/lib/lop-context";

export async function doiLopAction(lopId: string) {
  if (!laLopHopLe(lopId)) {
    return { ok: false, message: "Lớp không hợp lệ" };
  }

  const session = await auth();
  if (session?.user?.id) {
    await db.nguoiDung.update({
      where: { id: session.user.id },
      data: { lopDangHocId: lopId },
    });
  }

  cookies().set(COOKIE_LOP, lopId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true, lopId };
}


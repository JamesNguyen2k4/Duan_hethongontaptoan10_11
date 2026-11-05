import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes không cần đăng nhập
const publicRoutes = ["/dang-nhap", "/dang-ky", "/quen-mat-khau"];

// Routes chỉ dành cho admin
const adminRoutes = ["/admin"];

// Routes chỉ dành cho giáo viên + admin
const teacherRoutes = ["/admin"];

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { nextUrl, auth: session } = req as NextRequest & {
    auth: { user?: { role?: string } } | null;
  };
  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const isPublicRoute = publicRoutes.some((r) =>
    nextUrl.pathname.startsWith(r)
  );

  // Đã đăng nhập mà vào trang auth → chuyển về dashboard
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Chưa đăng nhập mà vào route cần auth
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/dang-nhap", req.url);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Kiểm tra quyền admin
  if (
    adminRoutes.some((r) => nextUrl.pathname.startsWith(r)) &&
    role !== "QUAN_TRI" &&
    role !== "GIAO_VIEN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)",
  ],
};


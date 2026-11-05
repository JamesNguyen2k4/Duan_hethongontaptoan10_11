import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { dangNhapSchema } from "@/features/auth/schemas";
import { xacThucMatKhau } from "@/features/auth/actions/mat-khau";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/dang-nhap",
    error: "/dang-nhap",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        matKhau: { label: "Mật khẩu", type: "password" },
      },
      async authorize(credentials) {
        const validated = dangNhapSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, matKhau } = validated.data;

        const nguoiDung = await db.nguoiDung.findUnique({
          where: { email },
        });

        if (!nguoiDung || !nguoiDung.matKhauBam) return null;
        if (!nguoiDung.dangHoatDong) return null;

        const hopLe = await xacThucMatKhau(matKhau, nguoiDung.matKhauBam);
        if (!hopLe) return null;

        return {
          id: nguoiDung.id,
          email: nguoiDung.email,
          name: nguoiDung.tenHienThi,
          image: nguoiDung.anhDaiDien,
          role: nguoiDung.vaiTro,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});


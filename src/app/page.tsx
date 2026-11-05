import { redirect } from "next/navigation";

// Trang gốc → chuyển về dashboard (middleware sẽ xử lý nếu chưa đăng nhập)
export default function HomePage() {
  redirect("/dashboard");
}


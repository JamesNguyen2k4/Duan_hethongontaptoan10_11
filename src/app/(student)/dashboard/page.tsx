import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/dang-nhap");

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          Xin chào, {session.user?.name}! 👋
        </h1>
        <p className="text-muted-foreground mb-6">
          Vai trò: <span className="font-medium">{session.user?.role}</span>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border p-6">
            <div className="text-3xl mb-2">📚</div>
            <h2 className="font-semibold">Lý thuyết</h2>
            <p className="text-sm text-muted-foreground">Đang phát triển...</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-3xl mb-2">✏️</div>
            <h2 className="font-semibold">Bài tập</h2>
            <p className="text-sm text-muted-foreground">Đang phát triển...</p>
          </div>
          <div className="bg-white rounded-xl border p-6">
            <div className="text-3xl mb-2">📊</div>
            <h2 className="font-semibold">Phân tích</h2>
            <p className="text-sm text-muted-foreground">Đang phát triển...</p>
          </div>
        </div>
      </div>
    </div>
  );
}


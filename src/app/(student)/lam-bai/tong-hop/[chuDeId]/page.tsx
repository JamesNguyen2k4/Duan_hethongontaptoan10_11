import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import {
  PhienLuyenTapTongHop,
  CauHoiTongHopItem,
} from "@/features/lam-bai/components/PhienLuyenTapTongHop";

export const dynamic = "force-dynamic";

interface Props {
  params: {
    chuDeId: string;
  };
  searchParams: {
    soCau?: string;
  };
}

export default async function LuyenTapTongHopPage({ params, searchParams }: Props) {
  const { chuDeId } = params;
  const targetCount = Math.min(30, Math.max(5, parseInt(searchParams.soCau || "15", 10)));

  // Lấy thông tin chủ đề / bài học
  const chuDe = await db.chuDe.findUnique({
    where: { id: chuDeId },
    include: {
      chuong: true,
    },
  });

  if (!chuDe) {
    notFound();
  }

  // Lấy toàn bộ câu hỏi của chủ đề này từ database
  const allQuestions = await db.baiTap.findMany({
    where: { chuDeId },
    select: {
      id: true,
      deBai: true,
      dangBai: true,
      mucDo: true,
      dapAn: true,
    },
  });

  if (allQuestions.length === 0) {
    notFound();
  }

  // Thuật toán bốc ngẫu nhiên phân hóa (Fisher-Yates shuffle)
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, targetCount);

  const formattedQuestions: CauHoiTongHopItem[] = selected.map((q) => {
    let cacLuaChon = {};
    try {
      const parsed = JSON.parse(q.dapAn);
      cacLuaChon = parsed.cacLuaChon || {};
    } catch {}

    return {
      id: q.id,
      deBai: q.deBai,
      dangBai: q.dangBai,
      mucDo: q.mucDo,
      cacLuaChon,
    };
  });

  return (
    <div className="py-6 sm:py-10">
      <PhienLuyenTapTongHop
        chuDeId={chuDe.id}
        chuDeTen={chuDe.ten}
        chuongTen={chuDe.chuong.ten}
        danhSachCauHoi={formattedQuestions}
      />
    </div>
  );
}


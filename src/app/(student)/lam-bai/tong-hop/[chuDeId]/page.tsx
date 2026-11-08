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
    mode?: string; // "chan-doan" (Cold-Start Placement) | "tong-hop"
  };
}

export default async function LuyenTapTongHopPage({
  params,
  searchParams,
}: Props) {
  const { chuDeId } = params;
  const isChanDoan = searchParams.mode === "chan-doan";
  const targetCount = Math.min(
    30,
    Math.max(5, parseInt(searchParams.soCau || (isChanDoan ? "8" : "15"), 10))
  );

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
      doKhoIRT: true,
      dapAn: true,
    },
  });

  if (allQuestions.length === 0) {
    notFound();
  }

  // Lấy mẫu phân tầng (Stratified Sampling) đều qua từng Dạng bài (Knowledge Component)
  // đảm bảo đề Chẩn đoán đầu vào (Cold-Start) hoặc Đề tổng hợp bao phủ đủ mọi dạng toán trong bài
  const byDang = new Map<string, typeof allQuestions>();
  for (const q of allQuestions) {
    const key = q.dangBai || "Dạng khác";
    if (!byDang.has(key)) byDang.set(key, []);
    byDang.get(key)!.push(q);
  }

  // Xáo trộn ngẫu nhiên trong từng dạng bài
  const buckets = Array.from(byDang.values()).map((bucket) =>
    [...bucket].sort(() => Math.random() - 0.5)
  );

  const selected: typeof allQuestions = [];
  let round = 0;
  while (selected.length < targetCount) {
    let addedInRound = false;
    for (const bucket of buckets) {
      if (round < bucket.length && selected.length < targetCount) {
        selected.push(bucket[round]);
        addedInRound = true;
      }
    }
    if (!addedInRound) break;
    round++;
  }

  // Sắp xếp từ độ khó IRT thấp đến cao để trải nghiệm làm bài mượt mà
  selected.sort((a, b) => a.doKhoIRT - b.doKhoIRT);

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
      doKhoIRT: q.doKhoIRT,
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
        cheDo={isChanDoan ? "CHAN_DOAN_DAU_VAO" : "LUYEN_TONG_HOP"}
      />
    </div>
  );
}

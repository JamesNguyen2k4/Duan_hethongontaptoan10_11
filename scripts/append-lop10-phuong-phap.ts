import { db } from '../src/lib/db';
import { DANH_MUC_DANG_BAI_LOP10 } from '../src/lib/danh-muc-dang-bai/lop10';
import { PHUONG_PHAP_84_DANG } from './danh-sach-phuong-phap-lop10';

interface DapAnJson {
  dapAnDung?: string;
  cacLuaChon?: Record<string, string>;
}

/** Chuẩn hóa các công thức toán học chưa bọc $...$ */
function cleanMathText(text: string): string {
  let s = text.trim();
  // Khắc phục các ký tự rác nếu còn sót
  s = s.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '');

  // Chuẩn hóa một số ký hiệu toán phổ biến nếu nằm ngoài $
  // Mệnh đề toán học: ∀, ∃, ∈, ∉, ⊂, ⊃, ∪, ∩, ⇒, ⇔
  // Thay thế các công thức đơn giản dạng x ∈ R hoặc x^2 - 1 = 0
  s = s.replace(/(?<!\$)(∀[a-zA-Z]\s*∈\s*[a-zA-Z0-9]+[,\s]+[^\$\n]+)(?!\$)/g, (m) => `$${m.trim()}$`);

  // Kiểm tra cân bằng dấu $
  const singleDollars = (s.replace(/\$\$/g, '').match(/\$/g) || []).length;
  if (singleDollars % 2 !== 0) {
    // Đóng dấu $ ở cuối nếu bị lẻ
    s += '$';
  }
  return s;
}

function formatExample(sample: {
  deBai: string;
  dapAn: string;
  loiGiaiChiTiet: string;
}, index: number): string {
  let res = `**Ví dụ ${index}:** ${cleanMathText(sample.deBai)}\n\n`;

  try {
    const da: DapAnJson = JSON.parse(sample.dapAn);
    if (da.cacLuaChon && Object.keys(da.cacLuaChon).length > 0) {
      const opts = Object.entries(da.cacLuaChon)
        .map(([key, val]) => `- **${key}.** ${cleanMathText(val)}`)
        .join('\n');
      res += `${opts}\n\n`;
    }
    res += `*Hướng dẫn giải:*\n\n`;
    if (da.dapAnDung) {
      res += `Chọn đáp án **${da.dapAnDung}**.\n\n`;
    }
  } catch {
    res += `*Hướng dẫn giải:*\n\n`;
  }

  res += `${cleanMathText(sample.loiGiaiChiTiet)}\n`;
  return res;
}

async function main() {
  console.log('=== TIẾN HÀNH BỔ SUNG PHẦN B CHO TOÀN BỘ 27 BÀI HỌC LỚP 10 ===');

  const bais = await db.bai.findMany({
    where: { chuong: { lopId: 'lop-10' } },
    include: { chuong: true },
    orderBy: { thuTu: 'asc' },
  });

  console.log(`Tìm thấy ${bais.length} bài học lớp 10.`);

  let successCount = 0;

  for (const bai of bais) {
    const baiNum = bai.thuTu;
    const chuDeId = `lop10-c${bai.chuong.thuTu}-cd${baiNum}`;
    const config = DANH_MUC_DANG_BAI_LOP10[chuDeId];

    if (!config) {
      console.warn(`⚠️ Không tìm thấy config dạng bài cho ${chuDeId} (${bai.id})`);
      continue;
    }

    let rawContent = bai.noiDung;

    // 1. Chuẩn hóa Phần A nếu chưa có
    if (!rawContent.includes('PHẦN A. LÝ THUYẾT')) {
      // Đặt PHẦN A ngay sau tiêu đề chính # ...
      if (/^# [^\n]+/m.test(rawContent)) {
        rawContent = rawContent.replace(
          /^(# [^\n]+)\n+/m,
          '$1\n\n## PHẦN A. LÝ THUYẾT CỐT LÕI VÀ VÍ DỤ MINH HỌA\n\n'
        );
      } else {
        rawContent = `# ${bai.tieu_de}\n\n## PHẦN A. LÝ THUYẾT CỐT LÕI VÀ VÍ DỤ MINH HỌA\n\n${rawContent}`;
      }
    }

    // Nếu đã có Phần B trước đó thì cắt bỏ phần cũ để tái tạo chuẩn
    const idxB = rawContent.indexOf('## PHẦN B. CÁC DẠNG TOÁN');
    if (idxB !== -1) {
      rawContent = rawContent.substring(0, idxB).trim();
    }

    // 2. Xây dựng Phần B
    let phanB = '\n\n## PHẦN B. CÁC DẠNG TOÁN VÀ PHƯƠNG PHÁP GIẢI\n\n';

    for (const d of config.dangs) {
      phanB += `### 📌 ${d.ten}\n\n`;

      const method = PHUONG_PHAP_84_DANG[d.id];
      if (method) {
        phanB += `${method}\n\n`;
      } else {
        phanB += `**Phương pháp giải:**\n${d.moTa}\n\n`;
      }

      // Lấy 2 ví dụ thực tế chuẩn từ ngân hàng câu hỏi
      const samples = await db.baiTap.findMany({
        where: { chuDeId, dangBai: d.ten },
        take: 2,
        orderBy: [{ mucDo: 'asc' }, { id: 'asc' }],
      });

      if (samples.length > 0) {
        phanB += `**Ví dụ minh họa:**\n\n`;
        samples.forEach((sample, idx) => {
          phanB += formatExample(sample, idx + 1) + '\n\n';
        });
      }
    }

    const updatedContent = rawContent.trim() + phanB;

    // Kiểm tra tính toàn vẹn và cân bằng dấu $
    const singleDollars = (updatedContent.replace(/\$\$/g, '').match(/\$/g) || []).length;
    if (singleDollars % 2 !== 0) {
      console.warn(`⚠️ [${bai.id}] Số dấu $ bị lẻ: ${singleDollars}`);
    }

    await db.bai.update({
      where: { id: bai.id },
      data: { noiDung: updatedContent },
    });

    console.log(`✅ [${bai.id}] "${bai.tieu_de}": Đã thêm Phần B gồm ${config.dangs.length} dạng toán (Độ dài: ${updatedContent.length} ký tự).`);
    successCount++;
  }

  console.log(`\n🎉 HOÀN TẤT: Đã cập nhật thành công ${successCount}/${bais.length} bài học lớp 10!`);
}

main()
  .catch((e) => {
    console.error('Lỗi thực thi:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

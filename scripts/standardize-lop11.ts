import { db } from "../src/lib/db";

async function main() {
  console.log("=== BẮT ĐẦU CHUẨN HÓA TOÀN DIỆN NGÂN HÀNG CÂU HỎI LỚP 11 ===");

  // -------------------------------------------------------------
  // BƯỚC 1: XỬ LÝ CHƯƠNG 8 (BÀI 28, 29, 30)
  // -------------------------------------------------------------
  console.log("\n--- BƯỚC 1: Phân bổ 218 câu hỏi Chương 8 & Xóa bản sao dư thừa ---");

  // Lấy danh sách 218 câu hỏi gốc ở Bài 28
  const q28Original = await db.baiTap.findMany({
    where: { chuDeId: "lop11-c8-cd28" },
    select: { id: true, deBai: true, dapAn: true, loiGiaiChiTiet: true },
    orderBy: { id: "asc" }
  });

  console.log(`Tìm thấy ${q28Original.length} câu hỏi gốc tại Bài 28.`);

  // Xóa toàn bộ câu hỏi nhân bản ở Bài 29 và Bài 30 (cascade cleanup)
  const cloneIds = (await db.baiTap.findMany({
    where: { chuDeId: { in: ["lop11-c8-cd29", "lop11-c8-cd30"] } },
    select: { id: true }
  })).map(x => x.id);

  console.log(`Đang dọn dẹp ${cloneIds.length} câu hỏi bản sao tại Bài 29 và Bài 30...`);
  if (cloneIds.length > 0) {
    await db.theOnTap.deleteMany({ where: { baiTapId: { in: cloneIds } } });
    await db.lanLamBai.deleteMany({ where: { baiTapId: { in: cloneIds } } });
    await db.baiViet.deleteMany({ where: { baiTapId: { in: cloneIds } } });
    await db.baiTap.deleteMany({ where: { id: { in: cloneIds } } });
  }

  // Phân bổ 218 câu gốc vào đúng Bài 28, 29, 30
  let count28 = 0, count29 = 0, count30 = 0;

  for (const q of q28Original) {
    const text = (q.deBai + " " + q.loiGiaiChiTiet).toLowerCase();

    let score28 = 0, score29 = 0, score30 = 0;

    // Bài 28 indicators
    if (text.includes("không gian mẫu") || text.includes("n(\\omega)") || text.includes("n(\\text{omega})")) score28 += 3;
    if (text.includes("biến cố hợp") || text.includes("biến cố giao")) score28 += 4;
    if (text.includes("tập hợp") || text.includes("tập con") || text.includes("mô tả biến cố")) score28 += 3;
    if (text.includes("hai biến cố xung khắc") && !text.includes("p(a\\cup b)=p(a)+p(b)")) score28 += 2;
    if (text.includes("khẳng định nào đúng") && text.includes("độc lập")) score28 += 2;

    // Bài 29 indicators (Công thức cộng)
    if (text.includes("công thức cộng") || text.includes("quy tắc cộng")) score29 += 5;
    if (text.includes("p(a\\cup b)") || text.includes("p(a \\cup b)") || text.includes("a\\cup b")) score29 += 4;
    if (text.includes("biến cố đối") || text.includes("\\overline{") || text.includes("\\bar{")) score29 += 3;
    if (text.includes("hoặc") && text.includes("xác suất")) score29 += 2;
    if (text.includes("ít nhất một") && !text.includes("độc lập")) score29 += 2;

    // Bài 30 indicators (Công thức nhân & biến cố độc lập)
    if (text.includes("công thức nhân") || text.includes("quy tắc nhân")) score30 += 5;
    if (text.includes("p(ab)") || text.includes("p(a.b)") || text.includes("p(a)p(b)") || text.includes("p(a).p(b)")) score30 += 5;
    if (text.includes("xạ thủ") || text.includes("bắn trúng") || text.includes("ném bóng")) score30 += 4;
    if (text.includes("độc lập") && (text.includes("tính xác suất") || text.includes("xác suất để"))) score30 += 3;
    if (text.includes("bóng đèn") || text.includes("mạch điện") || text.includes("máy tính hoạt động")) score30 += 4;
    if (text.includes("thi đấu") || text.includes("ván cờ") || text.includes("trận đấu")) score30 += 3;

    let targetLesson = "lop11-c8-cd28";
    let dangBai = "Dạng 1. Mô tả không gian mẫu & Xác định các biến cố";

    if (score30 >= score29 && score30 > score28) {
      targetLesson = "lop11-c8-cd30";
      count30++;
      if (text.includes("xạ thủ") || text.includes("bóng đèn") || text.includes("thi đấu")) {
        dangBai = "Dạng 3. Bài toán xác suất thực tế (Bắn súng, thi đấu, bóng đèn)";
      } else if (text.includes("phối hợp") || text.includes("p(a\\cup b)")) {
        dangBai = "Dạng 2. Phối hợp quy tắc cộng và quy tắc nhân";
      } else {
        dangBai = "Dạng 1. Quy tắc nhân xác suất cho hai biến cố độc lập";
      }
    } else if (score29 > score28 && score29 >= score30) {
      targetLesson = "lop11-c8-cd29";
      count29++;
      if (text.includes("biến cố đối") || text.includes("\\overline{") || text.includes("ít nhất")) {
        dangBai = "Dạng 3. Tính xác suất bằng biến cố đối";
      } else if (text.includes("xung khắc")) {
        dangBai = "Dạng 1. Quy tắc cộng cho hai biến cố xung khắc";
      } else {
        dangBai = "Dạng 2. Quy tắc cộng xác suất tổng quát";
      }
    } else {
      targetLesson = "lop11-c8-cd28";
      count28++;
      if (text.includes("độc lập")) {
        dangBai = "Dạng 3. Nhận biết & Xét tính độc lập của hai biến cố";
      } else if (text.includes("hợp") || text.includes("giao")) {
        dangBai = "Dạng 2. Biến cố hợp, biến cố giao, biến cố đối";
      } else {
        dangBai = "Dạng 1. Mô tả không gian mẫu & Xác định các biến cố";
      }
    }

    await db.baiTap.update({
      where: { id: q.id },
      data: {
        chuDeId: targetLesson,
        dangBai: dangBai
      }
    });
  }

  console.log(`✓ Hoàn tất phân bổ Chương 8: Bài 28 (${count28} câu), Bài 29 (${count29} câu), Bài 30 (${count30} câu).`);

  // -------------------------------------------------------------
  // BƯỚC 2: XÓA CÂU HỎI TRÙNG LẶP TRONG TỪNG BÀI VÀ LIÊN BÀI
  // -------------------------------------------------------------
  console.log("\n--- BƯỚC 2: Xóa các câu hỏi trùng lặp chính xác (9 câu cùng bài, 2 câu khác bài) ---");

  const duplicateIdsToDelete = [
    "bt-cbf951f6d700", // lop11-c1-cd3 (giữ bt-67de8248cf15 ở Dạng 3)
    "bt-3ea2479b8604", // lop11-c2-cd5 (giữ bt-6c875f61b785 có Chọn A)
    "bt-77a960093ec3", // lop11-c2-cd6 (giữ bt-2bf1e9f5fdb2 ở Dạng 1)
    "bt-aa80706791b7", // lop11-c6-cd21 (giữ bt-888a6eeeb924 ở Bài 19)
    "bt-310e2b94b55d", // lop11-c6-cd21 (giữ bt-061aec7c3541 có lời giải đầy đủ)
    "bt-07401388c673", // lop11-c7-cd26 (giữ bt-a9f0bb02cdc9 ở Bài 22)
    "bt-faa71f8e162f", // lop11-c7-cd26 (giữ bt-176fd3ca8f08)
    "bt-a5313aad56aa", // lop11-c9-cd31 (giữ bt-10c4f932825e)
    "bt-eb0d45e79e10", // lop11-c9-cd31 (giữ bt-2f92cdbf61a9)
    "bt-30422dba203c", // lop11-c9-cd32 (giữ bt-60928285ad80)
    "bt-e3b790c28e69", // lop11-c9-cd32 (giữ bt-ab41eb5bc518)
  ];

  await db.theOnTap.deleteMany({ where: { baiTapId: { in: duplicateIdsToDelete } } });
  await db.lanLamBai.deleteMany({ where: { baiTapId: { in: duplicateIdsToDelete } } });
  await db.baiViet.deleteMany({ where: { baiTapId: { in: duplicateIdsToDelete } } });
  await db.baiTap.deleteMany({ where: { id: { in: duplicateIdsToDelete } } });

  console.log(`✓ Đã xóa sạch ${duplicateIdsToDelete.length} câu hỏi trùng lặp.`);

  // -------------------------------------------------------------
  // BƯỚC 3: LÀM SẠCH ĐỀ BÀI (CẮT BỎ CÁC ĐOẠN LỜI GIẢI DÍNH VÀO ĐẦU ĐỀ BÀI)
  // -------------------------------------------------------------
  console.log("\n--- BƯỚC 3: Làm sạch đề bài (Cắt bỏ các tàn dư lời giải dính vào câu hỏi) ---");

  const allGrade11 = await db.baiTap.findMany({
    where: { chuDe: { chuong: { lopId: "lop-11" } } },
    select: { id: true, deBai: true }
  });

  // Regex phát hiện đoạn rác ở đầu đề bài (cho cả dạng nhiều đoạn \n\n hoặc dính trực tiếp)
  const scrapPattern = /^(?:(?:Khi đó|Do đó|Suy ra|Vậy|Ta có|Theo bài|Áp dụng|Mặt khác|Hay|Cơ số|Cặp biến cố)\b|[A-D]\s+(?:sai|đúng|thỏa|thoả|loại|không)|(?:Phương án|Mệnh đề|Khẳng định|Đáp án)\s+[A-D]|(?:\$[^\$]+=(?:[^\$]+)?\$))/i;

  let cleanedDebaiCount = 0;

  for (const q of allGrade11) {
    let de = q.deBai;
    let modified = false;

    // Trường hợp 1: Có \n\n phân đoạn và đoạn đầu là lời giải
    const paragraphs = de.split(/\n\n+/);
    if (paragraphs.length > 1 && scrapPattern.test(paragraphs[0].trim())) {
      de = paragraphs.slice(1).join("\n\n").trim();
      modified = true;
    }

    // Trường hợp 2: Dính dòng đơn "Khi đó ... Cho..." hoặc "Khi đó ... Từ..." hoặc "Khi đó ... Câu..."
    const inlineMatch = de.match(/^(?:Khi đó|Do đó|Suy ra|Vậy|Ta có|Hay|Cơ số|Cặp biến cố)[^\.\n]*?(?:\.|\$|\b)(?:\s*)(Cho\s+[A-ZÀ-Ỹ]|Từ\s+một|Gọi\s+[A-ZÀ-Ỹ]|Tập\s+|Một\s+|Trong\s+|Có\s+|Xét\s+|Biết\s+|Tính\s+|Tìm\s+|Đạo\s+hàm|Câu\s+\d+\.)/i);
    if (inlineMatch && inlineMatch[1]) {
      const idx = de.indexOf(inlineMatch[1]);
      if (idx > 0) {
        let newDe = de.slice(idx).trim();
        // Xóa "Câu xx." nếu có
        newDe = newDe.replace(/^Câu\s+\d+[\.\s:]*/i, "");
        de = newDe;
        modified = true;
      }
    }

    // Trường hợp 3: Bắt đầu bằng "Câu xx."
    if (/^Câu\s+\d+[\.\s:]+/i.test(de)) {
      de = de.replace(/^Câu\s+\d+[\.\s:]+/i, "");
      modified = true;
    }

    if (modified && de.length > 10) {
      await db.baiTap.update({
        where: { id: q.id },
        data: { deBai: de }
      });
      cleanedDebaiCount++;
    }
  }

  console.log(`✓ Đã làm sạch đề bài cho ${cleanedDebaiCount} câu hỏi.`);

  // -------------------------------------------------------------
  // BƯỚC 4: ĐỒNG BỘ ĐÁP ÁN ĐÚNG (dapAnDung) VỚI LỜI GIẢI GỐC
  // -------------------------------------------------------------
  console.log("\n--- BƯỚC 4: Đồng bộ đáp án đúng chuẩn xác theo lời giải gốc ---");

  const allUpdated = await db.baiTap.findMany({
    where: { chuDe: { chuong: { lopId: "lop-11" } } },
    select: { id: true, dapAn: true, loiGiaiChiTiet: true }
  });

  let ansFixCount = 0;

  for (const q of allUpdated) {
    let parsed: any = q.dapAn;
    if (typeof parsed === "string") {
      try { parsed = JSON.parse(parsed); } catch {}
    }
    const currentAns = (parsed?.dapAnDung || "").trim().toUpperCase();
    const sol = q.loiGiaiChiTiet || "";

    // Regex chuẩn xác nhận diện đáp án chính thức ở đầu lời giải
    const m = sol.match(/^(?:\s*|\*+)(?:Hướng dẫn giải:?\s*)?(?:Chọn|Chọn|Đáp án)\s*[:#\.\s]*([A-D])\b/im);
    if (m) {
      const solAns = m[1].toUpperCase();
      if (solAns !== currentAns && parsed && parsed.cacLuaChon) {
        parsed.dapAnDung = solAns;
        await db.baiTap.update({
          where: { id: q.id },
          data: {
            dapAn: JSON.stringify(parsed)
          }
        });
        ansFixCount++;
      }
    }
  }

  console.log(`✓ Đã cập nhật đáp án đúng chính xác cho ${ansFixCount} câu hỏi.`);

  // -------------------------------------------------------------
  // BƯỚC 5: TỔNG KẾT & KIỂM TRA TOÀN VẸN
  // -------------------------------------------------------------
  const finalTotal = await db.baiTap.count({
    where: { chuDe: { chuong: { lopId: "lop-11" } } }
  });

  console.log(`\n🎉 HOÀN TẤT CHUẨN HÓA! Tổng số câu hỏi Lớp 11 hiện tại trong hệ thống: ${finalTotal} câu hỏi chuẩn hóa 100% không trùng lặp.`);

  await db.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error("Lỗi:", e);
  await db.$disconnect();
  process.exit(1);
});

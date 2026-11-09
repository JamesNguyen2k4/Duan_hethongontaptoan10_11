import { db } from "../src/lib/db";

interface Issue {
  id: string;
  chuDeId: string;
  type: string;
  detail: string;
}

async function scanDeep() {
  const all = await db.baiTap.findMany({
    select: {
      id: true,
      chuDeId: true,
      dangBai: true,
      deBai: true,
      dapAn: true,
      loiGiaiChiTiet: true,
      mucDo: true,
    },
  });

  console.log(`Scanning all ${all.length} questions for content and answer defects...`);

  const issues: Issue[] = [];

  for (const q of all) {
    let parsed: any = {};
    try {
      parsed = JSON.parse(q.dapAn);
    } catch (e) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "JSON_CORRUPT", detail: "Invalid JSON in dapAn" });
      continue;
    }

    const { dapAnDung, cacLuaChon } = parsed;
    const opts = cacLuaChon || {};

    // 1. Kiểm tra đáp án đúng có hợp lệ (A, B, C, D)
    const validDung = (dapAnDung || "").trim().toUpperCase();
    if (!["A", "B", "C", "D"].includes(validDung)) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "INVALID_DAP_AN_DUNG", detail: `dapAnDung is '${dapAnDung}'` });
    }

    // 2. Kiểm tra đủ 4 phương án
    for (const key of ["A", "B", "C", "D"]) {
      if (!opts[key] || opts[key].trim().length === 0) {
        issues.push({ id: q.id, chuDeId: q.chuDeId, type: "MISSING_OPTION", detail: `Missing option ${key}` });
      }
    }

    // 3. Kiểm tra phương án bị dính "Lời giải", "Hướng dẫn giải", "Chọn [A-D]"
    for (const key of ["A", "B", "C", "D"]) {
      const optVal = (opts[key] || "").trim();
      if (/lời\s*giải/i.test(optVal) || /hướng\s*dẫn\s*giải/i.test(optVal)) {
        issues.push({ id: q.id, chuDeId: q.chuDeId, type: "LEAK_SOLUTION_IN_OPTION", detail: `Option ${key} contains 'Lời giải': ${optVal.slice(0, 80)}` });
      }
      if (/^(?:Chọn|Chọn)\s*[A-D]/i.test(optVal)) {
        issues.push({ id: q.id, chuDeId: q.chuDeId, type: "LEAK_CHON_IN_OPTION", detail: `Option ${key} starts with 'Chọn': ${optVal.slice(0, 80)}` });
      }
    }

    // 4. Kiểm tra phương án bị trùng lặp (ví dụ A giống B)
    const optList = ["A", "B", "C", "D"].map(k => (opts[k] || "").trim());
    const uniqueOpts = new Set(optList);
    if (uniqueOpts.size < 4 && optList.every(v => v.length > 0)) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "DUPLICATE_OPTIONS", detail: `Options not unique: A=${optList[0]}, B=${optList[1]}, C=${optList[2]}, D=${optList[3]}` });
    }

    // 5. Kiểm tra đáp án đúng KHÔNG KHỚP với Lời giải chi tiết
    // Trong lời giải thường có "Chọn A", "Chọn B", "Chọn C", "Chọn D", "Đáp án A", "Đáp án: A", "\textbf{Chọn A}", v.v.
    const lg = q.loiGiaiChiTiet || "";
    if (lg.length > 0) {
      // Tìm các mẫu kết luận đáp án trong lời giải
      // Chú ý: thường ở đầu lời giải hoặc ở cuối lời giải: "Chọn [A-D]", "Đáp án [A-D]", "Do đó chọn [A-D]", "Vậy chọn [A-D]"
      const matchDapAnLg = 
        lg.match(/(?:(?:Vậy|Do đó|Suy ra|Ta có)\s*,?\s*)?(?:chọn|chọn|đáp án|dap an)\s*[:.]?\s*\\?textbf\{?([A-D])\}?/i) ||
        lg.match(/^(?:Chọn|Chọn|Đáp án|Dap an)\s*[:.]?\s*\\?textbf\{?([A-D])\}?/i) ||
        lg.match(/(?:chọn|chọn|đáp án)\s*([A-D])\s*[\.\n$]/i);

      if (matchDapAnLg) {
        const detectedAnswer = matchDapAnLg[1].toUpperCase();
        if (detectedAnswer !== validDung) {
          issues.push({
            id: q.id,
            chuDeId: q.chuDeId,
            type: "MISMATCH_ANSWER_SOLUTION",
            detail: `dapAnDung='${validDung}' but loiGiai concludes '${detectedAnswer}'. Match: "${matchDapAnLg[0]}"`,
          });
        }
      }
    }

    // 6. Kiểm tra đề bài bị dính "Lời giải", "Chọn [A-D]" hoặc quá ngắn hoặc chưa hoàn chỉnh
    const de = q.deBai.trim();
    if (de.length < 15) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "SHORT_DE_BAI", detail: `deBai too short (${de.length} chars): "${de}"` });
    }
    if (/lời\s*giải/i.test(de) || /hướng\s*dẫn\s*giải/i.test(de)) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "LEAK_SOLUTION_IN_DE_BAI", detail: `deBai contains 'Lời giải': "${de.slice(-100)}"` });
    }

    // 7. Kiểm tra dấu LaTeX $ không cân xứng
    const deDollar = (de.match(/\$/g) || []).length;
    if (deDollar % 2 !== 0) {
      issues.push({ id: q.id, chuDeId: q.chuDeId, type: "UNCLOSED_LATEX_DE_BAI", detail: `Odd dollar count (${deDollar}) in deBai` });
    }
    for (const key of ["A", "B", "C", "D"]) {
      const optVal = opts[key] || "";
      const optDollar = (optVal.match(/\$/g) || []).length;
      if (optDollar % 2 !== 0) {
        issues.push({ id: q.id, chuDeId: q.chuDeId, type: "UNCLOSED_LATEX_OPTION", detail: `Odd dollar count (${optDollar}) in option ${key}` });
      }
    }
  }

  console.log(`\n=================== TỔNG KẾT RÀ SOÁT ===================`);
  console.log(`Tổng số vấn đề phát hiện: ${issues.length}`);

  const byType: Record<string, number> = {};
  for (const iss of issues) {
    byType[iss.type] = (byType[iss.type] || 0) + 1;
  }
  for (const [t, cnt] of Object.entries(byType)) {
    console.log(`  - ${t}: ${cnt} câu`);
  }

  // In mẫu 20 vấn đề đầu tiên
  console.log(`\n=== CHI TIẾT CÁC VẤN ĐỀ ĐẦU TIÊN ===`);
  for (const iss of issues.slice(0, 30)) {
    console.log(`[${iss.id}] [${iss.chuDeId}] [${iss.type}] ${iss.detail}`);
  }
}

scanDeep()
  .catch(console.error)
  .finally(() => process.exit(0));


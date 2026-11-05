/**
 * Seed dữ liệu ban đầu:
 * - Tạo tài khoản admin mặc định
 * - Tạo tài khoản giáo viên mặc định
 * - Tạo cấu trúc Lớp 10 mẫu
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  // Tạo tài khoản Admin
  const matKhauAdmin = await bcrypt.hash("admin123", 10);
  const admin = await db.nguoiDung.upsert({
    where: { email: "admin@ontap.vn" },
    update: {},
    create: {
      email: "admin@ontap.vn",
      tenHienThi: "Quản trị viên",
      matKhauBam: matKhauAdmin,
      vaiTro: "QUAN_TRI",
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Tạo tài khoản Giáo viên
  const matKhauGV = await bcrypt.hash("giaovien123", 10);
  const giaoVien = await db.nguoiDung.upsert({
    where: { email: "giaovien@ontap.vn" },
    update: {},
    create: {
      email: "giaovien@ontap.vn",
      tenHienThi: "Giáo viên",
      matKhauBam: matKhauGV,
      vaiTro: "GIAO_VIEN",
    },
  });
  console.log(`✅ Giáo viên: ${giaoVien.email}`);

  // Tạo Lớp 10
  const lop10 = await db.lop.upsert({
    where: { id: "lop-10" },
    update: {},
    create: {
      id: "lop-10",
      ten: "Toán 10",
      thuTu: 1,
    },
  });

  // Tạo Lớp 11
  const lop11 = await db.lop.upsert({
    where: { id: "lop-11" },
    update: {},
    create: {
      id: "lop-11",
      ten: "Toán 11",
      thuTu: 2,
    },
  });

  // Tạo Chương mẫu cho Lớp 10
  const chuong1 = await db.chuong.upsert({
    where: { id: "lop10-c1" },
    update: {},
    create: {
      id: "lop10-c1",
      lopId: lop10.id,
      ten: "Chương 1: Mệnh đề và tập hợp",
      thuTu: 1,
      moTa: "Mệnh đề, tập hợp, các phép toán trên tập hợp, số gần đúng.",
    },
  });

  // Tạo Bài mẫu
  await db.bai.upsert({
    where: { id: "lop10-c1-b1" },
    update: {},
    create: {
      id: "lop10-c1-b1",
      chuongId: chuong1.id,
      tieu_de: "Bài 1: Mệnh đề",
      thuTu: 1,
      noiDung: `# Bài 1: Mệnh đề

## 1. Khái niệm mệnh đề

**Mệnh đề** là một câu khẳng định hoặc phủ định, có thể xác định được là đúng hay sai.

### Ví dụ

- "3 là số nguyên tố" → **Mệnh đề đúng** ✓
- "5 < 3" → **Mệnh đề sai** ✗
- "x > 2" → **Không phải mệnh đề** (chứa biến)

## 2. Phủ định của mệnh đề

Phủ định của mệnh đề $P$ ký hiệu là $\\overline{P}$.

Nếu $P$ đúng thì $\\overline{P}$ sai, và ngược lại.

**Ví dụ:** Cho mệnh đề $P$: "12 chia hết cho 4"

$$\\overline{P}: \\text{"12 không chia hết cho 4"}$$

## 3. Mệnh đề kéo theo

Cho hai mệnh đề $P$ và $Q$. Mệnh đề kéo theo:

$$P \\Rightarrow Q$$

đọc là "Nếu $P$ thì $Q$", chỉ sai khi $P$ đúng và $Q$ sai.

| $P$ | $Q$ | $P \\Rightarrow Q$ |
|-----|-----|-------------------|
| Đ   | Đ   | Đ                 |
| Đ   | S   | S                 |
| S   | Đ   | Đ                 |
| S   | S   | Đ                 |
`,
    },
  });

  // Tạo Chủ đề mẫu
  const chuDe1 = await db.chuDe.upsert({
    where: { id: "lop10-c1-cd1" },
    update: {},
    create: {
      id: "lop10-c1-cd1",
      chuongId: chuong1.id,
      ten: "Mệnh đề",
      thuTu: 1,
    },
  });

  // Tạo Bài tập mẫu
  await db.baiTap.upsert({
    where: { id: "bt-001" },
    update: {},
    create: {
      id: "bt-001",
      chuDeId: chuDe1.id,
      deBai: `Trong các câu sau, câu nào là mệnh đề?\n\n**A.** x + 3 = 5\n\n**B.** 2 + 2 = 4\n\n**C.** Bạn có thích Toán không?\n\n**D.** Hà Nội đẹp`,
      loai: "TRAC_NGHIEM",
      mucDo: "NHAN_BIET",
      dapAn: JSON.stringify({ dapAnDung: "B" }),
      loiGiaiChiTiet: `**Đáp án: B**\n\n- Câu A: "x + 3 = 5" chứa biến x, chưa xác định đúng/sai → không phải mệnh đề\n- Câu B: "2 + 2 = 4" là câu đúng xác định → **là mệnh đề**\n- Câu C: Câu hỏi → không phải mệnh đề\n- Câu D: "Hà Nội đẹp" mang tính chủ quan → không phải mệnh đề`,
      dangBai: "nhận biết mệnh đề",
    },
  });

  console.log("✅ Dữ liệu mẫu đã được tạo thành công!");
  console.log("\n📋 Tài khoản mặc định:");
  console.log("   Admin:     admin@ontap.vn / admin123");
  console.log("   Giáo viên: giaovien@ontap.vn / giaovien123");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });


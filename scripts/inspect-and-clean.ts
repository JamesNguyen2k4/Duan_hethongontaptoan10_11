import { db } from "../src/lib/db";

async function main() {
  const q1 = await db.baiTap.findUnique({ where: { id: "bt-08cd2427fc4e" } });
  console.log("=== bt-08cd2427fc4e ===");
  console.log("De bai:\n", q1?.deBai);
  console.log("Dap an:\n", q1?.dapAn);
  console.log("Loi giai:\n", q1?.loiGiaiChiTiet);

  const q2 = await db.baiTap.findUnique({ where: { id: "bt-171d774ce224" } });
  console.log("=== bt-171d774ce224 ===");
  console.log("De bai:\n", q2?.deBai);
  console.log("Dap an:\n", q2?.dapAn);
  console.log("Loi giai:\n", q2?.loiGiaiChiTiet);

  await db.$disconnect();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});

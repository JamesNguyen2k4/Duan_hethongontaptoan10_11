import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local", override: true });

const prisma = new PrismaClient();

interface PatchItem {
  id: string;
  deBai?: string;
  dapAnDung?: string;
  options?: Record<string, string>;
  loiGiai?: string;
}

const patches: PatchItem[] = [
  // 1. Câu trong ảnh phản ánh của User (bt-0c434585a14b)
  {
    id: "bt-0c434585a14b",
    deBai: "Xét câu nào sau đây đúng?",
    dapAnDung: "A",
    options: {
      A: "$\\cos^{2}45^{\\circ}=\\sin \\left( \\frac{\\pi}{3}\\cos 60^{\\circ} \\right)$.",
      B: "$\\sin^2 45^{\\circ} + \\cos^2 45^{\\circ} = 2$.",
      C: "Nếu $a$ âm thì ít nhất một trong hai số $\\cos a,\\sin a$ phải âm.",
      D: "Nếu $a$ dương thì $\\sin a=\\sqrt{1-\\cos^{2}a}$."
    },
    loiGiai: "Chọn **A**.\n\n- **A đúng** vì: $\\cos^{2}45^{\\circ} = \\left(\\frac{\\sqrt{2}}{2}\\right)^{2} = \\frac{1}{2}$ và $\\sin\\left(\\frac{\\pi}{3}\\cos 60^{\\circ}\\right) = \\sin\\left(\\frac{\\pi}{3} \\cdot \\frac{1}{2}\\right) = \\sin\\frac{\\pi}{6} = \\frac{1}{2}$.\n- **B sai** vì $\\sin^2 45^{\\circ} + \\cos^2 45^{\\circ} = 1 \\ne 2$.\n- **C sai** vì chọn $a = -\\frac{7\\pi}{4} < 0$, ta có $\\cos a = \\sin a = \\frac{\\sqrt{2}}{2} > 0$ (cả hai số đều dương).\n- **D sai** vì chọn $a = \\frac{5\\pi}{4} > 0$, ta có $\\sin a = -\\frac{\\sqrt{2}}{2} < 0$, trong khi $\\sqrt{1-\\cos^{2}a} = \\frac{\\sqrt{2}}{2} > 0$."
  },

  // 2. Phương án B bị cụt (bt-4fba457d4b92)
  {
    id: "bt-4fba457d4b92",
    deBai: "Cho mặt phẳng $\\left( \\alpha \\right)$ và đường thẳng $d \\not\\subset \\left( \\alpha \\right)$. Khẳng định nào sau đây là sai?",
    dapAnDung: "B",
    options: {
      A: "Nếu $d\\,//\\,\\left( \\alpha \\right)$ thì trong $\\left( \\alpha \\right)$ tồn tại đường thẳng $a$ sao cho $d\\,//\\,a$.",
      B: "Nếu $d\\,//\\,\\left( \\alpha \\right)$ và $b \\subset \\left( \\alpha \\right)$ thì $d\\,//\\,b$.",
      C: "Nếu $d \\cap \\left( \\alpha \\right)=A$ và $d'\\subset \\left( \\alpha \\right)$ thì $d$ và $d'$ hoặc cắt nhau hoặc chéo nhau.",
      D: "Nếu $d\\,//\\,c$ và $c \\subset \\left( \\alpha \\right)$ thì $d\\,//\\,\\left( \\alpha \\right)$."
    },
    loiGiai: "Chọn **B**.\n\nMệnh đề B sai vì khi $d\\,//\\,\\left( \\alpha \\right)$ và $b \\subset \\left( \\alpha \\right)$ thì đường thẳng $d$ và $b$ có thể song song hoặc chéo nhau."
  },

  // 3. Mâu thuẫn đáp án: Rút lá bài tây (bt-7dfb389dba3d)
  {
    id: "bt-7dfb389dba3d",
    dapAnDung: "C",
    loiGiai: "Chọn **C**.\n\nGọi $A$ là biến cố \"Lá bài được chọn có màu đen\" và $B$ là biến cố \"Lá bài được chọn có số chia hết cho 3 (gồm các quân 3, 6, 9 thuộc 4 chất: $4 \\times 3 = 12$ lá)\".\n- Bộ bài tây gồm $52$ lá, trong đó có $26$ lá màu đen $\\implies P(A) = \\frac{26}{52} = \\frac{1}{2}$.\n- Có $12$ lá bài có số chia hết cho $3 \\implies P(B) = \\frac{12}{52}$.\n- Có $6$ lá bài vừa có màu đen vừa chia hết cho $3 \\implies P(AB) = \\frac{6}{52}$.\n\nTheo công thức cộng xác suất:\n$$P(A \\cup B) = P(A) + P(B) - P(AB) = \\frac{26}{52} + \\frac{12}{52} - \\frac{6}{52} = \\frac{32}{52} = \\frac{8}{13}.$$"
  },

  // 4. Mâu thuẫn đáp án: Dãy số bị chặn (bt-be37b19db183)
  {
    id: "bt-be37b19db183",
    dapAnDung: "A",
    loiGiai: "Chọn **A**.\n\n- **A sai** vì dãy số $u_n = 2n-1$ là dãy số tăng và không bị chặn trên (khi $n \\to +\\infty$ thì $u_n \\to +\\infty$). Do đó kết luận ở A là kết luận sai.\n- **B đúng** vì dãy số $u_n = \\frac{1}{n+1}$ giảm và bị chặn dưới bởi $0$.\n- **C đúng** vì dãy số $u_n = -\\frac{1}{n}$ tăng và bị chặn trên bởi $0$.\n- **D đúng** vì dãy số $u_n = \\frac{1}{3 \\cdot 2^n}$ giảm và bị chặn dưới bởi $0$."
  },

  // 5. Hàm số lượng giác (bt-05ea44e65f4f)
  {
    id: "bt-05ea44e65f4f",
    deBai: "Trong các khẳng định sau, khẳng định nào đúng?",
    dapAnDung: "C",
    loiGiai: "Chọn **C**.\n\n- A sai vì hàm số $y=\\tan x$ tuần hoàn với chu kì $\\pi$, không phải $2\\pi$.\n- B sai vì hàm số $y=\\cos x$ tuần hoàn với chu kì $2\\pi$, không phải $\\pi$.\n- C đúng vì trên khoảng $\\left(0; \\frac{\\pi}{2}\\right)$, khi $x$ tăng thì $\\sin x$ tăng từ $0$ lên $1$, nên hàm số $y=\\sin x$ đồng biến.\n- D sai vì hàm số $y=\\cot x$ chỉ nghịch biến trên từng khoảng xác định $(k\\pi; \\pi + k\\pi)$, không nghịch biến trên toàn bộ $\\mathbb{R}$."
  },

  // 6. 11 câu bị dán nhầm lời giải câu trước vào đầu đề bài:
  {
    id: "bt-01f7adf4e5ad",
    deBai: "Cho tứ diện $ABCD$ có tất cả các cạnh bằng $1$. Gọi $M, N$ lần lượt là trung điểm của $BC$ và $AD$. Trên đường thẳng $AB$ lấy điểm $E$, trên đường thẳng $CN$ lấy điểm $F$ sao cho $EF$ song song với $DM$. Tính độ dài đoạn thẳng $EF$.",
    dapAnDung: "B",
    loiGiai: "Chọn **B**.\n\nGọi $P$ là điểm đối xứng với điểm $C$ qua $D$. Khi đó $AP = (ABP) \\cap (ACD)$; $MD\\,//\\,BP$ và $BP = 2MD = \\sqrt{3}$.\nTheo giả thiết $E \\in AB$ và $EF\\,//\\,MD$ nên $F \\in AP \\implies F = CN \\cap AP$.\nKẻ đường thẳng qua $F$ song song với $BP$ cắt $AB$ tại $E$. Gọi $K$ là trung điểm $CF$, ta có $AF = DK = \\frac{1}{2}FP$.\nMặt khác $\\Delta AEF \\sim \\Delta ABP \\implies \\frac{EF}{BP} = \\frac{AF}{AP} = \\frac{1}{3}$.\nVậy $EF = \\frac{1}{3}BP = \\frac{\\sqrt{3}}{3}$."
  },
  {
    id: "bt-064483870277",
    deBai: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Mặt phẳng $(P)$ qua $BD$ và song song với $SA$. Khi đó mặt phẳng $(P)$ cắt hình chóp $S.ABCD$ theo thiết diện là hình gì?",
    dapAnDung: "D"
  },
  {
    id: "bt-26724ac562d8",
    deBai: "Sinh nhật bạn của An vào ngày 01 tháng 5. An muốn mua một món quà sinh nhật cho bạn nên quyết định bỏ ống heo $100$ đồng vào ngày 01 tháng 01 năm 2016, sau đó cứ mỗi ngày sau bỏ nhiều hơn ngày trước $100$ đồng. Hỏi đến ngày sinh nhật của bạn, An đã tích lũy được bao nhiêu tiền? (Thời gian bỏ ống heo tính từ ngày 01 tháng 01 năm 2016 đến ngày 30 tháng 4 năm 2016, năm 2016 là năm nhuận có tháng 2 gồm 29 ngày).",
    dapAnDung: "A"
  },
  {
    id: "bt-4e3dd199ab1c",
    deBai: "Gọi $S$ là tập hợp tất cả các nghiệm nguyên dương của phương trình $\\log\\left(2 - 10^{2x}\\right) = x$. Số tập con của $S$ bằng:",
    dapAnDung: "C"
  },
  {
    id: "bt-797e7cfea289",
    deBai: "Có hai cơ sở khoan giếng $A$ và $B$. Cơ sở $A$ có giá mét khoan đầu tiên là $8.000$ đồng và kể từ mét khoan thứ hai, giá của mỗi mét sau tăng thêm $500$ đồng so với giá của mét khoan ngay trước đó. Cơ sở $B$ có giá mét khoan đầu tiên là $6.000$ đồng và kể từ mét khoan thứ hai, giá của mỗi mét sau tăng thêm $7\\%$ giá của mét khoan ngay trước đó. Một công ty muốn khoan một cái giếng sâu $20$ mét để lấy nước tưới tiêu. Hỏi công ty nên chọn cơ sở nào để tiết kiệm chi phí nhất?",
    dapAnDung: "A"
  },
  {
    id: "bt-9267afeb6121",
    deBai: "Tìm tập nghiệm của bất phương trình: $2\\log_3(4x - 3) + \\log_{\\frac{1}{3}}(2x + 3) \\le 2$.",
    dapAnDung: "A"
  },
  {
    id: "bt-9c1573af3989",
    deBai: "Ba người cùng bắn một cách độc lập vào một mục tiêu. Xác suất bắn trúng mục tiêu của người thứ nhất, người thứ hai và người thứ ba lần lượt là $0{,}8$; $0{,}7$ và $0{,}6$. Biết mục tiêu bị trúng đúng hai viên đạn, tính xác suất để người thứ ba bắn trúng.",
    dapAnDung: "B"
  },
  {
    id: "bt-bb6d5d0280dc",
    deBai: "Cho tứ diện $ABCD$. Gọi $G$ là trọng tâm của tam giác $BCD$. Giao tuyến của mặt phẳng $(ACD)$ và $(GAB)$ là:",
    dapAnDung: "B"
  },
  {
    id: "bt-bd90ae0804ab",
    deBai: "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $A$, $AC = a\\sqrt{3}$, $\\widehat{ABC} = 30^{\\circ}$. Cạnh bên $SA$ vuông góc với mặt phẳng đáy và góc giữa $SC$ với mặt phẳng đáy bằng $60^{\\circ}$. Tính khoảng cách từ điểm $A$ đến mặt phẳng $(SBC)$.",
    dapAnDung: "D"
  },
  {
    id: "bt-d729f2798b3f",
    deBai: "Cho khối chóp tứ giác đều $S.ABCD$ có cạnh đáy bằng $a$, các mặt bên tạo với mặt phẳng đáy một góc $60^{\\circ}$. Thể tích của khối chóp $S.ABCD$ bằng:",
    dapAnDung: "C"
  },
  {
    id: "bt-fd652d79992d",
    deBai: "Tổng giá trị tất cả các nghiệm của phương trình $\\log_{2}\\left( x+2 \\right)+\\log_{4}\\left( x-5 \\right)^{2}+\\log_{\\frac{1}{2}}8=0 $ bằng:",
    dapAnDung: "C",
    loiGiai: "Chọn **C**.\n\nĐiều kiện: $\\left\\{\\begin{array}{l}x > -2 \\\\ x \\ne 5\\end{array}\\right.$.\nPhương trình tương đương với:\n$$\\log_2(x+2) + \\log_2|x-5| - \\log_2 8 = 0 \\iff (x+2)|x-5| = 8$$\n\n- Trường hợp 1: $x > 5$:\n$$(x+2)(x-5) = 8 \\iff x^2 - 3x - 18 = 0 \\iff x = 6 \\text{ (thỏa mãn)} \\text{ hoặc } x = -3 \\text{ (loại)}$$\n\n- Trường hợp 2: $-2 < x < 5$:\n$$(x+2)(5-x) = 8 \\iff -x^2 + 3x + 10 = 8 \\iff x^2 - 3x - 2 = 0 \\iff x = \\frac{3 \\pm \\sqrt{17}}{2} \\text{ (cả hai đều thuộc } (-2; 5))$$\n\nTổng tất cả các nghiệm của phương trình là:\n$$6 + \\frac{3 + \\sqrt{17}}{2} + \\frac{3 - \\sqrt{17}}{2} = 6 + 3 = 9.$$"
  },

  // 7. Khôi phục hoàn toàn đề bài các câu MISSING_QUESTION_TEXT:
  {
    id: "bt-0e32383f835e",
    deBai: "Cho hàm số $y = x^3 + 3x^2 + 1$ có đồ thị $(C)$ và điểm $A(1; m)$. Gọi $S$ là tập hợp tất cả các giá trị nguyên của tham số $m$ để qua $A$ có thể kẻ được đúng $3$ tiếp tuyến đến đồ thị $(C)$. Số phần tử của tập hợp $S$ là:",
    dapAnDung: "B"
  },
  {
    id: "bt-1e156e3e7a94",
    deBai: "Một vận động viên bắn ba viên đạn vào bia một cách độc lập. Xác suất bắn trúng vòng $10$ điểm là $0{,}15$; vòng $8$ điểm là $0{,}2$; vòng dưới $8$ điểm là $0{,}3$, và các phát bắn chỉ có thể rơi vào các vòng $10, 9, 8$ hoặc dưới $8$ điểm. Tính xác suất để sau ba lần bắn, vận động viên đó đạt được ít nhất $28$ điểm.",
    dapAnDung: "D"
  },
  {
    id: "bt-21948091b4d1",
    deBai: "Tìm tổng tất cả các giá trị thực của tham số $a$ để giới hạn $\\lim \\left( \\frac{3n+2}{n+2}+a^{2}-4a \\right) = 0$.",
    dapAnDung: "A"
  },
  {
    id: "bt-27310be9768d",
    deBai: "Một quả bóng được thả rơi thẳng đứng từ độ cao $8\\text{ m}$ xuống mặt đất. Sau mỗi lần chạm đất, quả bóng lại nảy lên theo phương thẳng đứng với độ cao bằng $\\frac{3}{4}$ độ cao của lần rơi ngay trước đó. Tính tổng quãng đường quả bóng đã di chuyển kể từ lúc bắt đầu thả cho đến khi bóng hoàn toàn dừng lại trên mặt đất.",
    dapAnDung: "C"
  },
  {
    id: "bt-39a222cab670",
    deBai: "Cho dãy số $(u_n)$ xác định bởi $u_n = \\frac{a}{2} + \\frac{2-3a}{2(2n^2+3)}$ với $a$ là tham số. Có bao nhiêu giá trị nguyên của $a$ thuộc đoạn $[-5; 5]$ để dãy số $(u_n)$ là một dãy số tăng?",
    dapAnDung: "C"
  },
  {
    id: "bt-3edd5534d01d",
    deBai: "Chọn ngẫu nhiên một tam giác từ tập hợp tất cả các tam giác có độ dài ba cạnh là các số nguyên thuộc tập hợp $\\{1; 2; 3; 4; 5; 6\\}$. Tính xác suất để tam giác được chọn là tam giác cân.",
    dapAnDung: "C"
  },
  {
    id: "bt-4da2cc146b35",
    deBai: "Một đội bóng có 5 cầu thủ thực hiện loạt sút luân lưu 11m. Xác suất sút thành công của các cầu thủ từ thứ 1 đến thứ 5 lần lượt là $0{,}8$; $0{,}8$; $0{,}76$; $0{,}72$ và $0{,}68$. Tính xác suất để đúng bốn cầu thủ đầu sút thành công và cầu thủ thứ 5 sút hỏng.",
    dapAnDung: "A"
  },
  {
    id: "bt-6f68d2288c4f",
    deBai: "Một trạm thu phát tín hiệu có 2 hệ thống độc lập I và II. Hệ thống I gồm 2 bộ phận, hoạt động bình thường khi cả 2 bộ phận hoạt động (xác suất mỗi bộ phận hoạt động là $0{,}85$). Hệ thống II bị hỏng khi cả 2 bộ phận của nó bị hỏng (xác suất mỗi bộ phận bị hỏng là $0{,}15$). Tính xác suất để cả hai hệ thống I và II cùng bị hỏng.",
    dapAnDung: "D"
  },
  {
    id: "bt-84528bac6824",
    deBai: "Cho góc lượng giác $\\alpha$ có điểm biểu diễn thuộc góc phần tư thứ nhất trên đường tròn lượng giác. Khẳng định nào sau đây đúng?",
    dapAnDung: "B"
  },
  {
    id: "bt-8ec21308caba",
    deBai: "Gọi $S$ là tập hợp tất cả các giá trị nguyên của tham số $m$ để phương trình $\\cos\\left(2x - \\frac{\\pi}{3}\\right) - m = 2$ có nghiệm. Tính tổng $T$ tất cả các phần tử của tập hợp $S$.",
    dapAnDung: "D"
  },
  {
    id: "bt-94d7782db5a0",
    deBai: "Tổng tất cả các nghiệm của phương trình $2\\log_2(2x-2) + \\log_2(x-3)^2 = 2$ bằng:",
    dapAnDung: "D"
  },
  {
    id: "bt-b4ded858c24f",
    deBai: "Cho hàm số $y = \\frac{x-2}{1-x}$ có đồ thị $(C)$. Gọi $S$ là tập hợp tất cả các giá trị của tham số $m$ để qua điểm $A(m; 1)$ có thể kẻ được đúng một tiếp tuyến đến đồ thị $(C)$. Tổng bình phương tất cả các phần tử của tập hợp $S$ bằng:",
    dapAnDung: "C"
  },
  {
    id: "bt-b8e1760b085d",
    deBai: "Một người thả một lượng bèo hoa dâu vào một hồ nước. Cứ sau mỗi giờ, diện tích bèo tăng gấp $10$ lần so với diện tích ngay trước đó. Sau $12$ giờ thì bèo phủ kín toàn bộ mặt hồ. Hỏi sau khoảng bao nhiêu giờ thì bèo phủ kín $\\frac{1}{5}$ diện tích mặt hồ?",
    dapAnDung: "D"
  },
  {
    id: "bt-d5b700e67417",
    deBai: "Một người gửi tiết kiệm $200$ triệu đồng vào ngân hàng theo hình thức lãi kép với lãi suất $0{,}58\\%$/tháng. Giả định lãi suất không đổi và người đó không rút tiền trong suốt thời gian gửi, hỏi sau ít nhất bao nhiêu tháng thì người đó có được tối thiểu $225$ triệu đồng cả gốc lẫn lãi trong tài khoản?",
    dapAnDung: "A"
  },
  {
    id: "bt-eaa141c3af2b",
    deBai: "Biết ba số $C_{14}^{k}, C_{14}^{k+1}, C_{14}^{k+2}$ với $k \\in \\mathbb{N}, k \\le 12$ theo thứ tự đó lập thành một cấp số cộng. Tổng tất cả các giá trị có thể có của $k$ bằng:",
    dapAnDung: "A"
  }
];

async function applyPatches() {
  console.log(`=== BẮT ĐẦU CẬP NHẬT ${patches.length} CÂU HỎI BỊ LỖI / THIẾU CONTEXT ===`);

  let count = 0;
  for (const patch of patches) {
    const existing = await prisma.baiTap.findUnique({
      where: { id: patch.id },
      select: { id: true, dapAn: true, deBai: true, loiGiaiChiTiet: true }
    });

    if (!existing) {
      console.warn(`[WARN] Không tìm thấy câu hỏi ${patch.id}`);
      continue;
    }

    let parsedDapAn: any = {};
    try {
      parsedDapAn = JSON.parse(existing.dapAn);
    } catch {}

    if (patch.dapAnDung) {
      parsedDapAn.dapAnDung = patch.dapAnDung;
    }
    if (patch.options) {
      parsedDapAn.cacLuaChon = patch.options;
    }

    const dataToUpdate: any = {
      dapAn: JSON.stringify(parsedDapAn)
    };

    if (patch.deBai) {
      dataToUpdate.deBai = patch.deBai;
    }
    if (patch.loiGiai) {
      dataToUpdate.loiGiaiChiTiet = patch.loiGiai;
    }

    await prisma.baiTap.update({
      where: { id: patch.id },
      data: dataToUpdate
    });

    count++;
    console.log(`[OK] (${count}/${patches.length}) Đã cập nhật thành công câu hỏi ${patch.id}`);
  }

  console.log(`\n=> HOÀN TẤT CẬP NHẬT ${count} CÂU HỎI!`);
}

applyPatches()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

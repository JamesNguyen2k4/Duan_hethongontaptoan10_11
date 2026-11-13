// Danh mục các Dạng bài toán chuẩn hóa cho 27 Bài học Toán 10 (KNTT)
// Quy ước ID: chương "lop10-c{ch}", chủ đề "lop10-c{ch}-cd{bai}", dạng "lop10-b{bai}-d{n}"

import type { BaiHocDangBaiConfig, DangBaiInfo } from "./types";

type BaiDef = [baiNum: number, chuong: number, tenBai: string, dangs: [string, string][]];

const BAI_LOP10: BaiDef[] = [
  // ── Chương 1. Mệnh đề và tập hợp
  [1, 1, "Bài 1. Mệnh đề", [
    ["Dạng 1. Nhận biết mệnh đề & Tính đúng sai", "Xác định câu nào là mệnh đề, mệnh đề chứa biến và tính đúng sai"],
    ["Dạng 2. Mệnh đề phủ định", "Lập mệnh đề phủ định, phủ định của mệnh đề chứa ∀, ∃"],
    ["Dạng 3. Mệnh đề kéo theo & Mệnh đề tương đương", "Điều kiện cần, điều kiện đủ, điều kiện cần và đủ"],
    ["Dạng 4. Mệnh đề chứa kí hiệu ∀, ∃", "Đọc, viết và xét tính đúng sai của mệnh đề lượng hóa"],
  ]],
  [2, 1, "Bài 2. Tập hợp và các phép toán trên tập hợp", [
    ["Dạng 1. Tập hợp & Cách xác định tập hợp", "Liệt kê phần tử, chỉ ra tính chất đặc trưng, tập rỗng"],
    ["Dạng 2. Tập con & Hai tập hợp bằng nhau", "Quan hệ bao hàm, đếm số tập con"],
    ["Dạng 3. Giao, hợp, hiệu & Phần bù", "Thực hiện các phép toán trên tập hợp hữu hạn"],
    ["Dạng 4. Các tập con của tập số thực", "Khoảng, đoạn, nửa khoảng và phép toán trên trục số"],
  ]],
  // ── Chương 2. Bất phương trình và hệ bất phương trình bậc nhất hai ẩn
  [3, 2, "Bài 3. Bất phương trình bậc nhất hai ẩn", [
    ["Dạng 1. Nhận biết bất phương trình & Nghiệm", "Xác định BPT bậc nhất hai ẩn, kiểm tra cặp số là nghiệm"],
    ["Dạng 2. Biểu diễn miền nghiệm", "Xác định nửa mặt phẳng miền nghiệm trên mặt phẳng tọa độ"],
    ["Dạng 3. Bài toán thực tế", "Lập bất phương trình bậc nhất hai ẩn từ tình huống thực tế"],
  ]],
  [4, 2, "Bài 4. Hệ bất phương trình bậc nhất hai ẩn", [
    ["Dạng 1. Nhận biết hệ & Nghiệm của hệ", "Kiểm tra cặp số là nghiệm của hệ bất phương trình"],
    ["Dạng 2. Biểu diễn miền nghiệm của hệ", "Xác định miền đa giác nghiệm của hệ"],
    ["Dạng 3. Giá trị lớn nhất, nhỏ nhất của F = ax + by", "Tìm cực trị biểu thức trên miền đa giác"],
    ["Dạng 4. Bài toán tối ưu thực tế", "Lập hệ và giải bài toán kinh tế, sản xuất"],
  ]],
  // ── Chương 3. Hệ thức lượng trong tam giác
  [5, 3, "Bài 5. Giá trị lượng giác của một góc từ 0° đến 180°", [
    ["Dạng 1. Tính giá trị lượng giác", "Giá trị lượng giác của góc đặc biệt, dấu của giá trị lượng giác"],
    ["Dạng 2. Góc bù nhau, phụ nhau", "Quan hệ giữa giá trị lượng giác của hai góc bù, phụ nhau"],
    ["Dạng 3. Hệ thức cơ bản & Rút gọn biểu thức", "sin²α + cos²α = 1, tính giá trị biểu thức lượng giác"],
  ]],
  [6, 3, "Bài 6. Hệ thức lượng trong tam giác", [
    ["Dạng 1. Định lí côsin", "Tính cạnh, góc của tam giác theo định lí côsin"],
    ["Dạng 2. Định lí sin & Bán kính đường tròn ngoại tiếp", "Áp dụng a/sinA = 2R"],
    ["Dạng 3. Diện tích tam giác", "Công thức S = ½ab·sinC, Heron, S = pr, S = abc/4R"],
    ["Dạng 4. Giải tam giác & Ứng dụng thực tế", "Đo khoảng cách, chiều cao trong thực tế"],
  ]],
  // ── Chương 4. Vectơ
  [7, 4, "Bài 7. Các khái niệm mở đầu", [
    ["Dạng 1. Xác định vectơ, phương & hướng", "Vectơ cùng phương, cùng hướng, ngược hướng"],
    ["Dạng 2. Độ dài vectơ & Hai vectơ bằng nhau", "Tính độ dài, chứng minh hai vectơ bằng nhau"],
  ]],
  [8, 4, "Bài 8. Tổng và hiệu của hai vectơ", [
    ["Dạng 1. Quy tắc ba điểm, hình bình hành", "Tính tổng, hiệu vectơ bằng quy tắc"],
    ["Dạng 2. Chứng minh đẳng thức vectơ", "Biến đổi đẳng thức vectơ, trung điểm, trọng tâm"],
    ["Dạng 3. Độ dài tổng, hiệu hai vectơ", "Tính |u + v|, |u − v| trong hình học"],
  ]],
  [9, 4, "Bài 9. Tích của một vectơ với một số", [
    ["Dạng 1. Tích vectơ với một số", "Xác định vectơ k·a, tính chất"],
    ["Dạng 2. Phân tích vectơ theo hai vectơ không cùng phương", "Biểu diễn vectơ qua hai vectơ cơ sở"],
    ["Dạng 3. Ba điểm thẳng hàng & Điểm thỏa mãn đẳng thức vectơ", "Chứng minh thẳng hàng, xác định vị trí điểm"],
  ]],
  [10, 4, "Bài 10. Vectơ trong mặt phẳng tọa độ", [
    ["Dạng 1. Tọa độ vectơ & Tọa độ điểm", "Tọa độ vectơ AB, trung điểm, trọng tâm"],
    ["Dạng 2. Biểu thức tọa độ của các phép toán vectơ", "Tổng, hiệu, tích với một số theo tọa độ"],
    ["Dạng 3. Ứng dụng: thẳng hàng, hình bình hành", "Tìm điểm thỏa mãn điều kiện hình học"],
  ]],
  [11, 4, "Bài 11. Tích vô hướng của hai vectơ", [
    ["Dạng 1. Góc giữa hai vectơ", "Xác định và tính góc giữa hai vectơ"],
    ["Dạng 2. Tính tích vô hướng", "Theo định nghĩa và theo tọa độ"],
    ["Dạng 3. Vuông góc & Ứng dụng", "Điều kiện vuông góc, tính độ dài, góc trong tam giác"],
  ]],
  // ── Chương 5. Các số đặc trưng của mẫu số liệu không ghép nhóm
  [12, 5, "Bài 12. Số gần đúng và sai số", [
    ["Dạng 1. Số gần đúng & Sai số tuyệt đối", "Ước lượng sai số tuyệt đối, độ chính xác"],
    ["Dạng 2. Sai số tương đối", "Tính và so sánh sai số tương đối"],
    ["Dạng 3. Quy tròn số gần đúng", "Quy tròn theo hàng và theo độ chính xác"],
  ]],
  [13, 5, "Bài 13. Các số đặc trưng đo xu thế trung tâm", [
    ["Dạng 1. Số trung bình", "Tính số trung bình của mẫu số liệu"],
    ["Dạng 2. Trung vị & Tứ phân vị", "Xác định trung vị Me, Q1, Q2, Q3"],
    ["Dạng 3. Mốt & Chọn số đặc trưng phù hợp", "Tìm mốt, ý nghĩa các số đặc trưng"],
  ]],
  [14, 5, "Bài 14. Các số đặc trưng đo độ phân tán", [
    ["Dạng 1. Khoảng biến thiên & Khoảng tứ phân vị", "Tính R và ΔQ"],
    ["Dạng 2. Phương sai & Độ lệch chuẩn", "Tính s² và s của mẫu số liệu"],
    ["Dạng 3. Giá trị ngoại lệ", "Phát hiện giá trị bất thường trong mẫu số liệu"],
  ]],
  // ── Chương 6. Hàm số, đồ thị và ứng dụng
  [15, 6, "Bài 15. Hàm số", [
    ["Dạng 1. Tập xác định của hàm số", "Tìm tập xác định của hàm phân thức, căn thức"],
    ["Dạng 2. Giá trị hàm số & Đồ thị", "Tính giá trị, điểm thuộc đồ thị"],
    ["Dạng 3. Sự đồng biến, nghịch biến", "Xét tính đơn điệu từ đồ thị và định nghĩa"],
  ]],
  [16, 6, "Bài 16. Hàm số bậc hai", [
    ["Dạng 1. Xác định hàm số bậc hai", "Tìm hệ số a, b, c theo điều kiện"],
    ["Dạng 2. Đỉnh, trục đối xứng & Đồ thị parabol", "Đọc và vẽ đồ thị y = ax² + bx + c"],
    ["Dạng 3. Bảng biến thiên & Giá trị lớn nhất, nhỏ nhất", "Khoảng đồng biến, nghịch biến, GTLN – GTNN"],
    ["Dạng 4. Ứng dụng thực tế", "Bài toán quỹ đạo, tối ưu lợi nhuận"],
  ]],
  [17, 6, "Bài 17. Dấu của tam thức bậc hai", [
    ["Dạng 1. Xét dấu tam thức bậc hai", "Lập bảng xét dấu f(x) = ax² + bx + c"],
    ["Dạng 2. Giải bất phương trình bậc hai", "Tìm tập nghiệm bất phương trình bậc hai một ẩn"],
    ["Dạng 3. Bài toán chứa tham số", "Tìm m để tam thức luôn dương / âm, BPT có nghiệm"],
  ]],
  [18, 6, "Bài 18. Phương trình quy về phương trình bậc hai", [
    ["Dạng 1. Phương trình √f(x) = √g(x)", "Bình phương hai vế và thử lại nghiệm"],
    ["Dạng 2. Phương trình √f(x) = g(x)", "Đặt điều kiện, bình phương và đối chiếu điều kiện"],
  ]],
  // ── Chương 7. Phương pháp tọa độ trong mặt phẳng
  [19, 7, "Bài 19. Phương trình đường thẳng", [
    ["Dạng 1. Vectơ pháp tuyến & Vectơ chỉ phương", "Xác định VTPT, VTCP, hệ số góc"],
    ["Dạng 2. Phương trình tổng quát", "Lập phương trình tổng quát của đường thẳng"],
    ["Dạng 3. Phương trình tham số", "Lập phương trình tham số, chuyển đổi giữa các dạng"],
  ]],
  [20, 7, "Bài 20. Vị trí tương đối giữa hai đường thẳng. Góc và khoảng cách", [
    ["Dạng 1. Vị trí tương đối của hai đường thẳng", "Cắt nhau, song song, trùng nhau, vuông góc"],
    ["Dạng 2. Góc giữa hai đường thẳng", "Tính góc theo vectơ pháp tuyến / chỉ phương"],
    ["Dạng 3. Khoảng cách từ điểm đến đường thẳng", "Công thức khoảng cách và ứng dụng"],
  ]],
  [21, 7, "Bài 21. Đường tròn trong mặt phẳng tọa độ", [
    ["Dạng 1. Nhận dạng phương trình đường tròn", "Xác định tâm và bán kính"],
    ["Dạng 2. Lập phương trình đường tròn", "Biết tâm và bán kính, qua ba điểm, đường kính"],
    ["Dạng 3. Tiếp tuyến của đường tròn", "Lập phương trình tiếp tuyến tại một điểm"],
  ]],
  [22, 7, "Bài 22. Ba đường conic", [
    ["Dạng 1. Elip", "Phương trình chính tắc, tiêu điểm, trục lớn, trục nhỏ"],
    ["Dạng 2. Hypebol", "Phương trình chính tắc và các yếu tố của hypebol"],
    ["Dạng 3. Parabol", "Phương trình chính tắc, tiêu điểm, đường chuẩn"],
  ]],
  // ── Chương 8. Đại số tổ hợp
  [23, 8, "Bài 23. Quy tắc đếm", [
    ["Dạng 1. Quy tắc cộng", "Đếm theo các phương án loại trừ nhau"],
    ["Dạng 2. Quy tắc nhân", "Đếm theo các công đoạn liên tiếp"],
    ["Dạng 3. Sơ đồ hình cây & Bài toán đếm số", "Lập số thỏa mãn điều kiện"],
  ]],
  [24, 8, "Bài 24. Hoán vị, chỉnh hợp và tổ hợp", [
    ["Dạng 1. Hoán vị", "Sắp xếp n phần tử, n!"],
    ["Dạng 2. Chỉnh hợp", "Chọn và sắp thứ tự k phần tử, Aₙᵏ"],
    ["Dạng 3. Tổ hợp", "Chọn k phần tử không thứ tự, Cₙᵏ"],
    ["Dạng 4. Bài toán đếm tổng hợp", "Phối hợp quy tắc đếm với hoán vị, chỉnh hợp, tổ hợp"],
  ]],
  [25, 8, "Bài 25. Nhị thức Newton", [
    ["Dạng 1. Khai triển nhị thức (a + b)ⁿ với n ≤ 5", "Viết khai triển theo công thức nhị thức Newton"],
    ["Dạng 2. Hệ số & Số hạng trong khai triển", "Tìm hệ số của xᵏ, số hạng không chứa x"],
  ]],
  // ── Chương 9. Tính xác suất theo định nghĩa cổ điển
  [26, 9, "Bài 26. Biến cố và định nghĩa cổ điển của xác suất", [
    ["Dạng 1. Không gian mẫu & Biến cố", "Mô tả không gian mẫu, biến cố, biến cố đối"],
    ["Dạng 2. Xác suất theo định nghĩa cổ điển", "Tính P(A) = n(A)/n(Ω)"],
    ["Dạng 3. Xác suất của biến cố đối", "P(Ā) = 1 − P(A)"],
  ]],
  [27, 9, "Bài 27. Thực hành tính xác suất theo định nghĩa cổ điển", [
    ["Dạng 1. Dùng sơ đồ hình cây", "Liệt kê kết quả bằng sơ đồ hình cây"],
    ["Dạng 2. Dùng tổ hợp để đếm", "Kết hợp tổ hợp tính xác suất"],
    ["Dạng 3. Bài toán thực tế tổng hợp", "Xác suất trong trò chơi, bốc thăm, chọn nhóm"],
  ]],
];

export const CHUONG_LOP10 = [
  { id: "lop10-c1", ten: "Chương 1: Mệnh đề và tập hợp", thuTu: 1 },
  { id: "lop10-c2", ten: "Chương 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn", thuTu: 2 },
  { id: "lop10-c3", ten: "Chương 3: Hệ thức lượng trong tam giác", thuTu: 3 },
  { id: "lop10-c4", ten: "Chương 4: Vectơ", thuTu: 4 },
  { id: "lop10-c5", ten: "Chương 5: Các số đặc trưng của mẫu số liệu không ghép nhóm", thuTu: 5 },
  { id: "lop10-c6", ten: "Chương 6: Hàm số, đồ thị và ứng dụng", thuTu: 6 },
  { id: "lop10-c7", ten: "Chương 7: Phương pháp tọa độ trong mặt phẳng", thuTu: 7 },
  { id: "lop10-c8", ten: "Chương 8: Đại số tổ hợp", thuTu: 8 },
  { id: "lop10-c9", ten: "Chương 9: Tính xác suất theo định nghĩa cổ điển", thuTu: 9 },
];

export const DANH_MUC_DANG_BAI_LOP10: Record<string, BaiHocDangBaiConfig> =
  Object.fromEntries(
    BAI_LOP10.map(([baiNum, ch, tenBai, dangs]) => {
      const chuDeId = `lop10-c${ch}-cd${baiNum}`;
      const dangInfos: DangBaiInfo[] = dangs.map(([ten, moTa], i) => ({
        id: `lop10-b${baiNum}-d${i + 1}`,
        ten,
        moTa,
      }));
      return [
        chuDeId,
        { baiNum, chuDeId, chuongId: `lop10-c${ch}`, tenBai, dangs: dangInfos },
      ];
    })
  );


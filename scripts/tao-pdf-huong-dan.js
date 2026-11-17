const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const katex = require("katex");

// Hàm render math chuẩn hóa KaTeX
function m(tex, display = false) {
  try {
    return katex.renderToString(tex, {
      displayMode: display,
      throwOnError: true,
    });
  } catch (e) {
    console.warn("Lỗi KaTeX trên công thức:", tex, e.message);
    return `<code class="katex-error">${tex}</code>`;
  }
}

const katexCssPath = path.join(__dirname, "../node_modules/katex/dist/katex.min.css");
const katexCss = fs.readFileSync(katexCssPath, "utf-8");

const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Tài Liệu Kỹ Thuật & Giải Thuật Lõi - Hệ Thống Ôn Tập Toán 10-11</title>
  <style>
    ${katexCss}

    @page {
      size: A4;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }

    /* Bìa & Tiêu đề */
    .doc-header {
      border-bottom: 2.5px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .project-badge {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #1d4ed8;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 3px 10px;
      border-radius: 999px;
      margin-bottom: 6px;
    }
    h1 {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
      margin: 4px 0 6px 0;
      line-height: 1.25;
    }
    .doc-subtitle {
      font-size: 9.5pt;
      color: #475569;
      font-weight: 500;
      margin: 0;
    }
    .doc-meta {
      font-size: 8.5pt;
      color: #64748b;
      margin-top: 6px;
    }

    /* Các đề mục liên tục */
    h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #1e3a8a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 20px;
      margin-bottom: 8px;
      page-break-after: avoid;
    }
    h3 {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 12px;
      margin-bottom: 5px;
      page-break-after: avoid;
    }

    p {
      margin: 0 0 8px 0;
      text-align: justify;
    }

    ul, ol {
      margin: 0 0 9px 0;
      padding-left: 19px;
    }
    li {
      margin-bottom: 4px;
    }

    /* Bảng dữ liệu */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0 14px 0;
      font-size: 8.5pt;
      page-break-inside: avoid;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
    }
    tr:nth-child(even) td {
      background: #f8fafc;
    }

    /* Khung công thức / Box ghi chú */
    .formula-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #3b82f6;
      border-radius: 6px;
      padding: 9px 13px;
      margin: 9px 0 12px 0;
      page-break-inside: avoid;
    }
    .formula-title {
      font-size: 9pt;
      font-weight: 700;
      color: #1d4ed8;
      margin-bottom: 4px;
    }

    .highlight-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #16a34a;
      border-radius: 6px;
      padding: 8px 12px;
      margin: 9px 0;
      font-size: 9pt;
      page-break-inside: avoid;
    }

    .flow-step {
      display: flex;
      margin-bottom: 7px;
    }
    .step-num {
      width: 20px;
      height: 20px;
      background: #2563eb;
      color: #fff;
      font-weight: 700;
      border-radius: 50%;
      text-align: center;
      line-height: 20px;
      font-size: 8pt;
      margin-right: 9px;
      shrink: 0;
    }
    .step-content {
      flex: 1;
    }

    code {
      font-family: Consolas, Monaco, "Courier New", monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
      color: #0f172a;
    }
  </style>
</head>
<body>

  <!-- TIÊU ĐỀ TÀI LIỆU -->
  <div class="doc-header">
    <div class="project-badge">Tài Liệu Kỹ Thuật &amp; Giải Thuật Lõi</div>
    <h1>Hệ Thống Ôn Tập Thích Ứng Môn Toán 10–11</h1>
    <p class="doc-subtitle">Kiến trúc tổng thể, mô hình học tập cá nhân hóa đa tầng (BKT + IRT + PFA) và thuật toán giãn cách trí nhớ FSRS</p>
    <div class="doc-meta">
      Phiên bản: 2.1 Production • Stack: Next.js 14, TypeScript, Prisma ORM, PostgreSQL (Supabase) • Năm học 2026
    </div>
  </div>

  <!-- NỘI DUNG LIÊN TỤC -->
  <h2>1. Tổng quan Kiến trúc &amp; Luồng Vận hành Hệ thống</h2>
  <p>
    Hệ thống được phát triển nhằm giải quyết triệt để vấn đề "học vẹt", luyện đề tràn lan không mục đích và tình trạng quên dần kiến thức sau khi học xong các chương Toán lớp 10 và 11. Thay vì phát đề ngẫu nhiên hoặc bài tập cố định cho tất cả học sinh, hệ thống ứng dụng mô hình <strong>Học tập thích ứng lai (Hybrid Adaptive Learning)</strong> kết hợp <strong>Lập lịch ôn tập ngắt quãng (Spaced Repetition)</strong>.
  </p>
  <p>
    Kiến trúc vận hành khép kín theo chu trình 6 bước thời gian thực (Real-time Feedback Loop):
  </p>

  <div class="flow-step">
    <div class="step-num">1</div>
    <div class="step-content"><strong>Học sinh vào phòng luyện tập:</strong> Hệ thống tự động phân tích hồ sơ năng lực của học sinh trên từng dạng bài trong chương/chủ đề hiện tại.</div>
  </div>
  <div class="flow-step">
    <div class="step-num">2</div>
    <div class="step-content"><strong>Điều phối câu hỏi thông minh (ZPD):</strong> Thuật toán chọn câu hỏi có độ khó phù hợp với trình độ, sao cho xác suất làm đúng dự đoán đạt xấp xỉ ${m("P \\approx 0.70")}, ưu tiên các dạng bài đang đến hạn suy giảm trí nhớ.</div>
  </div>
  <div class="flow-step">
    <div class="step-num">3</div>
    <div class="step-content"><strong>Ghi nhận kết quả làm bài:</strong> Học sinh nộp bài (Trắc nghiệm 4 lựa chọn hoặc Điền đáp số). Hệ thống đối soát kết quả, ghi nhận thời gian thực hiện và cung cấp lời giải chi tiết từng bước.</div>
  </div>
  <div class="flow-step">
    <div class="step-num">4</div>
    <div class="step-content"><strong>Cập nhật mô hình người học (Student Modeling):</strong> Đồng thời kích hoạt Contextual BKT, IRT 3PL, PFA và hiệu chỉnh độ khó thực nghiệm Elo của câu hỏi.</div>
  </div>
  <div class="flow-step">
    <div class="step-num">5</div>
    <div class="step-content"><strong>Lập lịch suy giảm trí nhớ FSRS:</strong> Tính toán độ bền ký ức mới và hẹn ngày ôn tập tối ưu để giữ mức độ ghi nhớ dài hạn luôn đạt trên ${m("90\\%")}.</div>
  </div>
  <div class="flow-step">
    <div class="step-num">6</div>
    <div class="step-content"><strong>Phản hồi &amp; Báo cáo:</strong> Cập nhật tức thì biểu đồ mạng nhện năng lực, danh sách dạng bài cần ôn lại hôm nay và bảng phân tích điểm yếu cho học sinh lẫn giáo viên.</div>
  </div>

  <h2>2. Bảng Tổng hợp Thuật toán &amp; Cơ sở Khoa học</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Thuật toán / Mô hình</th>
        <th style="width: 24%;">Nền tảng Khoa học</th>
        <th style="width: 28%;">Vị trí Mã nguồn</th>
        <th style="width: 26%;">Vai trò trong Hệ thống</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Contextual BKT</strong><br>(Bayesian Knowledge Tracing)</td>
        <td>Corbett &amp; Anderson (CMU, 1994); mở rộng Baker &amp; Pardos</td>
        <td><code>src/lib/adaptive-engine.ts</code><br>(dòng 580 – 624)</td>
        <td>Theo dõi xác suất ẩn nắm vững dạng bài ${m("P(L_t)")}. Có tính đến bước chuyển tiếp học từ lời giải chi tiết (${m("P_T")}).</td>
      </tr>
      <tr>
        <td><strong>IRT 3PL &amp; Online Elo</strong><br>(Item Response Theory)</td>
        <td>Lord (1980); Pelánek (2016)</td>
        <td><code>src/lib/adaptive-engine.ts</code><br>(dòng 108 – 198, 626 – 648)</td>
        <td>Ước lượng năng lực liên tục ${m("\\theta \\in [-2.5, +2.5]")}; tự động cập nhật độ khó thực nghiệm ${m("b_i")} của câu hỏi từ dữ liệu làm bài.</td>
      </tr>
      <tr>
        <td><strong>PFA &amp; Laplace Smoothing</strong><br>(Performance Factor Analysis)</td>
        <td>Pavlik, Cen &amp; Koedinger (2009)</td>
        <td><code>src/lib/adaptive-engine.ts</code><br>(dòng 204 – 235)</td>
        <td>Hồi quy logistic dựa trên số lần làm đúng, sai và chuỗi đúng (streak), triệt tiêu điểm số ảo khi mới làm 1 câu.</td>
      </tr>
      <tr>
        <td><strong>Composite Mastery Index</strong><br>(Chỉ số Làm chủ Tổng hợp)</td>
        <td>Mô hình tích hợp đa thành phần &amp; Hệ số quy mô mẫu</td>
        <td><code>src/lib/adaptive-engine.ts</code><br>(dòng 264 – 310)</td>
        <td>Công thức tính độ thành thạo thực tế: kết hợp ${m("45\\%")} IRT, ${m("30\\%")} BKT, ${m("25\\%")} PFA, bão hòa theo mẫu và suy giảm theo thời gian.</td>
      </tr>
      <tr>
        <td><strong>Surprise-Modulated FSRS</strong><br>(Lập lịch Ôn tập Ngắt quãng)</td>
        <td>FSRS v4 (Jarrett Ye); 3 trụ cột ${m("R - S - D")}</td>
        <td><code>src/lib/spaced-repetition.ts</code><br>(dòng 1 – 215)</td>
        <td>Theo dõi độ bền trí nhớ ${m("S")}, xác suất nhớ ${m("R(t)")}, xếp hạng Grade theo mức chênh lệch kỳ vọng thay vì dùng thời gian bấm nút.</td>
      </tr>
      <tr>
        <td><strong>ZPD Question Selector</strong><br>(Vùng Phát triển Gần)</td>
        <td>L. S. Vygotsky (Zone of Proximal Development)</td>
        <td><code>src/lib/adaptive-engine.ts</code><br>(dòng 947 – 1167)</td>
        <td>Lựa chọn câu hỏi tối ưu có ${m("P(\\text{correct}) \\approx 0.70")}, ngăn ngừa chán nản khi câu quá dễ hoặc bỏ cuộc khi câu quá khó.</td>
      </tr>
    </tbody>
  </table>

  <h2>3. Cơ chế Theo dõi Năng lực theo Ngữ cảnh (Contextual BKT)</h2>
  <p>
    Mô hình BKT xem việc nắm vững một dạng bài toán là một biến trạng thái nhị phân ẩn (Hidden Markov Model): học sinh hoặc là <em>chưa nắm</em> (${m("L_0")}), hoặc <em>đã nắm</em> (${m("L_1")}).
  </p>

  <div class="formula-box">
    <div class="formula-title">Tham số Đoán mò (Guess - c) và Sơ suất (Slip - s) chuẩn hóa:</div>
    <ul>
      <li><strong>Câu Điền đáp số / Tự luận:</strong> ${m("c = 0.02")} (học sinh hầu như không thể đoán mò được kết quả số học).</li>
      <li><strong>Câu Trắc nghiệm ${m("k")} phương án:</strong> ${m("c = \\frac{1}{k}")} (mặc định 4 phương án thì ${m("c = 0.25")}).</li>
      <li><strong>Xác suất sơ suất (${m("P_S")}):</strong> Dao động trong khoảng ${m("[0.05, 0.20]")}, phụ thuộc vào độ khó ${m("b_i")} của câu hỏi: ${m("P_S = 0.08 + 0.03 \\cdot b_i")}.</li>
    </ul>
  </div>

  <p><strong>Quy tắc cập nhật hậu nghiệm Bayes:</strong></p>
  <ul>
    <li>Khi học sinh trả lời <strong>ĐÚNG</strong> (${m("Y = 1")}):
      ${m("P(L_t \\mid Y = 1) = \\frac{P(L_{t-1}) \\cdot (1 - P_S)}{P(L_{t-1}) \\cdot (1 - P_S) + (1 - P(L_{t-1})) \\cdot P_G}", true)}
    </li>
    <li>Khi học sinh trả lời <strong>SAI</strong> (${m("Y = 0")}):
      ${m("P(L_t \\mid Y = 0) = \\frac{P(L_{t-1}) \\cdot P_S}{P(L_{t-1}) \\cdot P_S + (1 - P(L_{t-1})) \\cdot (1 - P_G)}", true)}
    </li>
  </ul>

  <div class="highlight-card">
    <strong>Điểm cải tiến sư phạm:</strong> Khi học sinh làm sai, hệ thống vẫn áp dụng bước chuyển tiếp học tập ${m("P_T")} với hệ số ${m("30\\%")} (${m("P_T^{\\text{eff}} = 0.30 \\cdot P_T")}). Cơ sở là học sinh không bị bỏ rơi mà được hệ thống cung cấp <strong>Lời giải chi tiết từng bước</strong> ngay sau câu trả lời sai, giúp học sinh học được từ chính lỗi sai của mình.
  </div>

  <h2>4. Mô hình Đo lường Năng lực IRT 3PL &amp; Hiệu chỉnh Độ khó Online Elo</h2>
  <p>
    Lý thuyết Ứng đáp Câu hỏi 3 tham số (IRT 3PL) mô hình hóa xác suất trả lời đúng câu hỏi ${m("i")} của học sinh có năng lực ${m("\\theta")}:
  </p>
  <div class="formula-box">
    <div class="formula-title">Hàm xác suất IRT 3PL:</div>
    ${m("P(\\text{correct} \\mid \\theta, a_i, b_i, c_i) = c_i + \\frac{1 - c_i}{1 + e^{-1.702 \\cdot a_i \\cdot (\\theta - b_i)}}", true)}
    <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
      Trong đó: ${m("\\theta")} là năng lực học sinh; ${m("b_i")} là độ khó câu hỏi; ${m("a_i")} là độ phân biệt câu hỏi (${m("a_i \\in [0.8, 2.0]")}); ${m("c_i")} là tham số đoán mò (${m("c_i \\in \\{0.02, 0.25\\}")}).
    </div>
  </div>

  <h3>Hiệu chỉnh Độ khó Thực nghiệm bằng Thuật toán Elo (Online Calibration)</h3>
  <p>
    Ban đầu, câu hỏi được gán độ khó ${m("b_0")} theo 4 mức độ nhận thức Bloom: Nhận biết (${m("-1.0")}), Thông hiểu (${m("-0.15")}), Vận dụng (${m("+0.75")}), Vận dụng cao (${m("+1.55")}). Tuy nhiên, độ khó lý thuyết này được tự động cập nhật liên tục từ dữ liệu thực tế:
  </p>
  <div class="formula-box">
    <div class="formula-title">Công thức cập nhật độ khó Elo của câu hỏi:</div>
    ${m("b_{\\text{new}} = b_{\\text{old}} + K_b \\cdot (P_{\\text{expected}} - y)", true)}
    <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
      Với ${m("y = 1")} nếu học sinh làm đúng, ${m("y = 0")} nếu làm sai; ${m("K_b = \\max\\left(0.025, \\frac{0.16}{1 + 0.06 \\cdot n}\\right)")} giảm dần theo số lượt làm bài ${m("n")}.
    </div>
  </div>
  <p>
    <em>Ý nghĩa thực tiễn:</em> Nếu một câu hỏi lý thuyết xếp là "Thông hiểu" nhưng đa số học sinh đều làm sai (${m("P_{\\text{expected}} > y")} $\implies$ ${m("b")} tăng), câu hỏi sẽ tự động được hệ thống nâng lên mức độ khó tương ứng mà không cần giáo viên phải can thiệp thủ công.
  </p>

  <h2>5. Chỉ số Làm chủ Kỹ năng Tổng hợp (Composite Mastery Index)</h2>
  <p>
    Để hiển thị tỉ lệ phần trăm thành thạo dạng bài chính xác và tin cậy trên giao diện, hệ thống kết hợp 4 thành phần theo công thức:
  </p>

  <div class="formula-box">
    <div class="formula-title">Công thức Độ Thành Thạo Thực Tế (${m("P_{\\text{eff}}")}):</div>
    ${m("P_{\\text{eff}} = \\left( 0.45 \\cdot P_{\\text{IRT}} + 0.30 \\cdot P_{\\text{BKT}} + 0.25 \\cdot P_{\\text{PFA}} \\right) \\times \\text{VolumeFactor} \\times R(t)", true)}
  </div>

  <ul>
    <li><strong>${m("P_{\\text{IRT}}")} (45% trọng số - Phản ánh độ khó đã chinh phục):</strong> Quy đổi năng lực liên tục ${m("\\theta")} sang thang xác suất qua hàm logistic trung tâm:
      ${m("P_{\\text{IRT}} = \\frac{1}{1 + e^{-1.45 \\cdot (\\theta + 0.1)}}")}. Nếu chỉ làm đúng các câu Nhận biết, ${m("\\theta")} bị chặn trần nên ${m("P_{\\text{IRT}}")} không vượt quá ${m("40\\% - 50\\%")}.
    </li>
    <li><strong>${m("P_{\\text{BKT}}")} (30% trọng số):</strong> Xác suất trạng thái ẩn nắm vững kiến thức từ chuỗi Bayes.</li>
    <li><strong>${m("P_{\\text{PFA}}")} (25% trọng số):</strong> Tỉ lệ chính xác thực nghiệm có làm mịn Laplace:
      ${m("P_{\\text{Laplace}} = \\frac{s + 0.5}{s + f + 3.0}")} (với ${m("s")} là số câu đúng, ${m("f")} là số câu sai).
    </li>
    <li><strong>${m("\\text{VolumeFactor}")} (Hệ số quy mô luyện tập):</strong>
      ${m("\\text{VolumeFactor} = \\min\\left(1.0, \\frac{s}{N_{\\text{target}}} \\cdot 0.65 + (1 - e^{-0.22 \\cdot s}) \\cdot 0.35\\right)")}.
      Chỉ tính dựa trên số câu làm đúng (${m("s")}) để chứng minh năng lực. Khi làm đúng câu đầu tiên, ${m("\\text{VolumeFactor} \\approx 0.14")} $\implies$ Độ thành thạo chỉ đạt khoảng ${m("4\\% - 7\\%")}; học sinh phải tích lũy từ 10–12 câu đúng mới đạt ${m("100\\%")} độ tin cậy.
    </li>
    <li><strong>${m("R(t)")} (Độ duy trì trí nhớ):</strong> Suy giảm dần theo thời gian nếu học sinh để lâu không ôn tập.</li>
  </ul>

  <h2>6. Thuật toán Lập lịch Ôn tập Ngắt quãng (Surprise-Modulated FSRS)</h2>
  <p>
    Dựa trên mô hình ghi nhớ 3 thành phần hiện đại (Free Spaced Repetition Scheduler - FSRS):
  </p>
  <ul>
    <li><strong>${m("R(t, S)")} (Retrievability):</strong> Xác suất nhớ kiến thức tại thời điểm sau ${m("t")} ngày:
      ${m("R(t, S) = \\left(1 + \\frac{19}{81} \\cdot \\frac{t}{S}\\right)^{-0.5}", true)}
      Khi thời gian trôi qua đúng bằng độ bền (${m("t = S")}), xác suất nhớ ${m("R")} rơi về đúng ngưỡng mục tiêu ${m("90\\%")} (${m("0.90")}).
    </li>
    <li><strong>${m("S")} (Stability):</strong> Độ bền của trí nhớ (tính bằng số ngày trước khi ${m("R")} giảm dưới ${m("90\\%")}).</li>
    <li><strong>${m("D")} (Difficulty):</strong> Độ khó nhận thức của dạng bài (${m("[1.0, 10.0]")}).</li>
  </ul>

  <div class="highlight-card">
    <strong>Cơ chế Chấm Grade theo "Mức độ Bất ngờ" (Surprise-Modulated):</strong>
    Thay vì dùng thời gian bấm nút (dễ bị học sinh đoán mò bấm nhanh để lấy điểm), hệ thống tự động gán Grade dựa trên chênh lệch giữa Kết quả thực tế (${m("y")}) và Xác suất kỳ vọng (${m("P_{\\text{expected}}")}):
    <ul style="margin-top: 4px; margin-bottom: 0;">
      <li><strong>Đúng câu vượt tầm (${m("P_{\\text{expected}} < 0.55")}):</strong> Grade 4 (Easy) $\to$ Tăng vọt độ bền ${m("S")}.</li>
      <li><strong>Đúng câu vừa sức (${m("0.55 \\le P_{\\text{expected}} \\le 0.85")}):</strong> Grade 3 (Good) $\to$ Tăng ${m("S")} chuẩn.</li>
      <li><strong>Sai câu dễ (${m("P_{\\text{expected}} \\ge 0.65")}):</strong> Grade 1 (Quên kiến thức cơ bản) $\to$ Hẹn ôn lại ngay sau 1 ngày.</li>
      <li><strong>Sai câu Vận dụng cao (${m("P_{\\text{expected}} < 0.65")}):</strong> Phân loại là <em>"thiếu năng lực giải câu khó"</em> chứ <strong>không phải "quên kiến thức"</strong> $\to$ Độ bền ${m("S")} chỉ giảm nhẹ ${m("6\\%")}, không bị ép ôn lại như thẻ bị quên.</li>
    </ul>
  </div>

  <h2>7. Thuật toán Điều phối Câu hỏi theo Vùng Phát triển Gần (ZPD Selector)</h2>
  <p>
    Thuật toán ZPD (Zone of Proximal Development) tự động lựa chọn câu hỏi phù hợp nhất theo quy trình 2 tầng:
  </p>

  <p><strong>Tầng 1 – Lựa chọn Dạng bài ưu tiên:</strong></p>
  <ol>
    <li><em>Ưu tiên 1 (Cần ôn lại):</em> Dạng bài có độ nhớ ${m("R(t) < 90\\%")} hoặc đã đến hạn ôn tập ngắt quãng FSRS hôm nay.</li>
    <li><em>Ưu tiên 2 (Đang rèn luyện):</em> Dạng bài đang học dở dang có độ thành thạo chưa đạt mốc ${m("85\\%")}.</li>
    <li><em>Ưu tiên 3 (Dạng bài mới):</em> Khám phá dạng toán mới chưa học theo thứ tự chuẩn sư phạm SGK.</li>
    <li><em>Ưu tiên 4 (Duy trì phong độ):</em> Khi tất cả dạng đã thành thạo, chọn dạng có ${m("P_{\\text{eff}}")} thấp nhất để thử thách nâng cao.</li>
  </ol>

  <p><strong>Tầng 2 – Chấm điểm ứng viên trong Ngân hàng câu hỏi:</strong></p>
  <div class="formula-box">
    <div class="formula-title">Hàm mục tiêu ZPD:</div>
    ${m("\\text{Score}(i) = \\left| P(\\text{correct} \\mid \\theta_{\\text{eff}}, b_i, a_i, c_i) - 0.70 \\right| + \\text{Penalty}(i)", true)}
    <div style="font-size: 8.5pt; color: #475569; margin-top: 4px;">
      Trong đó: ${m("0.70")} là điểm ngọt Vygotsky ZPD (học sinh giải đúng khoảng 7/10 câu); ${m("\\text{Penalty}")} phạt nặng các câu đã làm đúng gần đây (${m("+0.65")}) và ưu tiên các câu từng làm sai đến hạn ôn tập (${m("-0.12")}).
    </div>
  </div>

  <h2>8. Diễn đàn Hỏi đáp Hai cấp &amp; Hệ thống Thông báo Đa kênh</h2>
  <p>
    Nhằm tạo môi trường học tập cộng đồng tương tác ngang hàng (Peer-to-Peer Learning) và gắn kết giáo viên - học sinh:
  </p>
  <ul>
    <li><strong>Bộ lọc hai cấp độc lập:</strong>
      Giao diện lọc tại Diễn đàn được tách biệt thành 2 dropdown động: <em>Dropdown 1 (Chọn Bài học lý thuyết)</em> $\to$ <em>Dropdown 2 (Chọn Dạng bài tương ứng)</em>. Khi chọn bài học, danh sách dạng bài tự động cập nhật theo ngữ cảnh.
    </li>
    <li><strong>Hệ thống Thông báo Thời gian thực (Dual-tier Notifications):</strong>
      <ol style="margin-top: 4px;">
        <li><em>Thông báo Quả chuông trên Web (In-app):</em> Tự động hiển thị huy hiệu đỏ đếm số lượng câu hỏi mới chưa đọc trên Header của cả trang Quản trị giáo viên và trang học sinh.</li>
        <li><em>Thông báo tức thì qua Telegram Bot API:</em> Ngay khi học sinh đăng bài hỏi mới, hệ thống tự động bắn tin nhắn trực tiếp về nhóm Telegram của Tổ chuyên môn với nội dung định dạng HTML chuẩn (Khối lớp, Tên học sinh, Tiêu đề, Trích đoạn thắc mắc) kèm <strong>nút bấm điều hướng trực tiếp</strong> đến bài viết.</li>
      </ol>
    </li>
  </ul>

  <h2>9. Kết luận &amp; Giá trị Đổi mới Sáng tạo</h2>
  <p>
    Hệ thống ôn tập Toán 10–11 đã chuyển đổi phương thức ôn thi truyền thống từ <em>"học thụ động - luyện đề cào bằng"</em> sang <strong>"học tập thích ứng cá nhân hóa chính xác cao"</strong>. Việc tích hợp hài hòa giữa các thuật toán tâm trắc học giáo dục kinh điển (BKT, IRT, PFA) với mô hình khoa học nhận thức hiện đại (FSRS) mang lại 3 giá trị vượt trội:
  </p>
  <ul>
    <li><strong>Tiết kiệm 50% thời gian làm bài thừa:</strong> Học sinh không phải làm lại những câu quá dễ đã thành thạo.</li>
    <li><strong>Loại bỏ tâm lý sợ hãi môn Toán:</strong> Thuật toán ZPD luôn giữ học sinh trong trạng thái tâm lý dòng chảy (Flow State) với các câu hỏi vừa sức.</li>
    <li><strong>Bảo đảm khả năng nhân rộng quy mô lớn (Scalability):</strong> Hệ thống tự động chấm điểm, tự phân tích điểm yếu và tự lập lịch ôn tập, giúp 1 giáo viên có thể quản trị và bảo đảm chất lượng học tập cho hàng nghìn học sinh cùng lúc mà không làm phình to bộ máy nhân sự.</li>
  </ul>

</body>
</html>
`;

const htmlFilePath = path.join(__dirname, "../tailieu_kientruc.html");
const pdfFilePath = path.join(__dirname, "../Tai_Lieu_Kien_Truc_Va_Thuat_Toan_He_Thong.pdf");

fs.writeFileSync(htmlFilePath, htmlContent, "utf-8");
console.log("HTML generated at:", htmlFilePath);

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const fileUrl = "file:///" + htmlFilePath.replace(/\\/g, "/");
const command = '"' + edgePath + '" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="' + pdfFilePath + '" "' + fileUrl + '"';

try {
  console.log("Running Edge headless conversion...");
  execSync(command, { stdio: "inherit" });
  if (fs.existsSync(pdfFilePath)) {
    const stats = fs.statSync(pdfFilePath);
    console.log("PDF created successfully: " + pdfFilePath + " (" + stats.size + " bytes)");
  } else {
    console.error("PDF file not found after command.");
  }
} catch (err) {
  console.error("Error generating PDF:", err);
}

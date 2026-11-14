// Tóm tắt Phương pháp giải chuẩn mực cho 84 Dạng toán Toán 10 KNTT
// Bám sát SGK Kết Nối Tri Thức và Tài liệu Các Dạng Bài Tập Toán 10 (ThS. Phạm Lê Duy)

export interface PhuongPhapItem {
  dangId: string;
  dangTen: string;
  phuongPhap: string;
}

export const PHUONG_PHAP_84_DANG: Record<string, string> = {
  // ── Bài 1. Mệnh đề
  "lop10-b1-d1": `**Phương pháp giải:**
1. **Nhận biết mệnh đề:** Mệnh đề toán học là một khẳng định có tính đúng hoặc sai dứt khoát.
   - Câu hỏi, câu cảm thán, câu cầu khiến không phải mệnh đề.
   - Mệnh đề chứa biến $P(x)$ trở thành mệnh đề khi gán cho biến $x$ một giá trị cụ thể.
2. **Xét tính đúng sai:**
   - Khẳng định đúng nếu nó luôn đúng với mọi trường hợp trong phạm vi xét.
   - Khẳng định sai nếu chỉ ra được ít nhất một trường hợp làm nó sai (phản ví dụ).`,

  "lop10-b1-d2": `**Phương pháp giải:**
1. **Mệnh đề phủ định:** Phủ định của mệnh đề $P$ là $\\overline{P}$.
   - $P$ đúng khi và chỉ khi $\\overline{P}$ sai.
   - Để phủ định một khẳng định, ta thêm (hoặc bớt) từ "không" hoặc "không phải".
2. **Phủ định mệnh đề chứa kí hiệu $\\forall, \\exists$:**
   - Phủ định của "$\\forall x \\in X, P(x)$" là "$\\exists x \\in X, \\overline{P(x)}$".
   - Phủ định của "$\\exists x \\in X, P(x)$" là "$\\forall x \\in X, \\overline{P(x)}$".
   - Phủ định của quan hệ: $=$ thành $\\ne$, $>$ thành $\\le$, $<$ thành $\\ge$.`,

  "lop10-b1-d3": `**Phương pháp giải:**
1. **Mệnh đề kéo theo:** Kí hiệu $P \\Rightarrow Q$ ("Nếu $P$ thì $Q$").
   - $P \\Rightarrow Q$ chỉ sai khi $P$ đúng mà $Q$ sai; đúng trong tất cả các trường hợp còn lại.
   - $P$ là **điều kiện đủ** để có $Q$. $Q$ là **điều kiện cần** để có $P$.
2. **Mệnh đề đảo:** Mệnh đề đảo của $P \\Rightarrow Q$ là $Q \\Rightarrow P$.
3. **Mệnh đề tương đương:** Kí hiệu $P \\Leftrightarrow Q$ ("$P$ khi và chỉ khi $Q$").
   - $P \\Leftrightarrow Q$ đúng khi cả hai cùng đúng hoặc cùng sai.
   - $P$ là **điều kiện cần và đủ** để có $Q$.`,

  "lop10-b1-d4": `**Phương pháp giải:**
1. Mệnh đề "$\\forall x \\in X, P(x)$" đúng nếu với mọi phần tử $x_0 \\in X$ thì $P(x_0)$ là khẳng định đúng; sai nếu tồn tại $x_0 \\in X$ sao cho $P(x_0)$ sai.
2. Mệnh đề "$\\exists x \\in X, P(x)$" đúng nếu tìm được ít nhất một phần tử $x_0 \\in X$ sao cho $P(x_0)$ đúng; sai nếu với mọi $x \\in X$ thì $P(x)$ đều sai.`,

  // ── Bài 2. Tập hợp
  "lop10-b2-d1": `**Phương pháp giải:**
1. **Biểu diễn tập hợp:**
   - Liệt kê các phần tử: $A = \\{x_1, x_2, \\dots, x_n\\}$ (mỗi phần tử viết 1 lần, ngăn cách bởi dấu chấm phẩy).
   - Chỉ ra tính chất đặc trưng: $A = \\{x \\in X \\mid P(x)\\}$.
2. **Tập hợp rỗng ($\\varnothing$):** Là tập hợp không chứa bất kì phần tử nào. Nếu giải phương trình $P(x) = 0$ vô nghiệm trên tập $X$ thì tập nghiệm là $\\varnothing$.`,

  "lop10-b2-d2": `**Phương pháp giải:**
1. **Tập con:** $A \\subset B \\Leftrightarrow (\\forall x, x \\in A \\Rightarrow x \\in B)$.
   - Quy ước: $\\varnothing \\subset A$ với mọi tập hợp $A$.
   - Một tập hợp có $n$ phần tử thì có tổng cộng $2^n$ tập hợp con.
2. **Hai tập hợp bằng nhau:** $A = B \\Leftrightarrow (A \\subset B \\text{ và } B \\subset A)$.`,

  "lop10-b2-d3": `**Phương pháp giải:**
1. **Giao của hai tập hợp:** $A \\cap B = \\{x \\mid x \\in A \\text{ và } x \\in B\\}$.
2. **Hợp của hai tập hợp:** $A \\cup B = \\{x \\mid x \\in A \\text{ hoặc } x \\in B\\}$.
3. **Hiệu của hai tập hợp:** $A \\setminus B = \\{x \\mid x \\in A \\text{ và } x \\notin B\\}$.
4. **Phần bù:** Khi $B \\subset A$, phần bù của $B$ trong $A$ là $C_A B = A \\setminus B$. Khi $A = \\mathbb{R}$, kí hiệu là $C_{\\mathbb{R}} B$.`,

  "lop10-b2-d4": `**Phương pháp giải:**
1. **Các tập con của $\\mathbb{R}$:**
   - Khoảng: $(a; b) = \\{x \\in \\mathbb{R} \\mid a < x < b\\}$, $(-\\infty; b)$, $(a; +\\infty)$.
   - Đoạn: $[a; b] = \\{x \\in \\mathbb{R} \\mid a \\le x \\le b\\}$.
   - Nửa khoảng: $[a; b) = \\{x \\in \\mathbb{R} \\mid a \\le x < b\\}$, $(a; b]$, $(-\\infty; b]$, $[a; +\\infty)$.
2. **Kĩ thuật biểu diễn trên trục số:**
   - Vẽ trục số, gạch bỏ các phần không thuộc tập hợp.
   - Giao: lấy phần chung không bị gạch của cả hai tập.
   - Hợp: tô đậm cả hai tập rồi lấy toàn bộ phần tô.
   - Hiệu $A \\setminus B$: giữ phần thuộc $A$ nhưng gạch bỏ toàn bộ phần thuộc $B$.`,

  // ── Bài 3. Bất phương trình bậc nhất hai ẩn
  "lop10-b3-d1": `**Phương pháp giải:**
1. Bất phương trình bậc nhất hai ẩn có dạng tổng quát: $ax + by < c$ (hoặc $\\le, >, \\ge$) với $a^2 + b^2 \\ne 0$.
2. Cặp số $(x_0; y_0)$ là nghiệm khi thay vào ta được một bất đẳng thức đúng: $ax_0 + by_0 < c$.`,

  "lop10-b3-d2": `**Phương pháp giải:**
1. Vẽ đường thẳng $\\Delta: ax + by = c$ (qua 2 điểm đặc biệt). Nếu dấu $\\le, \\ge$ thì vẽ nét liền; nếu dấu $<, >$ thì vẽ nét đứt.
2. Chọn một điểm $M(x_0; y_0) \\notin \\Delta$ (thường chọn gốc tọa độ $O(0; 0)$ nếu $\\Delta$ không qua $O$).
3. Tính $ax_0 + by_0$ so sánh với $c$:
   - Nếu thỏa mãn BPT thì nửa mặt phẳng chứa $M$ là miền nghiệm.
   - Nếu không thỏa mãn thì nửa mặt phẳng không chứa $M$ là miền nghiệm (gạch bỏ phần không chứa $M$).`,

  "lop10-b3-d3": `**Phương pháp giải:**
1. Đặt biến $x, y$ cho hai đại lượng cần tìm, đặt điều kiện thích hợp ($x \\ge 0, y \\ge 0,...$).
2. Biểu diễn các điều kiện giới hạn về vốn, nhân công, nguyên liệu theo $x, y$ để thành lập bất phương trình bậc nhất hai ẩn.`,

  // ── Bài 4. Hệ bất phương trình bậc nhất hai ẩn
  "lop10-b4-d1": `**Phương pháp giải:**
1. Cặp số $(x_0; y_0)$ là nghiệm của hệ khi nó là nghiệm của tất cả các bất phương trình trong hệ.
2. Để kiểm tra, ta thay $(x_0; y_0)$ vào từng BPT. Chỉ cần sai ở một BPT thì kết luận không phải là nghiệm của hệ.`,

  "lop10-b4-d2": `**Phương pháp giải:**
1. Trên cùng một mặt phẳng tọa độ, xác định miền nghiệm của từng bất phương trình trong hệ bằng cách gạch bỏ các phần không phải là nghiệm.
2. Miền đa giác (hoặc miền không giới hạn) còn lại không bị gạch chính là miền nghiệm của hệ.`,

  "lop10-b4-d3": `**Phương pháp giải:**
1. Miền nghiệm của hệ là một miền đa giác $A_1 A_2 \\dots A_n$ (kể cả biên).
2. Tìm tọa độ các đỉnh của miền đa giác bằng cách giải các hệ phương trình đường thẳng giao nhau.
3. Tính giá trị $F(x; y) = ax + by$ tại tất cả các đỉnh $A_i(x_i; y_i)$.
4. So sánh các giá trị: giá trị lớn nhất là $\\max F$, giá trị nhỏ nhất là $\\min F$.`,

  "lop10-b4-d4": `**Phương pháp giải:**
1. Gọi $x, y$ là số đơn vị sản phẩm loại I, loại II cần sản xuất ($x, y \\ge 0$).
2. Lập hệ bất phương trình ràng buộc về thời gian máy móc, nguyên vật liệu và chi phí.
3. Lập hàm mục tiêu lợi nhuận $F(x; y) = ax + by$.
4. Xác định tọa độ các đỉnh của miền nghiệm đa giác và tính $F$ tại các đỉnh để tìm phương án tối ưu.`,

  // ── Bài 5. Giá trị lượng giác của một góc từ 0° đến 180°
  "lop10-b5-d1": `**Phương pháp giải:**
1. Trên nửa đường tròn đơn vị tâm $O$, góc $\\alpha$ xác định điểm $M(x_0; y_0)$:
   - $\\sin\\alpha = y_0$, $\\cos\\alpha = x_0$.
   - $\\tan\\alpha = \\frac{y_0}{x_0} = \\frac{\\sin\\alpha}{\\cos\\alpha}$ ($\\alpha \\ne 90^{\\circ}$); $\\cot\\alpha = \\frac{x_0}{y_0} = \\frac{\\cos\\alpha}{\\sin\\alpha}$ ($\\alpha \\ne 0^{\\circ}, 180^{\\circ}$).
2. Dấu của giá trị lượng giác ($0^{\\circ} \\le \\alpha \\le 180^{\\circ}$):
   - $\\sin\\alpha > 0$ với mọi $0^{\\circ} < \\alpha < 180^{\\circ}$.
   - Với $0^{\\circ} < \\alpha < 90^{\\circ}$: $\\cos\\alpha > 0, \\tan\\alpha > 0, \\cot\\alpha > 0$.
   - Với $90^{\\circ} < \\alpha < 180^{\\circ}$: $\\cos\\alpha < 0, \\tan\\alpha < 0, \\cot\\alpha < 0$.`,

  "lop10-b5-d2": `**Phương pháp giải:**
1. **Hai góc bù nhau ($\alpha$ và $180^{\\circ} - \\alpha$):**
   - $\\sin(180^{\\circ} - \\alpha) = \\sin\\alpha$.
   - $\\cos(180^{\\circ} - \\alpha) = -\\cos\\alpha$.
   - $\\tan(180^{\\circ} - \\alpha) = -\\tan\\alpha$.
   - $\\cot(180^{\\circ} - \\alpha) = -\\cot\\alpha$.
2. **Hai góc phụ nhau ($\alpha$ và $90^{\\circ} - \\alpha$):**
   - $\\sin(90^{\\circ} - \\alpha) = \\cos\\alpha$; $\\cos(90^{\\circ} - \\alpha) = \\sin\\alpha$.
   - $\\tan(90^{\\circ} - \\alpha) = \\cot\\alpha$; $\\cot(90^{\\circ} - \\alpha) = \\tan\\alpha$.`,

  "lop10-b5-d3": `**Phương pháp giải:**
1. **Các hằng đẳng thức lượng giác cơ bản:**
   - $\\sin^2\\alpha + \\cos^2\\alpha = 1$.
   - $1 + \\tan^2\\alpha = \\frac{1}{\\cos^2\\alpha}$ ($\\alpha \\ne 90^{\\circ}$).
   - $1 + \\cot^2\\alpha = \\frac{1}{\\sin^2\\alpha}$ ($\\alpha \\ne 0^{\\circ}, 180^{\\circ}$).
   - $\\tan\\alpha \\cdot \\cot\\alpha = 1$.
2. Khi biết một giá trị lượng giác, dùng công thức cơ bản và xét dấu góc để tính các giá trị còn lại.`,

  // ── Bài 6. Hệ thức lượng trong tam giác
  "lop10-b6-d1": `**Phương pháp giải:**
1. **Định lí côsin:**
   - $a^2 = b^2 + c^2 - 2bc\\cos A$.
   - $b^2 = a^2 + c^2 - 2ac\\cos B$.
   - $c^2 = a^2 + b^2 - 2ab\\cos C$.
2. **Hệ quả (tính góc khi biết 3 cạnh):**
   - $\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}$.
   - Nếu $b^2 + c^2 - a^2 > 0$ thì góc $A$ nhọn; nếu $< 0$ thì góc $A$ tù; nếu $= 0$ thì góc $A$ vuông.`,

  "lop10-b6-d2": `**Phương pháp giải:**
1. **Định lí sin:**
   $$\\frac{a}{\\sin A} = \\frac{b}{\\sin B} = \\frac{c}{\\sin C} = 2R$$
2. Dùng khi biết 1 cạnh và 2 góc (tính các cạnh còn lại) hoặc biết 2 cạnh và 1 góc đối diện (tính góc và bán kính đường tròn ngoại tiếp $R = \\frac{a}{2\\sin A}$).`,

  "lop10-b6-d3": `**Phương pháp giải:**
Các công thức tính diện tích tam giác $S$:
1. $S = \\frac{1}{2}ah_a = \\frac{1}{2}bh_b = \\frac{1}{2}ch_c$.
2. $S = \\frac{1}{2}ab\\sin C = \\frac{1}{2}bc\\sin A = \\frac{1}{2}ca\\sin B$.
3. $S = \\frac{abc}{4R} \\Rightarrow R = \\frac{abc}{4S}$.
4. $S = pr \\Rightarrow r = \\frac{S}{p}$ (với $p = \\frac{a+b+c}{2}$).
5. Công thức Heron: $S = \\sqrt{p(p-a)(p-b)(p-c)}$.`,

  "lop10-b6-d4": `**Phương pháp giải:**
1. Vẽ hình mô phỏng tình huống thực tế, xác định các điểm mốc tạo thành tam giác.
2. Điền các độ dài cạnh đã đo và số đo góc đo đạc được (góc ngắm, góc nâng, góc hạ).
3. Sử dụng định lí sin hoặc côsin trong tam giác thích hợp để tính khoảng cách hoặc chiều cao cần tìm.`,

  // ── Bài 7. Các khái niệm mở đầu
  "lop10-b7-d1": `**Phương pháp giải:**
1. Vectơ là một đoạn thẳng có hướng (có điểm đầu và điểm cuối), kí hiệu $\\vec{a}$ hoặc $\\vec{AB}$.
2. Giá của vectơ là đường thẳng đi qua điểm đầu và điểm cuối của vectơ.
3. Hai vectơ cùng phương nếu giá của chúng song song hoặc trùng nhau.
4. Hai vectơ cùng phương thì có thể cùng hướng hoặc ngược hướng. Vectơ-không $\\vec{0}$ cùng phương, cùng hướng với mọi vectơ.`,

  "lop10-b7-d2": `**Phương pháp giải:**
1. Độ dài vectơ $\\vec{AB}$ là khoảng cách giữa $A$ và $B$, kí hiệu $|\\vec{AB}| = AB$. $|\\vec{0}| = 0$.
2. Hai vectơ bằng nhau khi và chỉ khi chúng cùng hướng và cùng độ dài:
   $$\\vec{a} = \\vec{b} \\Leftrightarrow \\begin{cases} \\vec{a} \\text{ cùng hướng } \\vec{b} \\\\ |\\vec{a}| = |\\vec{b}| \\end{cases}$$
3. $\\vec{AB} = \\vec{DC} \\Leftrightarrow ABCD$ là hình bình hành (hoặc 4 điểm thẳng hàng theo đúng thứ tự và khoảng cách).`,

  // ── Bài 8. Tổng và hiệu của hai vectơ
  "lop10-b8-d1": `**Phương pháp giải:**
1. **Quy tắc ba điểm (nối đuôi):** Với 3 điểm $A, B, C$ bất kì: $\\vec{AB} + \\vec{BC} = \\vec{AC}$.
2. **Quy tắc hình bình hành:** Nếu $ABCD$ là hình bình hành thì: $\\vec{AB} + \\vec{AD} = \\vec{AC}$.
3. **Quy tắc trừ (hiệu chung gốc):** $\\vec{AB} - \\vec{AC} = \\vec{CB}$.`,

  "lop10-b8-d2": `**Phương pháp giải:**
1. **Điểm $M$ là trung điểm $AB$:** $\\vec{MA} + \\vec{MB} = \\vec{0}$, và với điểm $O$ bất kì: $\\vec{OA} + \\vec{OB} = 2\\vec{OM}$.
2. **Điểm $G$ là trọng tâm $\\triangle ABC$:** $\\vec{GA} + \\vec{GB} + \\vec{GC} = \\vec{0}$, và với điểm $O$ bất kì: $\\vec{OA} + \\vec{OB} + \\vec{OC} = 3\\vec{OG}$.
3. **Kĩ thuật biến đổi đẳng thức vectơ:** Chèn điểm thích hợp theo quy tắc cộng hoặc trừ, đưa về một vế rồi chứng minh bằng $\\vec{0}$.`,

  "lop10-b8-d3": `**Phương pháp giải:**
1. Để tính độ dài $|\\vec{u} + \\vec{v}|$ hoặc $|\\vec{u} - \\vec{v}|$, ta dựng vectơ tổng hoặc hiệu thành một vectơ đơn duy nhất $\\vec{w} = \\vec{AB}$, sau đó tính độ dài đoạn thẳng $AB$.
2. Sử dụng định lí Pitago, hệ thức lượng tam giác hoặc công thức:
   $$|\\vec{a} + \\vec{b}|^2 = |\\vec{a}|^2 + |\\vec{b}|^2 + 2|\\vec{a}||\\vec{b}|\\cos(\\vec{a}, \\vec{b})$$`,

  // ── Bài 9. Tích của một vectơ với một số
  "lop10-b9-d1": `**Phương pháp giải:**
1. Tích $k\\vec{a}$ là một vectơ có:
   - Độ dài: $|k\\vec{a}| = |k| \\cdot |\\vec{a}|$.
   - Hướng: cùng hướng với $\\vec{a}$ nếu $k > 0$; ngược hướng với $\\vec{a}$ nếu $k < 0$.
2. Tính chất: $k(\\vec{a} + \\vec{b}) = k\\vec{a} + k\\vec{b}$, $(k + m)\\vec{a} = k\\vec{a} + m\\vec{a}$, $k(m\\vec{a}) = (km)\\vec{a}$.`,

  "lop10-b9-d2": `**Phương pháp giải:**
1. Cho hai vectơ $\\vec{a}, \\vec{b}$ không cùng phương. Mọi vectơ $\\vec{x}$ đều phân tích duy nhất dưới dạng:
   $$\\vec{x} = m\\vec{a} + n\\vec{b}$$
2. Phương pháp phân tích: Chèn điểm trung gian và sử dụng các hệ thức trung điểm, trọng tâm, tỉ số đoạn thẳng để đưa các vectơ về hai vectơ cơ sở.`,

  "lop10-b9-d3": `**Phương pháp giải:**
1. **Ba điểm $A, B, C$ thẳng hàng:** $\\Leftrightarrow \\vec{AB}$ cùng phương $\\vec{AC} \\Leftrightarrow \\exists k \\ne 0: \\vec{AB} = k\\vec{AC}$.
2. Phân tích $\\vec{AB}$ và $\\vec{AC}$ theo cùng hai vectơ không cùng phương, rồi lập tỉ số các hệ số tương ứng để tìm $k$ hoặc tìm tham số.`,

  // ── Bài 10. Vectơ trong mặt phẳng tọa độ
  "lop10-b10-d1": `**Phương pháp giải:**
1. $\\vec{u} = x\\vec{i} + y\\vec{j} \\Leftrightarrow \\vec{u} = (x; y)$.
2. Cho $A(x_A; y_A)$ và $B(x_B; y_B)$:
   - Vectơ $\\vec{AB} = (x_B - x_A; y_B - y_A)$.
   - Độ dài đoạn thẳng: $AB = |\\vec{AB}| = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2}$.
   - Tọa độ trung điểm $M$ của $AB$: $x_M = \\frac{x_A + x_B}{2}$, $y_M = \\frac{y_A + y_B}{2}$.
   - Tọa độ trọng tâm $G$ của $\\triangle ABC$: $x_G = \\frac{x_A + x_B + x_C}{3}$, $y_G = \\frac{y_A + y_B + y_C}{3}$.`,

  "lop10-b10-d2": `**Phương pháp giải:**
Cho $\\vec{u} = (x_1; y_1)$ và $\\vec{v} = (x_2; y_2)$:
1. $\\vec{u} + \\vec{v} = (x_1 + x_2; y_1 + y_2)$.
2. $\\vec{u} - \\vec{v} = (x_1 - x_2; y_1 - y_2)$.
3. $k\\vec{u} = (kx_1; ky_1)$.
4. $\\vec{u}$ cùng phương $\\vec{v}$ (với $\\vec{v} \\ne \\vec{0}$) $\\Leftrightarrow \\exists k: x_1 = kx_2, y_1 = ky_2$ (hoặc $\\frac{x_1}{x_2} = \\frac{y_1}{y_2}$ nếu $x_2, y_2 \\ne 0$).`,

  "lop10-b10-d3": `**Phương pháp giải:**
1. Để tứ giác $ABCD$ là hình bình hành: $\\vec{AB} = \\vec{DC} \\Leftrightarrow \\begin{cases} x_B - x_A = x_C - x_D \\\\ y_B - y_A = y_C - y_D \\end{cases}$.
2. Để tìm điểm $M$ thỏa mãn đẳng thức vectơ, chuyển đẳng thức về tọa độ để giải hệ phương trình bậc nhất tìm $x_M, y_M$.`,

  // ── Bài 11. Tích vô hướng của hai vectơ
  "lop10-b11-d1": `**Phương pháp giải:**
1. Góc giữa hai vectơ khác $\\vec{0}$ là góc $\\widehat{AOB} = \\alpha$ với $\\vec{OA} = \\vec{u}, \\vec{OB} = \\vec{v}$ ($0^{\\circ} \\le \\alpha \\le 180^{\\circ}$).
2. Nếu $\\vec{u}, \\vec{v}$ cùng hướng thì $(\\vec{u}, \\vec{v}) = 0^{\\circ}$.
3. Nếu $\\vec{u}, \\vec{v}$ ngược hướng thì $(\\vec{u}, \\vec{v}) = 180^{\\circ}$.`,

  "lop10-b11-d2": `**Phương pháp giải:**
1. **Theo định nghĩa hình học:** $\\vec{u} \\cdot \\vec{v} = |\\vec{u}| \\cdot |\\vec{v}| \\cdot \\cos(\\vec{u}, \\vec{v})$.
   - Bình phương vô hướng: $\\vec{u}^2 = |\\vec{u}|^2$.
2. **Theo biểu thức tọa độ:** Cho $\\vec{u} = (x_1; y_1), \\vec{v} = (x_2; y_2)$:
   $$\\vec{u} \\cdot \\vec{v} = x_1 x_2 + y_1 y_2$$`,

  "lop10-b11-d3": `**Phương pháp giải:**
1. **Điều kiện vuông góc:** $\\vec{u} \\perp \\vec{v} \\Leftrightarrow \\vec{u} \\cdot \\vec{v} = 0 \\Leftrightarrow x_1 x_2 + y_1 y_2 = 0$.
2. **Công thức tính côsin góc giữa hai vectơ theo tọa độ:**
   $$\\cos(\\vec{u}, \\vec{v}) = \\frac{\\vec{u} \\cdot \\vec{v}}{|\\vec{u}| \\cdot |\\vec{v}|} = \\frac{x_1 x_2 + y_1 y_2}{\\sqrt{x_1^2 + y_1^2} \\cdot \\sqrt{x_2^2 + y_2^2}}$$`,

  // ── Bài 12. Số gần đúng và sai số
  "lop10-b12-d1": `**Phương pháp giải:**
1. Sai số tuyệt đối của số gần đúng $a$ biểu diễn số đúng $\\overline{a}$ là $\\Delta_a = |\\overline{a} - a|$.
2. Nếu $\\Delta_a \\le d$ thì $d$ gọi là **độ chính xác** của số gần đúng, kí hiệu $\\overline{a} = a \\pm d$, nghĩa là $a - d \\le \\overline{a} \\le a + d$.`,

  "lop10-b12-d2": `**Phương pháp giải:**
1. Sai số tương đối của số gần đúng $a$ là $\\delta_a = \\frac{\\Delta_a}{|a|} \\le \\frac{d}{|a|}$.
2. Sai số tương đối càng nhỏ thì phép đo hoặc ước lượng càng chính xác. Khi so sánh độ chính xác của hai phép đo có đơn vị hoặc thang đo khác nhau, ta so sánh sai số tương đối $\\delta$.`,

  "lop10-b12-d3": `**Phương pháp giải:**
1. **Quy tắc làm tròn:**
   - Nếu chữ số ngay sau hàng quy tròn nhỏ hơn 5 thì giữ nguyên chữ số hàng quy tròn, thay các chữ số sau bằng 0 (hoặc bỏ đi ở phần thập phân).
   - Nếu chữ số ngay sau hàng quy tròn $\\ge 5$ thì cộng thêm 1 vào chữ số hàng quy tròn.
2. **Quy tròn theo độ chính xác $d$:**
   - Tìm hàng của chữ số khác 0 đầu tiên bên trái của $d$.
   - Quy tròn số gần đúng $a$ đến hàng cao hơn hàng đó một bậc.`,

  // ── Bài 13. Các số đặc trưng đo xu thế trung tâm
  "lop10-b13-d1": `**Phương pháp giải:**
1. Số trung bình của mẫu số liệu $x_1, x_2, \\dots, x_n$:
   $$\\overline{x} = \\frac{x_1 + x_2 + \\dots + x_n}{n} = \\frac{\\sum m_i x_i}{n}$$
2. Ý nghĩa: Đại diện cho mức độ trung bình của toàn bộ mẫu số liệu khi dữ liệu không có giá trị quá chênh lệch (giá trị ngoại lệ).`,

  "lop10-b13-d2": `**Phương pháp giải:**
Sắp xếp mẫu số liệu theo thứ tự không giảm: $x_1 \\le x_2 \\le \\dots \\le x_n$.
1. **Trung vị ($M_e = Q_2$):**
   - Nếu $n$ lẻ: $M_e = x_{\\frac{n+1}{2}}$.
   - Nếu $n$ chẵn: $M_e = \\frac{x_{n/2} + x_{n/2+1}}{2}$.
2. **Tứ phân vị:**
   - $Q_1$ (tứ phân vị dưới): là trung vị của nửa số liệu phía dưới $M_e$.
   - $Q_3$ (tứ phân vị trên): là trung vị của nửa số liệu phía trên $M_e$.
   *(Lưu ý: Nếu $n$ lẻ thì không tính $M_e$ vào cả hai nửa khi tìm $Q_1$ và $Q_3$ theo SGK KNTT).*`,

  "lop10-b13-d3": `**Phương pháp giải:**
1. Mốt ($M_o$) là giá trị có tần số xuất hiện lớn nhất trong mẫu số liệu. Một mẫu có thể có 1 mốt, nhiều mốt hoặc không có mốt.
2. **Chọn số đặc trưng:**
   - Dùng số trung bình khi mẫu số liệu đồng đều, ít biến động mạnh.
   - Dùng trung vị khi mẫu số liệu có giá trị ngoại lệ (quá lớn hoặc quá nhỏ).
   - Dùng mốt khi quan tâm đến giá trị xuất hiện nhiều nhất (như kích cỡ giày, thị hiếu tiêu dùng).`,

  // ── Bài 14. Các số đặc trưng đo độ phân tán
  "lop10-b14-d1": `**Phương pháp giải:**
1. **Khoảng biến thiên:** $R = x_{\\max} - x_{\\min}$.
2. **Khoảng tứ phân vị:** $\\Delta_Q = Q_3 - Q_1$.
   - Ý nghĩa: Khoảng tứ phân vị đo độ phân tán của 50% số liệu chính giữa, không bị ảnh hưởng bởi các giá trị ngoại lệ.`,

  "lop10-b14-d2": `**Phương pháp giải:**
1. **Phương sai ($s^2$):**
   $$s^2 = \\frac{1}{n} \\sum_{i=1}^n (x_i - \\overline{x})^2 = \\frac{1}{n}\\sum x_i^2 - (\\overline{x})^2$$
2. **Độ lệch chuẩn ($s$):** $s = \\sqrt{s^2}$.
   - Ý nghĩa: Phương sai và độ lệch chuẩn càng lớn thì dữ liệu càng phân tán xa số trung bình; càng nhỏ thì dữ liệu càng đồng đều.`,

  "lop10-b14-d3": `**Phương pháp giải:**
Giá trị $x$ trong mẫu số liệu được coi là **giá trị ngoại lệ** nếu:
$$x < Q_1 - 1{,}5 \\cdot \\Delta_Q \\quad \\text{hoặc} \\quad x > Q_3 + 1{,}5 \\cdot \\Delta_Q$$
Các bước: Tìm $Q_1, Q_3$ -> Tính $\\Delta_Q = Q_3 - Q_1$ -> Tính hai ngưỡng -> So sánh các giá trị trong mẫu để chỉ ra giá trị ngoại lệ.`,

  // ── Bài 15. Hàm số
  "lop10-b15-d1": `**Phương pháp giải:**
Tìm điều kiện để biểu thức $f(x)$ có nghĩa:
1. $\\frac{P(x)}{Q(x)}$ xác định $\\Leftrightarrow Q(x) \\ne 0$.
2. $\\sqrt{P(x)}$ xác định $\\Leftrightarrow P(x) \\ge 0$.
3. $\\frac{P(x)}{\\sqrt{Q(x)}}$ xác định $\\Leftrightarrow Q(x) > 0$.
Tập xác định $D$ là tập hợp tất cả các giá trị của $x$ thỏa mãn đồng thời các điều kiện trên.`,

  "lop10-b15-d2": `**Phương pháp giải:**
1. Tính giá trị $f(x_0)$: Thay $x = x_0$ vào công thức hàm số. Với hàm số cho bởi nhiều công thức, kiểm tra $x_0$ thuộc khoảng nào để chọn đúng công thức.
2. Điểm $M(x_0; y_0) \\in (C) \\Leftrightarrow y_0 = f(x_0)$.`,

  "lop10-b15-d3": `**Phương pháp giải:**
Cho hàm số $y = f(x)$ xác định trên khoảng $K$:
1. $f(x)$ đồng biến (tăng) trên $K$ nếu $\\forall x_1 < x_2 \\Rightarrow f(x_1) < f(x_2)$. (Đồ thị đi lên từ trái sang phải).
2. $f(x)$ nghịch biến (giảm) trên $K$ nếu $\\forall x_1 < x_2 \\Rightarrow f(x_1) > f(x_2)$. (Đồ thị đi xuống từ trái sang phải).`,

  // ── Bài 16. Hàm số bậc hai
  "lop10-b16-d1": `**Phương pháp giải:**
Hàm số bậc hai có dạng $y = ax^2 + bx + c$ ($a \\ne 0$).
Để xác định các hệ số $a, b, c$:
1. Lập hệ phương trình từ các dữ kiện đề bài:
   - Đi qua điểm $A(x_0; y_0) \\Rightarrow ax_0^2 + bx_0 + c = y_0$.
   - Trục đối xứng $x = x_0 \\Rightarrow -\\frac{b}{2a} = x_0$.
   - Tọa độ đỉnh $I(x_I; y_I) \\Rightarrow -\\frac{b}{2a} = x_I$ và $ax_I^2 + bx_I + c = y_I$.
2. Giải hệ phương trình bậc nhất tìm $a, b, c$.`,

  "lop10-b16-d2": `**Phương pháp giải:**
1. Parabol $(P): y = ax^2 + bx + c$ có:
   - Đỉnh $I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$.
   - Trục đối xứng: đường thẳng $x = -\\frac{b}{2a}$.
   - Bề lõm quay lên trên nếu $a > 0$; bề lõm quay xuống dưới nếu $a < 0$.
   - Giao với trục tung tại $(0; c)$.`,

  "lop10-b16-d3": `**Phương pháp giải:**
1. **Trường hợp $a > 0$:** Hàm số nghịch biến trên $\\left(-\\infty; -\\frac{b}{2a}\\right)$, đồng biến trên $\\left(-\\frac{b}{2a}; +\\infty\\right)$.
   - Đạt giá trị nhỏ nhất: $\\min y = -\\frac{\\Delta}{4a}$ tại $x = -\\frac{b}{2a}$.
2. **Trường hợp $a < 0$:** Hàm số đồng biến trên $\\left(-\\infty; -\\frac{b}{2a}\\right)$, nghịch biến trên $\\left(-\\frac{b}{2a}; +\\infty\\right)$.
   - Đạt giá trị lớn nhất: $\\max y = -\\frac{\\Delta}{4a}$ tại $x = -\\frac{b}{2a}$.
3. Khi tìm GTLN - GTNN trên đoạn $[\alpha; \\beta]$: Tính giá trị tại $\\alpha, \\beta$ và tại đỉnh nếu đỉnh thuộc đoạn.`,

  "lop10-b16-d4": `**Phương pháp giải:**
1. Thiết lập hệ trục tọa độ $Oxy$ phù hợp với bài toán thực tế (cổng parabol, cầu vòm, quỹ đạo bóng).
2. Viết phương trình parabol $y = ax^2 + bx + c$ dựa vào các điểm đặc biệt đã cho.
3. Giải phương trình hoặc tìm tọa độ đỉnh để tính chiều cao tối đa, tầm bay xa hoặc lợi nhuận tối ưu.`,

  // ── Bài 17. Dấu của tam thức bậc hai
  "lop10-b17-d1": `**Phương pháp giải:**
Tam thức bậc hai $f(x) = ax^2 + bx + c$ ($a \\ne 0$), $\\Delta = b^2 - 4ac$:
1. Nếu $\\Delta < 0$: $f(x)$ cùng dấu với hệ số $a$ với mọi $x \\in \\mathbb{R}$.
2. Nếu $\\Delta = 0$: $f(x)$ cùng dấu với hệ số $a$ với mọi $x \\ne -\\frac{b}{2a}$; $f\\left(-\\frac{b}{2a}\\right) = 0$.
3. Nếu $\\Delta > 0$: $f(x)$ có 2 nghiệm phân biệt $x_1 < x_2$.
   - Trong khoảng hai nghiệm $(x_1; x_2)$: $f(x)$ **trái dấu** với $a$.
   - Ngoài khoảng hai nghiệm $(-\\infty; x_1) \\cup (x_2; +\\infty)$: $f(x)$ **cùng dấu** với $a$ ("Trong trái - Ngoài cùng").`,

  "lop10-b17-d2": `**Phương pháp giải:**
Để giải bất phương trình bậc hai $ax^2 + bx + c > 0$ (hoặc $\\ge 0, < 0, \\le 0$):
1. Tính $\\Delta$, tìm nghiệm của tam thức (nếu có).
2. Áp dụng quy tắc xét dấu tam thức bậc hai (trong trái, ngoài cùng).
3. Kết luận tập nghiệm $S$ theo đúng chiều của dấu bất phương trình.`,

  "lop10-b17-d3": `**Phương pháp giải:**
Điều kiện để tam thức bậc hai $f(x) = ax^2 + bx + c$ giữ dấu trên $\\mathbb{R}$:
1. $f(x) > 0, \\forall x \\in \\mathbb{R} \\Leftrightarrow \\begin{cases} a > 0 \\\\ \\Delta < 0 \\end{cases}$
2. $f(x) \\ge 0, \\forall x \\in \\mathbb{R} \\Leftrightarrow \\begin{cases} a > 0 \\\\ \\Delta \\le 0 \\end{cases}$
3. $f(x) < 0, \\forall x \\in \\mathbb{R} \\Leftrightarrow \\begin{cases} a < 0 \\\\ \\Delta < 0 \\end{cases}$
4. $f(x) \\le 0, \\forall x \\in \\mathbb{R} \\Leftrightarrow \\begin{cases} a < 0 \\\\ \\Delta \\le 0 \\end{cases}$
*(Nếu hệ số $a$ chứa tham số, cần xét thêm trường hợp $a = 0$).*`,

  // ── Bài 18. Phương trình quy về bậc hai
  "lop10-b18-d1": `**Phương pháp giải:**
Giải phương trình dạng $\\sqrt{f(x)} = \\sqrt{g(x)}$:
- **Bước 1:** Bình phương hai vế để được phương trình hệ quả: $f(x) = g(x)$.
- **Bước 2:** Giải phương trình bậc hai $f(x) = g(x)$ tìm nghiệm.
- **Bước 3:** Thử lại các nghiệm vừa tìm được vào phương trình ban đầu (hoặc kiểm tra điều kiện $f(x) \\ge 0$) và kết luận tập nghiệm.`,

  "lop10-b18-d2": `**Phương pháp giải:**
Giải phương trình dạng $\\sqrt{f(x)} = g(x)$:
- **Cách 1 (Biến đổi tương đương):**
  $$\\sqrt{f(x)} = g(x) \\Leftrightarrow \\begin{cases} g(x) \\ge 0 \\\\ f(x) = [g(x)]^2 \\end{cases}$$
- **Cách 2 (Bình phương rồi thử lại):**
  1. Bình phương hai vế: $f(x) = [g(x)]^2$.
  2. Giải phương trình bậc hai tìm nghiệm $x$.
  3. Thử lại các giá trị $x$ vào phương trình ban đầu, loại nghiệm ngoại lai.`,

  // ── Bài 19. Phương trình đường thẳng
  "lop10-b19-d1": `**Phương pháp giải:**
1. Vectơ chỉ phương (VTCP) $\\vec{u}$: có giá song song hoặc trùng với đường thẳng.
2. Vectơ pháp tuyến (VTPT) $\\vec{n}$: có giá vuông góc với đường thẳng.
3. Mối liên hệ: $\\vec{n} \\perp \\vec{u} \\Leftrightarrow \\vec{n} \\cdot \\vec{u} = 0$.
   - Nếu $\\vec{n} = (a; b)$ thì $\\vec{u} = (-b; a)$ hoặc $(b; -a)$.
   - Hệ số góc $k = \\frac{u_2}{u_1} = -\\frac{a}{b}$ (với $b \\ne 0, u_1 \\ne 0$).`,

  "lop10-b19-d2": `**Phương pháp giải:**
1. Đường thẳng đi qua $M(x_0; y_0)$ và nhận $\\vec{n} = (a; b)$ làm VTPT có phương trình tổng quát:
   $$a(x - x_0) + b(y - y_0) = 0 \\Leftrightarrow ax + by + c = 0 \\quad (c = -ax_0 - by_0)$$
2. Các dạng đặc biệt:
   - Phương trình theo đoạn chắn: $\\frac{x}{a} + \\frac{y}{b} = 1$ (qua $A(a; 0), B(0; b)$).
   - Đường trung trực của đoạn $AB$: qua trung điểm $M$ và nhận $\\vec{AB}$ làm VTPT.`,

  "lop10-b19-d3": `**Phương pháp giải:**
1. Đường thẳng qua $M(x_0; y_0)$ có VTCP $\\vec{u} = (u_1; u_2)$ có phương trình tham số:
   $$\\begin{cases} x = x_0 + u_1 t \\\\ y = y_0 + u_2 t \\end{cases} \\quad (t \\in \\mathbb{R})$$
2. Chuyển đổi giữa PT tham số và tổng quát: Khử tham số $t$ từ hệ hoặc đọc VTCP $\\vec{u}$ rồi chuyển sang VTPT $\\vec{n} = (-u_2; u_1)$.`,

  // ── Bài 20. Vị trí tương đối, Góc & Khoảng cách
  "lop10-b20-d1": `**Phương pháp giải:**
Cho $\\Delta_1: a_1 x + b_1 y + c_1 = 0$ và $\\Delta_2: a_2 x + b_2 y + c_2 = 0$.
Xét hệ phương trình tạo bởi hai đường thẳng:
1. Hệ có 1 nghiệm duy nhất $(x_0; y_0) \\Leftrightarrow \\Delta_1$ cắt $\\Delta_2$ tại $M(x_0; y_0)$.
2. Hệ vô nghiệm $\\Leftrightarrow \\Delta_1 \\parallel \\Delta_2$.
3. Hệ có vô số nghiệm $\\Leftrightarrow \\Delta_1 \\equiv \\Delta_2$.
4. Đặc biệt: $\\Delta_1 \\perp \\Delta_2 \\Leftrightarrow a_1 a_2 + b_1 b_2 = 0$.`,

  "lop10-b20-d2": `**Phương pháp giải:**
Góc $\\varphi$ giữa hai đường thẳng $\\Delta_1$ và $\\Delta_2$ ($0^{\\circ} \\le \\varphi \\le 90^{\\circ}$):
$$\\cos\\varphi = \\frac{|\\vec{n}_1 \\cdot \\vec{n}_2|}{|\\vec{n}_1| \\cdot |\\vec{n}_2|} = \\frac{|a_1 a_2 + b_1 b_2|}{\\sqrt{a_1^2 + b_1^2} \\cdot \\sqrt{a_2^2 + b_2^2}}$$`,

  "lop10-b20-d3": `**Phương pháp giải:**
1. **Khoảng cách từ điểm $M(x_0; y_0)$ đến $\\Delta: ax + by + c = 0$:**
   $$d(M, \\Delta) = \\frac{|a x_0 + b y_0 + c|}{\\sqrt{a^2 + b^2}}$$
2. Ứng dụng: Tính chiều cao tam giác, khoảng cách giữa 2 đường thẳng song song $d(\\Delta_1, \\Delta_2) = d(M \\in \\Delta_1, \\Delta_2)$, tìm tập hợp điểm.`,

  // ── Bài 21. Đường tròn trong mặt phẳng tọa độ
  "lop10-b21-d1": `**Phương pháp giải:**
1. **Dạng chính tắc:** $(x - a)^2 + (y - b)^2 = R^2$ có tâm $I(a; b)$, bán kính $R$.
2. **Dạng tổng quát:** $x^2 + y^2 - 2ax - 2by + c = 0$.
   - Điều kiện là phương trình đường tròn: $a^2 + b^2 - c > 0$.
   - Khi đó tâm $I(a; b)$ và bán kính $R = \\sqrt{a^2 + b^2 - c}$.`,

  "lop10-b21-d2": `**Phương pháp giải:**
1. Biết tâm $I(a; b)$ và bán kính $R$: viết ngay $(x - a)^2 + (y - b)^2 = R^2$.
2. Đường tròn đường kính $AB$: tâm $I$ là trung điểm $AB$, bán kính $R = \\frac{AB}{2}$.
3. Đường tròn đi qua 3 điểm $A, B, C$: Thay tọa độ từng điểm vào PT tổng quát $x^2 + y^2 - 2ax - 2by + c = 0$, giải hệ 3 phương trình tìm $a, b, c$.
4. Tâm $I$ thuộc đường thẳng và tiếp xúc với đường thẳng: dùng $d(I, \\Delta) = R$.`,

  "lop10-b21-d3": `**Phương pháp giải:**
Phương trình tiếp tuyến của đường tròn tâm $I(a; b)$, bán kính $R$:
1. Tiếp tuyến tại điểm $M_0(x_0; y_0) \\in (C)$: Nhận $\\vec{IM_0} = (x_0 - a; y_0 - b)$ làm VTPT:
   $$(x_0 - a)(x - x_0) + (y_0 - b)(y - y_0) = 0$$
2. Tiếp tuyến đi qua điểm $A(x_A; y_A) \\notin (C)$: Gọi PT tiếp tuyến có dạng qua $A$, áp dụng điều kiện $d(I, \\Delta) = R$ để tìm hệ số góc hoặc VTPT.`,

  // ── Bài 22. Ba đường conic
  "lop10-b22-d1": `**Phương pháp giải (Elip):**
1. Phương trình chính tắc: $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ ($a > b > 0$).
2. Các yếu tố hình học:
   - Hệ thức liên hệ: $c^2 = a^2 - b^2$.
   - Hai tiêu điểm: $F_1(-c; 0), F_2(c; 0)$, tiêu cự $2c$.
   - Độ dài trục lớn: $2a$, độ dài trục nhỏ: $2b$.
   - Bốn đỉnh: $A_1(-a; 0), A_2(a; 0), B_1(0; -b), B_2(0; b)$.`,

  "lop10-b22-d2": `**Phương pháp giải (Hypebol):**
1. Phương trình chính tắc: $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ ($a, b > 0$).
2. Các yếu tố hình học:
   - Hệ thức liên hệ: $c^2 = a^2 + b^2$.
   - Hai tiêu điểm: $F_1(-c; 0), F_2(c; 0)$, tiêu cự $2c$.
   - Trục thực: $2a$, trục ảo: $2b$. Hai đỉnh: $A_1(-a; 0), A_2(a; 0)$.`,

  "lop10-b22-d3": `**Phương pháp giải (Parabol):**
1. Phương trình chính tắc: $y^2 = 2px$ ($p > 0$ gọi là tham số tiêu).
2. Các yếu tố hình học:
   - Tiêu điểm: $F\\left(\\frac{p}{2}; 0\\right)$.
   - Đường chuẩn: $\\Delta: x = -\\frac{p}{2}$.
   - Đỉnh là gốc tọa độ $O(0; 0)$, trục đối xứng là trục $Ox$.`,

  // ── Bài 23. Quy tắc đếm
  "lop10-b23-d1": `**Phương pháp giải:**
1. Một công việc có thể hoàn thành bởi một trong hai phương án $A$ hoặc $B$ (không giao nhau). Nếu phương án $A$ có $m$ cách thực hiện, phương án $B$ có $n$ cách thực hiện thì có:
   $$m + n \\text{ cách hoàn thành công việc}$$
2. Mở rộng cho $k$ phương án rời nhau: Tổng số cách là $n_1 + n_2 + \\dots + n_k$.`,

  "lop10-b23-d2": `**Phương pháp giải:**
1. Một công việc phải trải qua hai giai đoạn liên tiếp. Nếu giai đoạn 1 có $m$ cách thực hiện, và với mỗi cách đó có $n$ cách thực hiện giai đoạn 2 thì có:
   $$m \\cdot n \\text{ cách hoàn thành công việc}$$
2. Dấu hiệu phân biệt: Nếu bỏ bớt 1 công đoạn mà công việc chưa hoàn thành thì dùng **quy tắc nhân**; nếu thực hiện xong 1 phương án mà công việc đã hoàn tất thì dùng **quy tắc cộng**.`,

  "lop10-b23-d3": `**Phương pháp giải:**
1. Gọi số cần tìm có dạng $\\overline{a_1 a_2 \\dots a_k}$.
2. Phân tích các điều kiện ràng buộc: chữ số $a_1 \\ne 0$, số chẵn/lẻ (xét chữ số tận cùng $a_k$), chia hết cho 5, chữ số khác nhau từng đôi một.
3. Ưu tiên chọn các vị trí có điều kiện ràng buộc ngặt nghèo trước, sau đó dùng quy tắc nhân tính tổng số cách.`,

  // ── Bài 24. Hoán vị, chỉnh hợp và tổ hợp
  "lop10-b24-d1": `**Phương pháp giải:**
1. Cho tập hợp gồm $n$ phần tử ($n \\ge 1$). Mỗi cách sắp xếp có thứ tự $n$ phần tử gọi là một hoán vị của $n$ phần tử.
2. Số các hoán vị: $P_n = n! = n(n-1)(n-2) \\dots 2 \\cdot 1$. Quy ước $0! = 1$.`,

  "lop10-b24-d2": `**Phương pháp giải:**
1. Cho tập có $n$ phần tử và số nguyên $k$ ($1 \\le k \\le n$). Mỗi cách chọn $k$ phần tử rồi **sắp xếp có thứ tự** gọi là một chỉnh hợp chập $k$ của $n$.
2. Số các chỉnh hợp: $A_n^k = \\frac{n!}{(n-k)!} = n(n-1) \\dots (n-k+1)$.`,

  "lop10-b24-d3": `**Phương pháp giải:**
1. Cho tập có $n$ phần tử và số nguyên $k$ ($0 \\le k \\le n$). Mỗi cách chọn ra $k$ phần tử **không quan tâm đến thứ tự** gọi là một tổ hợp chập $k$ của $n$.
2. Số các tổ hợp: $C_n^k = \\frac{n!}{k!(n-k)!}$.
3. Tính chất đối xứng: $C_n^k = C_n^{n-k}$ và $C_n^{k-1} + C_n^k = C_{n+1}^k$.`,

  "lop10-b24-d4": `**Phương pháp giải:**
1. Phân loại bài toán:
   - Có sắp thứ tự, phân công chức vụ (lớp trưởng, bí thư): Dùng **Chỉnh hợp $A_n^k$**.
   - Chỉ chọn một nhóm người/vật không phân biệt vai trò: Dùng **Tổ hợp $C_n^k$**.
2. Phối hợp chia trường hợp (quy tắc cộng) và các bước lựa chọn thành phần (quy tắc nhân). Sử dụng phần bù khi bài toán yêu cầu "có ít nhất một".`,

  // ── Bài 25. Nhị thức Newton
  "lop10-b25-d1": `**Phương pháp giải:**
1. Khai triển bậc 4:
   $$(a + b)^4 = a^4 + 4a^3 b + 6a^2 b^2 + 4ab^3 + b^4$$
2. Khai triển bậc 5:
   $$(a + b)^5 = a^5 + 5a^4 b + 10a^3 b^2 + 10a^2 b^3 + 5ab^4 + b^5$$
3. Các hệ số nhị thức chính là các tổ hợp $C_n^k$ và có tính đối xứng.`,

  "lop10-b25-d2": `**Phương pháp giải:**
1. Thay đúng $a$ và $b$ (chú ý dấu âm: $a - b = a + (-b)$).
2. Rút gọn từng số hạng: gom các lũy thừa của $x$ lại với nhau.
3. Để tìm hệ số của $x^k$ hoặc số hạng không chứa $x$ (ứng với $x^0$), cho số mũ của $x$ bằng $k$ rồi giải tìm số hạng tương ứng.`,

  // ── Bài 26. Biến cố và định nghĩa cổ điển của xác suất
  "lop10-b26-d1": `**Phương pháp giải:**
1. Không gian mẫu $\\Omega$ là tập hợp tất cả các kết quả có thể xảy ra của phép thử.
2. Biến cố $A$ là tập con của không gian mẫu: $A \\subset \\Omega$.
3. Biến cố đối của $A$ là $\\overline{A} = \\Omega \\setminus A$ ("biến cố $A$ không xảy ra").`,

  "lop10-b26-d2": `**Phương pháp giải:**
Định nghĩa cổ điển của xác suất (khi các kết quả đồng khả năng):
$$P(A) = \\frac{n(A)}{n(\\Omega)} = \\frac{\\text{Số kết quả thuận lợi cho } A}{\\text{Tổng số kết quả có thể}}$$
- $0 \\le P(A) \\le 1$; $P(\\varnothing) = 0$; $P(\\Omega) = 1$.`,

  "lop10-b26-d3": `**Phương pháp giải:**
1. Sử dụng công thức: $P(\\overline{A}) = 1 - P(A) \\Leftrightarrow P(A) = 1 - P(\\overline{A})$.
2. Dấu hiệu nhận biết: Khi biến cố $A$ có cụm từ "có ít nhất một...", ta nên xét biến cố đối $\\overline{A}$ là "không có cái nào..." để việc tính toán nhanh và đơn giản hơn.`,

  // ── Bài 27. Thực hành tính xác suất
  "lop10-b27-d1": `**Phương pháp giải:**
1. Với phép thử gồm các giai đoạn liên tiếp (tung đồng xu nhiều lần, bắn nhiều phát), ta vẽ sơ đồ hình cây để liệt kê toàn bộ các kết quả của không gian mẫu.
2. Đếm số nhánh tạo nên không gian mẫu $n(\\Omega)$ và số nhánh thỏa mãn điều kiện biến cố $n(A)$, từ đó tính $P(A) = \\frac{n(A)}{n(\\Omega)}$.`,

  "lop10-b27-d2": `**Phương pháp giải:**
1. Tính số phần tử không gian mẫu $n(\\Omega)$ bằng tổ hợp: chọn ngẫu nhiên $k$ phần tử từ $n$ phần tử $\\Rightarrow n(\\Omega) = C_n^k$.
2. Tính số kết quả thuận lợi $n(A)$ bằng cách phân chia trường hợp và dùng quy tắc nhân kết hợp tổ hợp $C_{n_1}^{k_1} \\cdot C_{n_2}^{k_2}$.
3. Tính xác suất $P(A) = \\frac{n(A)}{n(\\Omega)}$.`,

  "lop10-b27-d3": `**Phương pháp giải:**
1. Mô hình hóa bài toán thực tế (bốc thăm may mắn, chọn học sinh, thi đấu thể thao, sản phẩm lỗi) thành bài toán rút thẻ, chọn bi hoặc chọn phần tử.
2. Xác định phép thử, lập không gian mẫu, xác định điều kiện của biến cố và tính xác suất.`,
};

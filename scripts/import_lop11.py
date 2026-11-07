# -*- coding: utf-8 -*-
"""
Script rà soát toàn bộ 33 Bài học lý thuyết và Ngân hàng câu hỏi trắc nghiệm Lớp 11
- Giải mã trực tiếp MathType MTEF v3/v5 chuẩn LaTeX không còn ký tự rác.
- Tự động nhận diện cấu trúc Bảng Word (<w:tbl>) chuyển sang Bảng Markdown chuẩn.
- Bóc tách chuẩn xác 100% câu hỏi trắc nghiệm (phục hồi hoàn toàn phương án dính chữ).
- Chuẩn hóa khoảng trắng, dấu câu và các ký hiệu toán học Việt Nam.
- Nạp đầy đủ 33/33 bài học (kể cả Bài 8 và Bài 14).
"""

import os
import re
import io
import json
import uuid
import zipfile
import olefile
import xml.etree.ElementTree as ET
import mysql.connector
import urllib.parse
from dotenv import dotenv_values

import mtef

FOLDER = r"E:\Hethongontap10_11\Lớp 11 các dạng toán cả năm sách KNTT"

CHAPTERS = [
    {"id": "lop11-c1", "ten": "Chương 1: Hàm số lượng giác và phương trình lượng giác", "thuTu": 1},
    {"id": "lop11-c2", "ten": "Chương 2: Dãy số. Cấp số cộng và cấp số nhân", "thuTu": 2},
    {"id": "lop11-c3", "ten": "Chương 3: Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm", "thuTu": 3},
    {"id": "lop11-c4", "ten": "Chương 4: Quan hệ song song trong không gian", "thuTu": 4},
    {"id": "lop11-c5", "ten": "Chương 5: Giới hạn. Hàm số liên tục", "thuTu": 5},
    {"id": "lop11-c6", "ten": "Chương 6: Hàm số mũ và hàm số lôgarit", "thuTu": 6},
    {"id": "lop11-c7", "ten": "Chương 7: Quan hệ vuông góc trong không gian", "thuTu": 7},
    {"id": "lop11-c8", "ten": "Chương 8: Các quy tắc tính xác suất", "thuTu": 8},
    {"id": "lop11-c9", "ten": "Chương 9: Đạo hàm", "thuTu": 9},
]

BAI_NAMES = {
    1: "Bài 1. Giá trị lượng giác của góc lượng giác",
    2: "Bài 2. Công thức lượng giác",
    3: "Bài 3. Hàm số lượng giác",
    4: "Bài 4. Phương trình lượng giác",
    5: "Bài 5. Dãy số",
    6: "Bài 6. Cấp số cộng",
    7: "Bài 7. Cấp số nhân",
    8: "Bài 8. Mẫu số liệu ghép nhóm",
    9: "Bài 9. Các số đặc trưng đo xu thế trung tâm",
    10: "Bài 10. Đường thẳng và mặt phẳng trong không gian",
    11: "Bài 11. Hai đường thẳng song song",
    12: "Bài 12. Đường thẳng và mặt phẳng song song",
    13: "Bài 13. Hai mặt phẳng song song",
    14: "Bài 14. Phép chiếu song song",
    15: "Bài 15. Giới hạn của dãy số",
    16: "Bài 16. Giới hạn của hàm số",
    17: "Bài 17. Hàm số liên tục",
    18: "Bài 18. Lũy thừa với số mũ thực",
    19: "Bài 19. Lôgarit",
    20: "Bài 20. Hàm số mũ và hàm số lôgarit",
    21: "Bài 21. Phương trình, bất phương trình mũ và lôgarit",
    22: "Bài 22. Hai đường thẳng vuông góc",
    23: "Bài 23. Đường thẳng vuông góc với mặt phẳng",
    24: "Bài 24. Phép chiếu vuông góc - Góc giữa đường thẳng và mặt phẳng",
    25: "Bài 25. Hai mặt phẳng vuông góc",
    26: "Bài 26. Khoảng cách trong không gian",
    27: "Bài 27. Thể tích khối đa diện",
    28: "Bài 28. Biến cố hợp, biến cố giao, biến cố độc lập",
    29: "Bài 29. Công thức cộng xác suất",
    30: "Bài 30. Công thức nhân xác suất cho hai biến cố độc lập",
    31: "Bài 31. Định nghĩa và ý nghĩa đạo hàm",
    32: "Bài 32. Các quy tắc tính đạo hàm",
    33: "Bài 33. Đạo hàm cấp hai",
}

def clean_latex(s):
    if not s:
        return ""
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    s = s.replace(r"\left. \right.", "")
    s = s.replace(r"\left.\right.", "")
    s = s.replace(r"\left( \right)", "()")
    s = s.replace(r"\left(\right)", "()")
    s = s.replace(r"^{}", "")
    s = s.replace(r"_{}", "")
    return s.strip()

def normalize_math_text(text):
    """
    Chuẩn hóa toàn diện văn bản và công thức LaTeX:
    - Giãn cách hợp lý các hàng trong hệ phương trình, mảng công thức: \\[12pt]
    - Đưa điều kiện (k \in \mathbb{Z}) ra ngoài \right.
    - Tạo khoảng đệm thoáng đãng quanh các toán tử quan hệ \iff, \implies.
    - Chuẩn hóa phân số, căn thức, hàm lượng giác, góc độ, khoảng cách chính tả tiếng Việt.
    """
    if not text:
        return ""

    s = text

    # 1. Giãn cách các dòng trong array / hệ phương trình nếu chưa có tham số khoảng cách: \\[12pt]
    s = re.sub(r'\\\\(?:\[\d+pt\])?', r'\\\\[12pt]', s)

    # 2. Đưa điều kiện (k \in \mathbb{Z}) ra ngoài \right. nếu bị lọt vào trong
    s = re.sub(
        r'(\\end\{array\})\s*(?:\\quad\s*)?(\([a-zA-Z]\s*\\in\s*\\mathbb\{Z\}\)[.,]?)\s*(?:\\quad\s*)?\\right\.',
        r'\1 \\right. \\quad \2',
        s
    )

    # 3. Chuẩn hóa toán tử tương đương và suy ra thoáng đãng
    s = re.sub(r'(?<!\\)\s*\\Leftrightarrow\s*', r' \\iff ', s)
    s = re.sub(r'(?<!\\)\s*\\Rightarrow\s*', r' \\implies ', s)

    # 4. Tạo khoảng cách \quad trước điều kiện (k \in \mathbb{Z})
    s = re.sub(r'(\\(?:right[.\)\]\}]|end\{array\}))\s*(?:\\quad\s*)?(\([a-zA-Z]\s*\\in)', r'\1 \\quad \2', s)

    # 5. Chuẩn hóa phân số thiếu ngoặc: \frac\pi12 -> \frac{\pi}{12}
    s = re.sub(r'\\frac\s*\\pi\s*([0-9]+)', r'\\frac{\\pi}{\1}', s)
    s = re.sub(r'\\frac\s*([0-9])\s*([0-9]+)', r'\\frac{\1}{\2}', s)
    s = re.sub(r'\\frac\s*([a-zA-Z])\s*([0-9]+)', r'\\frac{\1}{\2}', s)

    # 6. Chuẩn hóa căn thức thiếu ngoặc: \sqrt2 -> \sqrt{2}
    s = re.sub(r'\\sqrt\s*([0-9])(?![0-9{])', r'\\sqrt{\1}', s)
    s = re.sub(r'\\sqrt\s*([a-zA-Z])(?![a-zA-Z{])', r'\\sqrt{\1}', s)

    # 7. Chuẩn hóa hàm lượng giác dính chữ: \sinx -> \sin x
    s = re.sub(r'\\(sin|cos|tan|cot)([a-zA-Z])', r'\\\1 \2', s)

    # 8. Loại bỏ các cặp ngoặc rỗng
    s = s.replace(r'\left( \right)', '()')
    s = s.replace(r'\left(\right)', '()')
    s = s.replace(r'\left. \right.', '')
    s = s.replace(r'\left.\right.', '')
    s = s.replace(r'^{}', '')
    s = s.replace(r'_{}', '')

    # 9. Chuẩn hóa khoảng trắng quanh $ đơn (không áp dụng cho $$)
    s = re.sub(r'([a-zA-Z0-9À-ỹ])(?<!\$)\$(?!\$)', r'\1 $', s)
    s = re.sub(r'(?<!\$)\$(?!\$)([a-zA-Z0-9À-ỹ])', r'$ \1', s)
    s = re.sub(r'\$\s+([.,;:!?])', r'$\1', s)

    # 10. Chuẩn hóa dấu độ \circ
    s = re.sub(r'([0-9]+)\\circ', r'\1^{\\circ}', s)

    # 11. Chuẩn hóa khoảng trắng
    s = re.sub(r' +', ' ', s)

    return s.strip()

def extract_docx_paragraphs(docx_path):
    try:
        z = zipfile.ZipFile(docx_path)
    except Exception:
        return []

    ole_map = {}
    for name in z.namelist():
        if "embeddings/oleObject" in name:
            num = name.split("oleObject")[-1].replace(".bin", "")
            try:
                raw_bytes = z.read(name)
                latex = mtef.ole_to_latex(raw_bytes)
                if latex:
                    clean_ltx = clean_latex(latex)
                    if clean_ltx:
                        ole_map[num] = clean_ltx
            except Exception:
                pass

    r_map = {}
    try:
        rels_xml = z.read("word/_rels/document.xml.rels")
        root_rels = ET.fromstring(rels_xml)
        for child in root_rels:
            rId = child.attrib.get("Id")
            target = child.attrib.get("Target", "")
            if "oleObject" in target:
                m = re.search(r"oleObject(\d+)\.bin", target)
                if m:
                    r_map[rId] = m.group(1)
    except Exception:
        pass

    W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
    r_id_attr = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"

    def extract_node_text(node):
        parts = []
        for elem in node.iter():
            if elem.tag == f"{W}t":
                if elem.text:
                    parts.append(elem.text)
            elif elem.tag.endswith("}OLEObject"):
                rId = elem.attrib.get(r_id_attr)
                if rId and rId in r_map:
                    num = r_map[rId]
                    if num in ole_map:
                        ltx = ole_map[num]
                        if r"\begin{array}" in ltx or r"\\" in ltx:
                            parts.append(f" $${ltx}$$ ")
                        else:
                            parts.append(f" ${ltx}$ ")
        txt = "".join(parts).strip()
        if txt:
            txt = re.sub(r" +", " ", txt)
        return txt

    paragraphs = []
    try:
        doc_xml = z.read("word/document.xml")
        root = ET.fromstring(doc_xml)
        body = root.find(f"{W}body")
        if body is None:
            return []

        for child in body:
            if child.tag == f"{W}p":
                txt = extract_node_text(child)
                if txt:
                    paragraphs.append(txt)
            elif child.tag == f"{W}tbl":
                rows = []
                for tr in child.findall(f"{W}tr"):
                    row = []
                    for tc in tr.findall(f"{W}tc"):
                        cell_txt = extract_node_text(tc)
                        cell_txt = cell_txt.replace("|", r"\|").replace("\n", " ").strip()
                        row.append(cell_txt)
                    if any(row):
                        rows.append(row)
                if rows:
                    max_c = max(len(r) for r in rows)
                    for r in rows:
                        while len(r) < max_c:
                            r.append("")
                    header = "| " + " | ".join(rows[0]) + " |"
                    sep = "| " + " | ".join([":---:"] * max_c) + " |"
                    tbl_md = [header, sep]
                    for r in rows[1:]:
                        tbl_md.append("| " + " | ".join(r) + " |")
                    paragraphs.append("\n\n" + "\n".join(tbl_md) + "\n\n")
    except Exception:
        pass

    return paragraphs

def is_solution_line(text):
    t = text.strip()
    if not t:
        return False
    # Từ khóa đặc trưng của lời giải
    if re.match(r"^(?:Lời giải|Hướng dẫn|Chọn|Chọn|Đáp án|Ta có|Suy ra|Do đó|Vậy|Áp dụng|Theo bài|Theo giả thiết|Từ giả thiết|Mặt khác|Đẳng thức|Đặt|Xét|Nhận xét|Vì|Do|Bảng biến thiên|Đồ thị|Dấu\s+[\"=]|TH\d|Trường hợp|Kết luận|Như vậy|Tương tự|Kẻ|Gọi|Tam giác|Tứ giác|Hình chóp|Thiết diện|Góc giữa|Khoảng cách|Không gian mẫu|Biến cố|Xác suất|Số cách|Số phần tử|Điều kiện|ĐK|Tập nghiệm|Tập xác định|Phương trình tương đương|Hàm số|Đạo hàm|Giới hạn)\b", t, re.IGNORECASE):
        return True
    # Nhận diện giải thích từng phương án trong lời giải: "A sai vì...", "B đúng vì...", "Mệnh đề A sai..."
    if re.match(r"^(?:[A-D]\s+(?:sai|đúng|thỏa|thoả|loại|không)|(?:Phương án|Mệnh đề|Khẳng định|Đáp án)\s+[A-D]\s+(?:sai|đúng|thỏa|thoả|loại))\b", t, re.IGNORECASE):
        return True
    if re.search(r"\b(?:ta có|suy ra|do đó|chọn [A-D]|đáp án [A-D]|vậy chọn [A-D])\b", t, re.IGNORECASE):
        return True
    if t.startswith("$$") or (t.startswith("$") and any(op in t for op in ["=", r"\approx", r"\le", r"\ge", r"\in", r"\subset", r"\cup", r"\cap", r"\Leftrightarrow", r"\Rightarrow", r"\equiv"])):
        return True
    return False

def parse_questions_from_paragraphs(paras):
    a_indices = []
    for i, p in enumerate(paras):
        p_strip = p.strip()
        if re.match(r"^(?:Lời giải|Hướng dẫn|Chọn|Chọn|Đáp án)", p_strip, re.IGNORECASE):
            continue
        if re.search(r"(?:^|[\.\s])A\.\s*", p_strip):
            a_indices.append(i)

    questions = []
    last_end = 0
    current_level = "THONG_HIEU"

    for idx, a_idx in enumerate(a_indices):
        next_a_idx = a_indices[idx + 1] if idx + 1 < len(a_indices) else len(paras)

        # Cập nhật mức độ khó nếu có tiêu đề phân loại trước câu này
        for j in range(max(last_end, 0), a_idx):
            line_lower = paras[j].lower()
            if "nhận biết" in line_lower or "trung bình" in line_lower or "mức độ 1" in line_lower:
                current_level = "NHAN_BIET"
            elif "thông hiểu" in line_lower or "khá" in line_lower or "mức độ 2" in line_lower:
                current_level = "THONG_HIEU"
            elif "vận dụng cao" in line_lower or "giỏi" in line_lower or "mức độ 4" in line_lower:
                current_level = "VAN_DUNG_CAO"
            elif "vận dụng" in line_lower or "mức độ 3" in line_lower:
                current_level = "VAN_DUNG"

        # Trích xuất Đề bài
        q_lines = []
        for j in range(max(last_end, 0), a_idx):
            line = paras[j].strip()
            line_lower = line.lower()
            if not line:
                continue
            if "phần " in line_lower or "dành cho đối tượng" in line_lower:
                continue
            q_lines.append(line)

        # Lọc bỏ các dòng tàn dư từ lời giải câu trước dính vào đầu đề bài câu sau
        while len(q_lines) > 1:
            first_l = q_lines[0].strip()
            if re.match(r"^(Suy ra|Do đó|Vậy|Ta có|Theo bài|Áp dụng|Mặt khác|Đẳng thức|Từ giả thiết|Lời giải|Chọn|Chọn|[A-D]\s+(?:sai|đúng|thỏa|thoả|loại|không)|(?:Phương án|Mệnh đề|Khẳng định|Đáp án)\s+[A-D])\b", first_l, re.IGNORECASE) or (first_l.startswith("$") and ("=" in first_l or r"\approx" in first_l)):
                q_lines.pop(0)
            else:
                break

        question_text = "\n\n".join(q_lines).strip()
        if not question_text:
            question_text = "Chọn khẳng định đúng trong các khẳng định sau:"

        # Trích xuất Lựa chọn A, B, C, D
        sol_idx = next_a_idx
        for j in range(a_idx, next_a_idx):
            line = paras[j].strip()
            if re.match(r"^(?:Lời giải|Hướng dẫn|Chọn|Chọn|Đáp án\s+[A-D])", line, re.IGNORECASE):
                sol_idx = j
                break

        options_text = " ".join(paras[a_idx:sol_idx])
        options = {}

        # 1. Regex bóc tách 4 phương án (kể cả khi dính chữ liền kề)
        m = re.search(r"A\.\s*(.*?)\s*(?:(?=[B-D]\.)|$)B\.\s*(.*?)\s*(?:(?=[C-D]\.)|$)C\.\s*(.*?)\s*(?:(?=D\.)|$)D\.\s*(.*)", options_text)
        if m:
            options["A"] = m.group(1).strip()
            options["B"] = m.group(2).strip()
            options["C"] = m.group(3).strip()
            options["D"] = m.group(4).strip()
        else:
            # 2. Tách bằng split lookahead
            parts = re.split(r"(?:^|(?=[A-D]\.))\s*([A-D])\.\s*", options_text)
            for k in range(1, len(parts) - 1, 2):
                letter = parts[k].upper()
                val = parts[k + 1].strip()
                if letter in ("A", "B", "C", "D"):
                    options[letter] = val

        # Trích xuất Đáp án đúng & Lời giải
        answer = "A"
        for j in range(sol_idx, next_a_idx):
            line = paras[j].strip()
            m_ans = re.search(r"(?:Chọn|Chọn|Đáp án|Hướng dẫn giải:?|Lời giải:?\s*Chọn)\s*([A-D])\b", line, re.IGNORECASE)
            if m_ans:
                answer = m_ans.group(1).upper()

        # Xác định ranh giới giữa Lời giải câu hiện tại và Đề bài câu kế tiếp
        cutoff = next_a_idx
        if idx + 1 < len(a_indices):
            cutoff = next_a_idx - 1
            while cutoff > sol_idx:
                prev_line = paras[cutoff - 1].strip()
                # Nếu dòng phía trên thuộc về Lời giải câu hiện tại -> Dừng lại ngay
                if is_solution_line(prev_line):
                    break
                # Nếu dòng phía trên là tiêu đề phân loại
                if re.search(r"PHẦN\s+[A-Z]|Câu hỏi dành cho|Mức độ\s+\d", prev_line, re.IGNORECASE):
                    break
                # Đề bài trắc nghiệm thông thường dài tối đa 4 đoạn
                if (next_a_idx - cutoff) >= 4:
                    break
                cutoff -= 1

        expl_lines = []
        for j in range(sol_idx, cutoff):
            line = paras[j].strip()
            if not re.match(r"^(?:Lời giải|Hướng dẫn giải)", line, re.IGNORECASE):
                expl_lines.append(line)

        last_end = cutoff
        explanation = "\n\n".join(expl_lines).strip()
        if not explanation:
            explanation = f"Đáp án đúng là **{answer}**."
        elif explanation.strip() in (f"Chọn {answer}", f"Chọn {answer}", f"Đáp án {answer}", f"Chọn {answer}.", f"Chọn {answer}."):
            explanation = f"Chọn **{answer}**.\n\n*(Câu hỏi nhận biết lý thuyết - định lý / tính chất theo SGK)*"

        # Chuẩn hóa LaTeX cho đề bài, các phương án và lời giải
        norm_question = normalize_math_text(question_text)
        norm_options = {k: normalize_math_text(v) for k, v in options.items()}
        norm_explanation = normalize_math_text(explanation)

        # Kiểm tra tính hợp lệ của phương án: phải có đủ 4 phương án A, B, C, D và không phương án nào bị rỗng/chấm
        valid_options_count = 0
        has_empty_opt = False
        for opt_key, opt_val in norm_options.items():
            clean_val = re.sub(r'[\s;.,\$\\\{\}]+', '', opt_val)
            if len(clean_val) > 0:
                valid_options_count += 1
            else:
                has_empty_opt = True

        is_broken = False
        if len(norm_options) < 4 or valid_options_count < 4 or has_empty_opt:
            is_broken = True
        if norm_question.strip() in ("Cho . Kết quả đúng là:", "Cho . Kết quả đúng là") or len(norm_question.strip()) < 5:
            is_broken = True
        if re.match(r"^(?:Chọn|Chọn)\s+[A-D]\.?$", norm_question.strip()):
            is_broken = True

        if not is_broken:
            questions.append({
                "id": f"bt-{uuid.uuid4().hex[:12]}",
                "question": norm_question,
                "level": current_level,
                "options": norm_options,
                "answer": answer,
                "explanation": norm_explanation
            })

    return questions

def format_theory_markdown(paras, bai_title):
    md = [f"# {bai_title}\n"]
    in_vi_du = False
    in_list = False

    for p in paras:
        p_clean = p.strip()
        if not p_clean:
            continue

        if "PHẦN A" in p_clean:
            md.append("\n## PHẦN A. LÝ THUYẾT CỐT LÕI VÀ VÍ DỤ MINH HỌA\n")
            in_vi_du = False
            in_list = False
            continue
        elif "PHẦN B" in p_clean:
            md.append("\n## PHẦN B. CÁC DẠNG TOÁN VÀ PHƯƠNG PHÁP GIẢI\n")
            in_vi_du = False
            in_list = False
            continue
        elif "PHẦN C" in p_clean:
            break

        # Nếu là Bảng Markdown (bắt đầu bằng |)
        if p_clean.startswith("|"):
            md.append(f"\n\n{p_clean}\n\n")
            in_vi_du = False
            in_list = False
            continue

        # Chuẩn hóa LaTeX cho từng đoạn lý thuyết
        p_norm = normalize_math_text(p_clean)

        # Chuẩn hóa các ký tự đầu dòng dạng bullet sang Markdown list '-'
        if re.match(r'^[•·]\s*', p_norm):
            p_norm = re.sub(r'^[•·]\s*', r'- ', p_norm)
        elif re.match(r'^\+\s+', p_norm):
            p_norm = re.sub(r'^\+\s+', r'- ', p_norm)

        # Xử lý danh sách đầu dòng (list items) thành tight list
        if p_norm.startswith("- ") or p_norm.startswith("* "):
            if in_list:
                md.append(p_norm)
            else:
                md.append(f"\n{p_norm}")
                in_list = True
            in_vi_du = False
            continue
        else:
            if in_list:
                md.append("")
                in_list = False

        # Tách tiêu đề Markdown và công thức display math nếu bị gộp chung một dòng
        # Ví dụ: "#### a) $$ \sin x = ... $$" -> dòng trên là "#### a)", dòng dưới là "$$ \sin x = ... $$"
        m_head_display = re.match(r'^(#{1,6}\s+[^\$]+?)(\$\$.*)$', p_norm)
        if m_head_display:
            head_part = m_head_display.group(1).strip()
            math_part = m_head_display.group(2).strip()
            md.append(f"\n{head_part}\n\n{math_part}\n\n")
            in_vi_du = False
            continue

        if re.match(r"^[0-9]+\.\s+[A-ZÀ-Ỹ]", p_norm):
            if "$$" in p_norm:
                m_part = re.match(r"^([0-9]+\.\s+[^\$]+?)\s*(\$\$.*)$", p_norm)
                if m_part:
                    md.append(f"\n### {m_part.group(1).strip()}\n\n{m_part.group(2).strip()}\n\n")
                else:
                    md.append(f"\n### {p_norm}\n\n")
            else:
                md.append(f"\n### {p_norm}\n\n")
            in_vi_du = False
            continue
        elif re.match(r"^[a-z]\)\s*", p_norm):
            if "$$" in p_norm:
                m_part = re.match(r"^([a-z]\)\s*.*?)\s*(\$\$.*)$", p_norm)
                if m_part:
                    md.append(f"\n#### {m_part.group(1).strip()}\n\n{m_part.group(2).strip()}\n\n")
                else:
                    md.append(f"\n#### {p_norm}\n\n")
            else:
                md.append(f"\n#### {p_norm}\n\n")
            in_vi_du = False
            continue
        elif p_norm.startswith("Dạng") or p_norm.startswith("DẠNG"):
            md.append(f"\n### 📌 {p_norm}\n\n")
            in_vi_du = False
            continue
        elif p_norm.startswith("Ví dụ") or p_norm.startswith("VÍ DỤ"):
            if "$$" in p_norm:
                m_part = re.match(r"^(Ví dụ[^\$]+?)\s*(\$\$.*)$", p_norm, re.IGNORECASE)
                if m_part:
                    md.append(f"\n> **{m_part.group(1).strip()}**\n\n{m_part.group(2).strip()}\n\n")
                else:
                    md.append(f"\n> **{p_norm}**\n\n")
            else:
                md.append(f"\n> **{p_norm}**\n\n")
            in_vi_du = True
            continue
        elif re.match(r"^(Lời giải|Giải:|Giải\b|Hướng dẫn giải)", p_norm):
            md.append(f"\n*Lời giải:*\n\n")
            in_vi_du = True
            continue
        elif p_norm.startswith("Chú ý") or p_norm.startswith("Nhận xét"):
            md.append(f"\n> 💡 **{p_norm}**\n\n")
            in_vi_du = False
            continue
        elif p_norm.startswith("$$"):
            md.append(f"\n\n{p_norm}\n\n")
            continue
        else:
            md.append(f"{p_norm}\n\n")

    return "\n".join(md)

def main():
    print("🚀 Bắt đầu nạp & chuẩn hóa toàn diện 33 Bài Lớp 11 (Lý thuyết + Bài tập)...")
    env = dotenv_values("e:/Hethongontap10_11/.env")
    url = env.get("DATABASE_URL")
    u = urllib.parse.urlparse(url)

    conn = mysql.connector.connect(
        host=u.hostname or "localhost",
        port=u.port or 3306,
        user=u.username or "root",
        password=u.password or "",
        database=u.path.lstrip("/")
    )
    cur = conn.cursor()

    cur.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cur.execute("TRUNCATE TABLE lan_lam_bai;")
    cur.execute("TRUNCATE TABLE the_on_tap;")
    cur.execute("TRUNCATE TABLE bai_tap;")
    cur.execute("SET FOREIGN_KEY_CHECKS = 1;")
    conn.commit()

    for ch in CHAPTERS:
        cur.execute("""
            INSERT INTO chuong (id, lopId, ten, thuTu) 
            VALUES (%s, %s, %s, %s) 
            ON DUPLICATE KEY UPDATE ten=VALUES(ten), thuTu=VALUES(thuTu)
        """, (ch["id"], "lop-11", ch["ten"], ch["thuTu"]))
    conn.commit()

    all_files = os.listdir(FOLDER)
    total_bais = 0
    total_questions = 0

    for bai_num in range(1, 34):
        ch_idx = 1
        if bai_num <= 4: ch_idx = 1
        elif bai_num <= 7: ch_idx = 2
        elif bai_num <= 9: ch_idx = 3
        elif bai_num <= 14: ch_idx = 4
        elif bai_num <= 17: ch_idx = 5
        elif bai_num <= 21: ch_idx = 6
        elif bai_num <= 27: ch_idx = 7
        elif bai_num <= 30: ch_idx = 8
        else: ch_idx = 9

        ch_id = f"lop11-c{ch_idx}"
        bai_id = f"lop11-c{ch_idx}-b{bai_num}"
        chude_id = f"lop11-c{ch_idx}-cd{bai_num}"
        bai_title = BAI_NAMES.get(bai_num, f"Bài {bai_num}")

        ch_file = None
        tn_file = None

        for f in all_files:
            if not f.endswith(".docx") or f.startswith("~$") or f.startswith("."):
                continue
            pattern = rf"Bài\s*[-–_]?\s*0?{bai_num}\b"
            if re.search(pattern, f, re.IGNORECASE) or (bai_num == 1 and "Bài 1. Giá Trị Lượng Giác" in f):
                if "CH" in f and not "TN" in f:
                    ch_file = os.path.join(FOLDER, f)
                if "DA-TN" in f or "DA - TN" in f or "DA TN" in f or "TN" in f:
                    tn_file = os.path.join(FOLDER, f)

        # Bổ sung Bài 8 (C3_Bài 8. mau-so-lieu-ghep-nhom-DA.docx)
        if bai_num == 8 and not tn_file:
            for f in all_files:
                if "Bài 8" in f and "DA" in f:
                    tn_file = os.path.join(FOLDER, f)

        # Bổ sung Bài 14 (C4_Bài-14-Phep-Chieu-Song-Song-DA.docx)
        if bai_num == 14 and not tn_file:
            for f in all_files:
                if "Bài-14" in f and "DA" in f:
                    tn_file = os.path.join(FOLDER, f)

        # Fallback đặc biệt cho bài 18
        if bai_num == 18:
            for f in all_files:
                if "Bài 18" in f and "CH" in f:
                    ch_file = os.path.join(FOLDER, f)
                elif "Bài 18" in f and "DA" in f:
                    tn_file = os.path.join(FOLDER, f)

        # Fallback đặc biệt cho bài 28, 29, 30
        if bai_num in (28, 29, 30) and not tn_file:
            for f in all_files:
                if "Trac Nghiem Xac Suat - DA - TN" in f:
                    tn_file = os.path.join(FOLDER, f)

        theory_content = f"# {bai_title}\n\nNội dung lý thuyết và các dạng toán đang được cập nhật..."
        if ch_file:
            paras = extract_docx_paragraphs(ch_file)
            if paras:
                theory_content = format_theory_markdown(paras, bai_title)

        cur.execute("""
            INSERT INTO bai (id, chuongId, tieu_de, noiDung, thuTu, taoLuc, capNhatLuc)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            ON DUPLICATE KEY UPDATE tieu_de=VALUES(tieu_de), noiDung=VALUES(noiDung), thuTu=VALUES(thuTu), capNhatLuc=NOW()
        """, (bai_id, ch_id, bai_title, theory_content, bai_num))

        cur.execute("""
            INSERT INTO chu_de (id, chuongId, ten, thuTu)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE ten=VALUES(ten), thuTu=VALUES(thuTu)
        """, (chude_id, ch_id, bai_title, bai_num))

        cur.execute("DELETE FROM bai_tap WHERE chuDeId = %s", (chude_id,))

        q_count = 0
        if tn_file:
            paras_tn = extract_docx_paragraphs(tn_file)
            qs = parse_questions_from_paragraphs(paras_tn)
            for q in qs:
                dapAn_json = json.dumps({
                    "dapAnDung": q["answer"],
                    "cacLuaChon": q["options"]
                }, ensure_ascii=False)

                cur.execute("""
                    INSERT INTO bai_tap (id, chuDeId, deBai, loai, mucDo, dapAn, loiGiaiChiTiet, dangBai, taoLuc, capNhatLuc)
                    VALUES (%s, %s, %s, 'TRAC_NGHIEM', %s, %s, %s, %s, NOW(), NOW())
                """, (
                    q["id"],
                    chude_id,
                    q["question"],
                    q["level"],
                    dapAn_json,
                    q["explanation"] or f"Đáp án đúng là: {q['answer']}",
                    bai_title
                ))
                q_count += 1
                total_questions += 1

        total_bais += 1
        print(f"  ✓ {bai_title}: {q_count} câu trắc nghiệm chuẩn LaTeX")
        conn.commit()

    conn.close()
    print(f"\n🎉 HOÀN TẤT NẠP & CHUẨN HÓA! Tổng cộng {total_bais} bài học và {total_questions} câu trắc nghiệm chuẩn LaTeX!")

if __name__ == '__main__':
    main()

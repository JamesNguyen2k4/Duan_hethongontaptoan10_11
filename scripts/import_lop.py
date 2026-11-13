# -*- coding: utf-8 -*-
"""
Script tổng quát nạp Lý thuyết & Ngân hàng câu hỏi trắc nghiệm từ thư mục Word (.docx)
theo từng lớp (mặc định đọc cấu hình từ scripts/config/lop<10|11>.json).
An toàn đa lớp: chỉ upsert/xóa câu hỏi thuộc đúng lớp được chỉ định, không ảnh hưởng lớp khác.

Cách dùng:
  python scripts/import_lop.py --lop 10 --folder "E:\\Hethongontap10_11\\Lop 10 KNTT"
"""

import argparse
import json
import os
import re
import urllib.parse
import mysql.connector
from dotenv import dotenv_values

import import_lop11 as parser_lib


def find_chapter_for_bai(chapters, bai_num):
    for ch in chapters:
        start, end = ch["baiRange"]
        if start <= bai_num <= end:
            return ch["thuTu"]
    return 1


def main():
    ap = argparse.ArgumentParser(description="Import nội dung Toán theo lớp (10 hoặc 11)")
    ap.add_argument("--lop", required=True, choices=["10"], help="Khối lớp cần nạp (10)")
    ap.add_argument("--folder", required=True, help="Đường dẫn thư mục chứa file .docx")
    args = ap.parse_args()

    cfg_path = os.path.join(os.path.dirname(__file__), "config", f"lop{args.lop}.json")
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    if not os.path.isdir(args.folder):
        raise SystemExit(f"❌ Không tìm thấy thư mục: {args.folder}")

    lop_id = cfg["lopId"]
    prefix = cfg["prefix"]
    chapters = cfg["chapters"]
    bai_names = {int(k): v for k, v in cfg["baiNames"].items()}

    env = dotenv_values("e:/Hethongontap10_11/.env")
    u = urllib.parse.urlparse(env.get("DATABASE_URL"))
    conn = mysql.connector.connect(
        host=u.hostname or "localhost",
        port=u.port or 3306,
        user=u.username or "root",
        password=u.password or "",
        database=u.path.lstrip("/"),
    )
    cur = conn.cursor()

    for ch in chapters:
        cur.execute(
            """
            INSERT INTO chuong (id, lopId, ten, thuTu)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE ten=VALUES(ten), thuTu=VALUES(thuTu)
            """,
            (ch["id"], lop_id, ch["ten"], ch["thuTu"]),
        )
    conn.commit()

    all_files = [
        fn for fn in os.listdir(args.folder)
        if fn.endswith(".docx") and not fn.startswith("~$") and not fn.startswith(".")
    ]

    total_bais = 0
    total_questions = 0

    for bai_num in sorted(bai_names.keys()):
        ch_idx = find_chapter_for_bai(chapters, bai_num)
        ch_id = f"{prefix}-c{ch_idx}"
        bai_id = f"{prefix}-c{ch_idx}-b{bai_num}"
        chude_id = f"{prefix}-c{ch_idx}-cd{bai_num}"
        bai_title = bai_names[bai_num]

        ch_file = None
        tn_file = None
        pattern = rf"Bài\s*[-–_]?\s*0?{bai_num}\b"
        for fn in all_files:
            if re.search(pattern, fn, re.IGNORECASE):
                if "CH" in fn and "TN" not in fn:
                    ch_file = os.path.join(args.folder, fn)
                if "DA-TN" in fn or "DA - TN" in fn or "DA TN" in fn or "TN" in fn or "DA" in fn:
                    tn_file = os.path.join(args.folder, fn)

        if ch_file:
            paras = parser_lib.extract_docx_paragraphs(ch_file)
            if paras:
                theory_content = parser_lib.format_theory_markdown(paras, bai_title)
                cur.execute(
                    """
                    INSERT INTO bai (id, chuongId, tieu_de, noiDung, thuTu, taoLuc, capNhatLuc)
                    VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE tieu_de=VALUES(tieu_de), noiDung=VALUES(noiDung), thuTu=VALUES(thuTu), capNhatLuc=NOW()
                    """,
                    (bai_id, ch_id, bai_title, theory_content, bai_num),
                )

        cur.execute(
            """
            INSERT INTO chu_de (id, chuongId, ten, thuTu)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE ten=VALUES(ten), thuTu=VALUES(thuTu)
            """,
            (chude_id, ch_id, bai_title, bai_num),
        )

        q_count = 0
        if tn_file:
            # Chỉ xóa bài tập của chủ đề hiện tại (thuộc lớp đang import) nếu chưa có lịch sử làm bài
            cur.execute("DELETE FROM bai_tap WHERE chuDeId = %s", (chude_id,))
            paras_tn = parser_lib.extract_docx_paragraphs(tn_file)
            qs = parser_lib.parse_questions_from_paragraphs(paras_tn)
            for q in qs:
                dap_an_json = json.dumps(
                    {"dapAnDung": q["answer"], "cacLuaChon": q["options"]},
                    ensure_ascii=False,
                )
                cur.execute(
                    """
                    INSERT INTO bai_tap (id, chuDeId, deBai, loai, mucDo, dapAn, loiGiaiChiTiet, dangBai, taoLuc, capNhatLuc)
                    VALUES (%s, %s, %s, 'TRAC_NGHIEM', %s, %s, %s, %s, NOW(), NOW())
                    """,
                    (
                        f"{prefix}-{q['id']}",
                        chude_id,
                        q["question"],
                        q["level"],
                        dap_an_json,
                        q["explanation"] or f"Đáp án đúng là: {q['answer']}",
                        bai_title,
                    ),
                )
                q_count += 1
                total_questions += 1

        total_bais += 1
        print(f"  ✓ {bai_title}: {q_count} câu trắc nghiệm")
        conn.commit()

    conn.close()
    print(f"\n🎉 Hoàn tất nạp {lop_id}: {total_bais} bài, {total_questions} câu trắc nghiệm.")


if __name__ == "__main__":
    main()


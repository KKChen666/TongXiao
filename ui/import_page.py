import customtkinter as ctk
import csv, json, os
from tkinter import filedialog, messagebox
from database.db import get_conn
from config import COLOR_TEXT, COLOR_TEXT_SUB, COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER


class ImportPage(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color="#F2F3F7", corner_radius=0)
        self.app = app
        self.file_path = None
        self.preview_data = []
        self._build()

    def _build(self):
        ctk.CTkLabel(
            self, text="导入学习资料",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(pady=(36, 6))

        ctk.CTkLabel(
            self, text="支持 CSV / JSON / TXT 格式",
            font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB,
        ).pack(pady=(0, 20))

        card = ctk.CTkFrame(self, fg_color="white", corner_radius=16)
        card.pack(fill="x", padx=24, pady=6)

        ctk.CTkLabel(
            card, text="选择科目",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(anchor="w", padx=20, pady=(16, 6))

        self.subject_var = ctk.StringVar(value="english")
        row = ctk.CTkFrame(card, fg_color="transparent")
        row.pack(padx=20, pady=(0, 10))
        for val, lbl in [("english", "考研英语"), ("politics", "考研政治")]:
            ctk.CTkRadioButton(
                row, text=lbl, variable=self.subject_var,
                value=val, font=ctk.CTkFont(size=13),
            ).pack(side="left", padx=(0, 20))

        ctk.CTkLabel(
            card, text="选择章节（可选，默认创建新章节）",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(anchor="w", padx=20, pady=(10, 4))

        self.topic_entry = ctk.CTkEntry(
            card, placeholder_text="输入新章节名称，或留空自动命名",
            height=35, corner_radius=8,
        )
        self.topic_entry.pack(fill="x", padx=20, pady=(0, 12))

        ctk.CTkLabel(
            card, text="选择文件",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(anchor="w", padx=20, pady=(6, 6))

        file_row = ctk.CTkFrame(card, fg_color="transparent")
        file_row.pack(fill="x", padx=20, pady=(0, 16))

        self.file_label = ctk.CTkLabel(
            file_row, text="未选择文件",
            font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB, anchor="w",
        )
        self.file_label.pack(side="left", fill="x", expand=True)

        ctk.CTkButton(
            file_row, text="选择文件", width=80, height=32,
            fg_color=COLOR_PRIMARY, corner_radius=16,
            font=ctk.CTkFont(size=13), command=self._pick_file,
        ).pack(side="right")

        self.preview_frame = ctk.CTkScrollableFrame(
            self, fg_color="transparent",
            scrollbar_button_color="#D1D1D6",
        )
        self.preview_frame.pack(fill="both", expand=True, padx=24, pady=6)

        self.import_btn = ctk.CTkButton(
            self, text="确认导入", height=44,
            fg_color=COLOR_PRIMARY, corner_radius=22,
            font=ctk.CTkFont(size=15, weight="bold"),
            state="disabled", command=self._do_import,
        )
        self.import_btn.pack(padx=24, pady=(6, 30))

        self.status_lbl = ctk.CTkLabel(
            self, text="", font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB,
        )
        self.status_lbl.pack(pady=(0, 10))

    def _pick_file(self):
        path = filedialog.askopenfilename(
            title="选择导入文件",
            filetypes=[
                ("支持格式", "*.csv *.json *.txt"),
                ("CSV 文件", "*.csv"),
                ("JSON 文件", "*.json"),
                ("文本文件", "*.txt"),
            ],
        )
        if not path:
            return
        self.file_path = path
        self.file_label.configure(text=os.path.basename(path))
        self._preview(path)

    def _preview(self, path):
        for w in self.preview_frame.winfo_children():
            w.destroy()
        self.preview_data.clear()

        ext = os.path.splitext(path)[1].lower()
        try:
            if ext == ".csv":
                with open(path, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    rows = list(reader)
                    if not rows:
                        raise ValueError("CSV 文件为空")
                    fields = list(rows[0].keys())
                    self._show_csv_preview(rows, fields)
            elif ext == ".json":
                with open(path, "r", encoding="utf-8") as f:
                    rows = json.load(f)
                if not isinstance(rows, list) or not rows:
                    raise ValueError("JSON 应为非空数组")
                self._show_json_preview(rows)
            elif ext == ".txt":
                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                rows = []
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split("|") if "|" in line else line.split("\t")
                    if len(parts) >= 2:
                        rows.append({"front": parts[0].strip(), "back": parts[1].strip()})
                if not rows:
                    raise ValueError("TXT 未找到有效数据（用 | 或 Tab 分隔）")
                self._show_json_preview(rows)
        except Exception as e:
            self.status_lbl.configure(text=f"❌ 读取失败：{e}", text_color=COLOR_DANGER)
            self.import_btn.configure(state="disabled")
            return

    def _show_csv_preview(self, rows, fields):
        ctk.CTkLabel(
            self.preview_frame, text="选择列映射：",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(anchor="w", pady=(4, 4))

        map_row = ctk.CTkFrame(self.preview_frame, fg_color="transparent")
        map_row.pack(anchor="w", pady=(0, 8))
        self.front_var = ctk.StringVar(value="")
        self.back_var = ctk.StringVar(value="")
        fronts = [ctk.CTkComboBox(map_row, values=fields, variable=self.front_var, width=100, height=28, state="readonly")]
        backs = [ctk.CTkComboBox(map_row, values=fields, variable=self.back_var, width=100, height=28, state="readonly")]
        ctk.CTkLabel(map_row, text="正面列", font=ctk.CTkFont(size=12)).pack(side="left", padx=(0, 4))
        f1 = fronts[0]; f1.pack(side="left", padx=(0, 12))
        ctk.CTkLabel(map_row, text="背面列", font=ctk.CTkFont(size=12)).pack(side="left", padx=(0, 4))
        f2 = backs[0]; f2.pack(side="left")
        if len(fields) >= 2:
            self.front_var.set(fields[0])
            self.back_var.set(fields[1])
        elif fields:
            self.front_var.set(fields[0])
            self.back_var.set(fields[0])

        self.preview_data = rows[:10]
        self._show_rows(self.preview_data)
        self.import_btn.configure(state="normal")
        self.status_lbl.configure(text=f"✅ 共 {len(rows)} 条，预览前 10 条", text_color=COLOR_SUCCESS)

    def _show_json_preview(self, rows):
        self.preview_data = rows[:10]
        self._show_rows(self.preview_data)
        self.import_btn.configure(state="normal")
        self.status_lbl.configure(text=f"✅ 共 {len(rows)} 条，预览前 10 条", text_color=COLOR_SUCCESS)

    def _show_rows(self, rows):
        for w in self.preview_frame.winfo_children():
            w.destroy()
        for i, row in enumerate(rows):
            front = row.get("front", row.get("Front", row.get("word", "")))
            back = row.get("back", row.get("Back", row.get("definition", row.get("meaning", ""))))
            item = ctk.CTkFrame(self.preview_frame, fg_color="white", corner_radius=8)
            item.pack(fill="x", pady=2)
            ctk.CTkLabel(
                item, text=f"{i + 1}. {front}",
                font=ctk.CTkFont(size=13, weight="bold"),
                text_color=COLOR_TEXT, anchor="w",
            ).pack(anchor="w", padx=12, pady=(4, 0))
            ctk.CTkLabel(
                item, text=str(back)[:60],
                font=ctk.CTkFont(size=12),
                text_color=COLOR_TEXT_SUB, anchor="w",
            ).pack(anchor="w", padx=12, pady=(0, 4))

    def _do_import(self):
        path = self.file_path
        if not path:
            return
        ext = os.path.splitext(path)[1].lower()
        try:
            if ext == ".csv":
                with open(path, "r", encoding="utf-8-sig") as f:
                    rows = list(csv.DictReader(f))
                front_col = self.front_var.get()
                back_col = self.back_var.get()
                data = [(r[front_col], r[back_col]) for r in rows if front_col in r and back_col in r]
            elif ext == ".json":
                with open(path, "r", encoding="utf-8") as f:
                    rows = json.load(f)
                data = [(r.get("front", r.get("Front", r.get("word", ""))),
                         r.get("back", r.get("Back", r.get("definition", "")))) for r in rows]
            else:
                with open(path, "r", encoding="utf-8") as f:
                    lines = f.readlines()
                data = []
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    parts = line.split("|") if "|" in line else line.split("\t")
                    if len(parts) >= 2:
                        data.append((parts[0].strip(), parts[1].strip()))

            if not data:
                self.status_lbl.configure(text="❌ 无有效数据", text_color=COLOR_DANGER)
                return

            subject_name = self.subject_var.get()
            topic_name = self.topic_entry.get().strip() or f"导入 - {os.path.splitext(os.path.basename(path))[0]}"

            conn = get_conn()
            cur = conn.cursor()
            cur.execute("SELECT id FROM subjects WHERE name=%s", (subject_name,))
            subj = cur.fetchone()
            if not subj:
                self.status_lbl.configure(text="❌ 科目不存在", text_color=COLOR_DANGER)
                return
            sid = subj["id"]

            cur.execute("SELECT id FROM topics WHERE subject_id=%s AND name=%s", (sid, topic_name))
            topic = cur.fetchone()
            if topic:
                tid = topic["id"]
                cur.execute("DELETE FROM cards WHERE topic_id=%s", (tid,))
            else:
                cur.execute("SELECT MAX(order_num) FROM topics WHERE subject_id=%s", (sid,))
                max_ord = cur.fetchone()["MAX(order_num)"] or 0
                cur.execute("INSERT INTO topics (subject_id, name, order_num) VALUES (%s,%s,%s)",
                            (sid, topic_name, max_ord + 1))
                tid = cur.lastrowid

            for idx, (front, back) in enumerate(data):
                cur.execute(
                    "INSERT INTO cards (topic_id, front, back, order_num) VALUES (%s,%s,%s,%s)",
                    (tid, front, back, idx + 1),
                )
            conn.commit()
            self.status_lbl.configure(
                text=f"✅ 成功导入 {len(data)} 张卡片到「{topic_name}」",
                text_color=COLOR_SUCCESS,
            )
            messagebox.showinfo("导入成功", f"成功导入 {len(data)} 张卡片！")
        except Exception as e:
            self.status_lbl.configure(text=f"❌ 导入失败：{e}", text_color=COLOR_DANGER)

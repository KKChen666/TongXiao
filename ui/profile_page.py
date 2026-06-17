import customtkinter as ctk
from database.db import get_subjects, get_subject_progress
from config import COLOR_TEXT, COLOR_TEXT_SUB, COLOR_PRIMARY, COLOR_SUCCESS


class ProfilePage(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color="#F2F3F7", corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        ctk.CTkLabel(
            self, text="学习统计",
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(pady=(36, 20))

        total_all = 0
        reviewed_all = 0
        subjects = get_subjects()
        for s in subjects:
            total, reviewed = get_subject_progress(s["id"])
            total_all += total
            reviewed_all += reviewed

        stats = [
            ("📊 总卡片数", str(total_all)),
            ("✅ 已复习", str(reviewed_all)),
            ("🎯 待复习", str(total_all - reviewed_all)),
            ("📈 完成率", f"{reviewed_all / total_all * 100:.1f}%" if total_all else "0%"),
        ]

        card = ctk.CTkFrame(self, fg_color="white", corner_radius=16)
        card.pack(fill="x", padx=24, pady=6)

        for i, (label, value) in enumerate(stats):
            row = ctk.CTkFrame(card, fg_color="transparent")
            row.pack(fill="x", padx=20, pady=8)
            ctk.CTkLabel(
                row, text=label,
                font=ctk.CTkFont(size=14),
                text_color=COLOR_TEXT_SUB,
            ).pack(side="left")
            ctk.CTkLabel(
                row, text=value,
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color=COLOR_TEXT,
            ).pack(side="right")
            if i < len(stats) - 1:
                ctk.CTkFrame(card, fg_color="#E8EDF2", height=1).pack(fill="x", padx=20)

        ctk.CTkLabel(
            self, text="各科目进度",
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(anchor="w", padx=24, pady=(20, 8))

        for s in subjects:
            total, reviewed = get_subject_progress(s["id"])
            pct = (reviewed / total * 100) if total else 0

            sc = ctk.CTkFrame(self, fg_color="white", corner_radius=12)
            sc.pack(fill="x", padx=24, pady=4)

            ctk.CTkLabel(
                sc, text=f"{s['icon']} {s['display_name']}",
                font=ctk.CTkFont(size=14, weight="bold"),
                text_color=COLOR_TEXT,
            ).pack(anchor="w", padx=16, pady=(10, 2))

            ctk.CTkLabel(
                sc, text=f"{reviewed}/{total} ({pct:.0f}%)",
                font=ctk.CTkFont(size=12),
                text_color=COLOR_TEXT_SUB,
            ).pack(anchor="w", padx=16)

            bar = ctk.CTkProgressBar(
                sc, height=5, corner_radius=3,
                fg_color="#E8EDF2",
                progress_color=COLOR_SUCCESS if pct == 100 else COLOR_PRIMARY,
            )
            bar.pack(fill="x", padx=16, pady=(4, 10))
            bar.set(pct / 100)

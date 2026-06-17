import customtkinter as ctk
from database.db import get_subjects, get_subject_progress
from config import COLOR_TEXT, COLOR_TEXT_SUB, COLOR_PRIMARY


class SubjectPage(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color="#F2F3F7", corner_radius=0)
        self.app = app
        self._build()

    def _build(self):
        ctk.CTkLabel(
            self, text="考研背诵",
            font=ctk.CTkFont(size=26, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(pady=(40, 5))

        ctk.CTkLabel(
            self, text="选择科目开始学习",
            font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB,
        ).pack(pady=(0, 25))

        subjects = get_subjects()
        for s in subjects:
            total, reviewed = get_subject_progress(s["id"])
            pct = (reviewed / total * 100) if total > 0 else 0

            card = ctk.CTkFrame(
                self, fg_color="white", corner_radius=16,
                cursor="hand2", height=110,
            )
            card.pack(fill="x", padx=24, pady=7)
            card.pack_propagate(False)

            row = ctk.CTkFrame(card, fg_color="transparent")
            row.pack(fill="both", expand=True, padx=20, pady=12)

            icon = ctk.CTkLabel(
                row, text=s["icon"],
                font=ctk.CTkFont(size=36),
            )
            icon.pack(side="left", padx=(0, 14))

            mid = ctk.CTkFrame(row, fg_color="transparent")
            mid.pack(side="left", fill="x", expand=True)

            ctk.CTkLabel(
                mid, text=s["display_name"],
                font=ctk.CTkFont(size=18, weight="bold"),
                text_color=COLOR_TEXT, anchor="w",
            ).pack(anchor="w")

            ctk.CTkLabel(
                mid, text=f"{reviewed}/{total} 已掌握",
                font=ctk.CTkFont(size=12),
                text_color=COLOR_TEXT_SUB, anchor="w",
            ).pack(anchor="w", pady=(2, 4))

            bar = ctk.CTkProgressBar(
                mid, height=5, corner_radius=3,
                fg_color="#E8EDF2", progress_color=COLOR_PRIMARY,
            )
            bar.pack(fill="x")
            bar.set(pct / 100)

            arrow = ctk.CTkLabel(
                row, text="›",
                font=ctk.CTkFont(size=28, weight="bold"),
                text_color="#C7C7CC",
            )
            arrow.pack(side="right", padx=(5, 0))

            card.bind("<Button-1>", lambda e, sb=s: self.app._show_books(sb))
            for child in card.winfo_children():
                child.bind("<Button-1>", lambda e, sb=s: self.app._show_books(sb))
                for sub in child.winfo_children():
                    sub.bind("<Button-1>", lambda e, sb=s: self.app._show_books(sb))

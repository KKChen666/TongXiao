import customtkinter as ctk
from database.db import get_subjects, get_subject_progress


class SubjectPage(ctk.CTkFrame):
    def __init__(self, parent, app):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self._build_ui()

    def _build_ui(self):
        header = ctk.CTkLabel(
            self,
            text="📚 考研背诵助手",
            font=ctk.CTkFont(size=28, weight="bold"),
            text_color="#2C3E50",
        )
        header.pack(pady=(50, 10))

        subtitle = ctk.CTkLabel(
            self,
            text="选择科目开始背诵",
            font=ctk.CTkFont(size=14),
            text_color="#7F8C8D",
        )
        subtitle.pack(pady=(0, 40))

        subjects = get_subjects()
        cards_frame = ctk.CTkFrame(self, fg_color="transparent")
        cards_frame.pack(expand=True, fill="both", padx=80, pady=20)

        for subject in subjects:
            sid = subject["id"]
            name = subject["display_name"]
            total, reviewed = get_subject_progress(sid)
            pct = (reviewed / total * 100) if total > 0 else 0

            card = ctk.CTkFrame(
                cards_frame,
                corner_radius=16,
                border_width=0,
                fg_color="white",
            )
            card.pack(fill="x", pady=10, ipady=20)
            card.configure(cursor="hand2")

            icon_label = ctk.CTkLabel(
                card,
                text=subject["icon"],
                font=ctk.CTkFont(size=48),
            )
            icon_label.pack(side="left", padx=(30, 10))

            text_frame = ctk.CTkFrame(card, fg_color="transparent")
            text_frame.pack(side="left", fill="x", expand=True, padx=10)

            ctk.CTkLabel(
                text_frame,
                text=name,
                font=ctk.CTkFont(size=20, weight="bold"),
                text_color="#2C3E50",
                anchor="w",
            ).pack(anchor="w", pady=(8, 2))

            ctk.CTkLabel(
                text_frame,
                text=f"已掌握 {reviewed}/{total} 题 ({pct:.0f}%)",
                font=ctk.CTkFont(size=13),
                text_color="#7F8C8D",
                anchor="w",
            ).pack(anchor="w")

            progress = ctk.CTkProgressBar(
                text_frame,
                height=6,
                corner_radius=3,
                fg_color="#E8EDF2",
                progress_color="#4A90D9",
            )
            progress.pack(fill="x", pady=(6, 8))
            progress.set(pct / 100)

            arrow = ctk.CTkLabel(
                card,
                text="›",
                font=ctk.CTkFont(size=32),
                text_color="#BDC3C7",
            )
            arrow.pack(side="right", padx=(10, 25))

            card.bind(
                "<Button-1>",
                lambda e, s=subject: self.app.show_topics(s),
            )
            for child in card.winfo_children():
                child.bind(
                    "<Button-1>",
                    lambda e, s=subject: self.app.show_topics(s),
                )

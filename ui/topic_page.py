import customtkinter as ctk
from database.db import get_topics, get_topic_progress


class TopicPage(ctk.CTkFrame):
    def __init__(self, parent, app, subject):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.subject = subject
        self._build_ui()

    def _build_ui(self):
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(fill="x", padx=30, pady=(25, 5))

        back_btn = ctk.CTkButton(
            header_frame,
            text="← 返回",
            width=80,
            height=32,
            fg_color="transparent",
            text_color="#4A90D9",
            hover_color="#EBF5FB",
            font=ctk.CTkFont(size=14),
            command=lambda: self.app.show_subjects(),
        )
        back_btn.pack(side="left")

        ctk.CTkLabel(
            header_frame,
            text=self.subject["display_name"],
            font=ctk.CTkFont(size=22, weight="bold"),
            text_color="#2C3E50",
        ).pack(side="left", padx=20)

        scroll = ctk.CTkScrollableFrame(
            self, fg_color="transparent", scrollbar_button_color="#D0D5DD"
        )
        scroll.pack(fill="both", expand=True, padx=30, pady=10)

        topics = get_topics(self.subject["id"])
        if not topics:
            ctk.CTkLabel(
                scroll,
                text="暂无内容",
                font=ctk.CTkFont(size=16),
                text_color="#7F8C8D",
            ).pack(pady=40)
            return

        for topic in topics:
            total, reviewed = get_topic_progress(topic["id"])
            pct = (reviewed / total * 100) if total > 0 else 0

            card = ctk.CTkFrame(
                scroll,
                corner_radius=12,
                fg_color="white",
                cursor="hand2",
            )
            card.pack(fill="x", pady=6, ipady=12)

            info = ctk.CTkFrame(card, fg_color="transparent")
            info.pack(side="left", fill="x", expand=True, padx=(20, 10))

            ctk.CTkLabel(
                info,
                text=topic["name"],
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color="#2C3E50",
                anchor="w",
            ).pack(anchor="w", pady=(4, 2))

            status_text = f"{reviewed}/{total} 已掌握 ({pct:.0f}%)"
            color = "#52C41A" if pct == 100 else "#4A90D9"
            ctk.CTkLabel(
                info,
                text=status_text,
                font=ctk.CTkFont(size=12),
                text_color=color,
                anchor="w",
            ).pack(anchor="w")

            progress = ctk.CTkProgressBar(
                info, height=4, corner_radius=2,
                fg_color="#E8EDF2", progress_color=color,
            )
            progress.pack(fill="x", pady=(4, 4))
            progress.set(pct / 100)

            right = ctk.CTkFrame(card, fg_color="transparent")
            right.pack(side="right", padx=(5, 15))

            btn_color = "#52C41A" if pct == 100 else "#4A90D9"
            btn_text = "复习" if reviewed > 0 else "开始"
            ctk.CTkButton(
                right,
                text=btn_text,
                width=70,
                height=32,
                fg_color=btn_color,
                hover_color="#3A7BD5",
                font=ctk.CTkFont(size=13),
                command=lambda t=topic: self.app.show_cards(t),
            ).pack(side="right")

            card.bind(
                "<Button-1>",
                lambda e, t=topic: self.app.show_cards(t),
            )

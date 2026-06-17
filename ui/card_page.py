import customtkinter as ctk
from database.db import get_cards, log_review, get_topic_progress
from config import COLOR_SUCCESS, COLOR_DANGER, COLOR_PRIMARY


class CardPage(ctk.CTkFrame):
    def __init__(self, parent, app, topic):
        super().__init__(parent, fg_color="transparent")
        self.app = app
        self.topic = topic
        self.cards = get_cards(topic["id"])
        self.index = 0
        self.flipped = False
        self.results = []
        self.finished = False
        self._build_ui()

    def _build_ui(self):
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=30, pady=(20, 5))

        ctk.CTkButton(
            header, text="← 返回", width=80, height=32,
            fg_color="transparent", text_color="#4A90D9",
            hover_color="#EBF5FB", font=ctk.CTkFont(size=14),
            command=self._go_back,
        ).pack(side="left")

        ctk.CTkLabel(
            header, text=self.topic["name"],
            font=ctk.CTkFont(size=20, weight="bold"), text_color="#2C3E50",
        ).pack(side="left", padx=20)

        self.progress_label = ctk.CTkLabel(
            header, text="", font=ctk.CTkFont(size=14), text_color="#7F8C8D",
        )
        self.progress_label.pack(side="right")

        self.center = ctk.CTkFrame(self, fg_color="transparent")
        self.center.pack(expand=True, fill="both", padx=60)

        self.card_frame = ctk.CTkFrame(
            self.center, corner_radius=16, fg_color="white",
            border_width=0, cursor="hand2",
        )
        self.card_frame.pack(expand=True, fill="both", padx=20, pady=10)

        self.card_inner = ctk.CTkFrame(self.card_frame, fg_color="transparent")
        self.card_inner.place(relx=0.5, rely=0.5, anchor="center")

        self.card_text = ctk.CTkLabel(
            self.card_inner, text="",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color="#2C3E50", justify="center", wraplength=500,
        )
        self.card_text.pack(pady=(0, 15))

        self.flip_hint = ctk.CTkLabel(
            self.card_inner, text="点击卡片翻转",
            font=ctk.CTkFont(size=13), text_color="#BDC3C7",
        )
        self.flip_hint.pack()

        self.card_frame.bind("<Button-1>", lambda e: self._flip_card())
        self.card_text.bind("<Button-1>", lambda e: self._flip_card())
        self.flip_hint.bind("<Button-1>", lambda e: self._flip_card())

        self.btn_frame = ctk.CTkFrame(self.center, fg_color="transparent")
        self.btn_frame.pack(pady=(10, 25))

        self.btn_unknown = ctk.CTkButton(
            self.btn_frame, text="不认识", width=120, height=44,
            fg_color=COLOR_DANGER, hover_color="#E0434A",
            font=ctk.CTkFont(size=16, weight="bold"),
            corner_radius=22, command=lambda: self._answer(0),
        )
        self.btn_unknown.pack(side="left", padx=10)

        self.btn_know = ctk.CTkButton(
            self.btn_frame, text="认识", width=120, height=44,
            fg_color=COLOR_SUCCESS, hover_color="#45A814",
            font=ctk.CTkFont(size=16, weight="bold"),
            corner_radius=22, command=lambda: self._answer(1),
        )
        self.btn_know.pack(side="left", padx=10)

        self._show_card()

    def _show_card(self):
        if self.index >= len(self.cards):
            self._show_summary()
            return

        card = self.cards[self.index]
        self.flipped = False
        self.card_text.configure(text=card["front"], font=ctk.CTkFont(size=26, weight="bold"), text_color="#2C3E50")
        self.flip_hint.configure(text="点击卡片翻转")
        self.progress_label.configure(
            text=f"{self.index + 1} / {len(self.cards)}"
        )
        self.btn_unknown.configure(state="normal")
        self.btn_know.configure(state="normal")

    def _flip_card(self):
        if self.finished or self.index >= len(self.cards):
            return
        self.flipped = not self.flipped
        card = self.cards[self.index]
        if self.flipped:
            self.card_text.configure(
                text=card["back"],
                font=ctk.CTkFont(size=18),
                text_color="#34495E",
            )
            self.flip_hint.configure(text="点击查看正面")
        else:
            self.card_text.configure(
                text=card["front"],
                font=ctk.CTkFont(size=26, weight="bold"),
                text_color="#2C3E50",
            )
            self.flip_hint.configure(text="点击卡片翻转")

    def _answer(self, result):
        if self.finished:
            return
        card = self.cards[self.index]
        log_review(card["id"], result)
        self.results.append(result)
        self.index += 1
        if self.index >= len(self.cards):
            self._show_summary()
        else:
            self._show_card()

    def _show_summary(self):
        self.finished = True
        self.card_frame.configure(cursor="")
        self.card_inner.destroy()

        summary = ctk.CTkFrame(self.card_frame, fg_color="transparent")
        summary.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(
            summary, text="🎉 完成！",
            font=ctk.CTkFont(size=32, weight="bold"), text_color="#2C3E50",
        ).pack(pady=(0, 5))

        known = sum(self.results)
        unknown = len(self.results) - known
        total = len(self.results)
        pct = (known / total * 100) if total > 0 else 0

        ctk.CTkLabel(
            summary, text=f"共 {total} 张卡片",
            font=ctk.CTkFont(size=16), text_color="#7F8C8D",
        ).pack(pady=5)

        ctk.CTkLabel(
            summary, text=f"认识 {known}  不认识 {unknown}",
            font=ctk.CTkFont(size=16), text_color="#7F8C8D",
        ).pack(pady=2)

        progress = ctk.CTkProgressBar(
            summary, height=8, corner_radius=4,
            fg_color="#FFE0E0", progress_color=COLOR_SUCCESS,
        )
        progress.pack(fill="x", padx=30, pady=(10, 5))
        progress.set(pct / 100)

        ctk.CTkLabel(
            summary, text=f"掌握率 {pct:.0f}%",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLOR_SUCCESS if pct >= 60 else COLOR_DANGER,
        ).pack(pady=(0, 15))

        btn_row = ctk.CTkFrame(summary, fg_color="transparent")
        btn_row.pack(pady=10)

        ctk.CTkButton(
            btn_row, text="重新背诵", width=120, height=40,
            fg_color=COLOR_PRIMARY, hover_color="#3A7BD5",
            font=ctk.CTkFont(size=14), corner_radius=20,
            command=self._restart,
        ).pack(side="left", padx=8)

        ctk.CTkButton(
            btn_row, text="返回章节", width=120, height=40,
            fg_color="#E8EDF2", text_color="#2C3E50",
            hover_color="#D0D5DD", font=ctk.CTkFont(size=14),
            corner_radius=20, command=self._go_back,
        ).pack(side="left", padx=8)

        self.btn_frame.pack_forget()

    def _restart(self):
        self.finished = False
        self.index = 0
        self.results = []
        self.card_frame.configure(cursor="hand2")
        self.card_inner = ctk.CTkFrame(self.card_frame, fg_color="transparent")
        self.card_inner.place(relx=0.5, rely=0.5, anchor="center")
        self.card_text = ctk.CTkLabel(
            self.card_inner, text="",
            font=ctk.CTkFont(size=24, weight="bold"),
            text_color="#2C3E50", justify="center", wraplength=500,
        )
        self.card_text.pack(pady=(0, 15))
        self.flip_hint = ctk.CTkLabel(
            self.card_inner, text="点击卡片翻转",
            font=ctk.CTkFont(size=13), text_color="#BDC3C7",
        )
        self.flip_hint.pack()
        self.card_frame.bind("<Button-1>", lambda e: self._flip_card())
        self.card_text.bind("<Button-1>", lambda e: self._flip_card())
        self.flip_hint.bind("<Button-1>", lambda e: self._flip_card())
        self.btn_frame.pack(pady=(10, 25))
        self._show_card()

    def _go_back(self):
        self.app.show_topics(self.app.current_subject)

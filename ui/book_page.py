import customtkinter as ctk
from database.db import get_books, get_book_progress
from config import COLOR_TEXT, COLOR_TEXT_SUB, COLOR_PRIMARY


class BookPage(ctk.CTkFrame):
    def __init__(self, parent, app, subject):
        super().__init__(parent, fg_color="#F2F3F7", corner_radius=0)
        self.app = app
        self.subject = subject
        self._build()

    def _build(self):
        top = ctk.CTkFrame(self, fg_color="transparent")
        top.pack(fill="x", padx=20, pady=(36, 10))

        ctk.CTkLabel(
            top, text="‹ 返回",
            font=ctk.CTkFont(size=15),
            text_color=COLOR_PRIMARY, cursor="hand2",
        ).pack(side="left")
        top.winfo_children()[0].bind(
            "<Button-1>", lambda e: self.app._show_review()
        )

        ctk.CTkLabel(
            top, text=self.subject["display_name"],
            font=ctk.CTkFont(size=20, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(side="left", padx=16)

        ctk.CTkLabel(
            self, text="选择词书",
            font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB,
        ).pack(padx=24, anchor="w")

        scroll = ctk.CTkScrollableFrame(
            self, fg_color="transparent",
            scrollbar_button_color="#D1D1D6",
        )
        scroll.pack(fill="both", expand=True, padx=20, pady=5)

        books = get_books(self.subject["id"])
        for b in books:
            total, reviewed = get_book_progress(b["id"])
            pct = (reviewed / total * 100) if total > 0 else 0

            card = ctk.CTkFrame(
                scroll, fg_color="white", corner_radius=14,
                cursor="hand2", height=80,
            )
            card.pack(fill="x", pady=5)
            card.pack_propagate(False)

            inner = ctk.CTkFrame(card, fg_color="transparent")
            inner.pack(fill="both", expand=True, padx=18, pady=10)

            left = ctk.CTkFrame(inner, fg_color="transparent")
            left.pack(side="left", fill="x", expand=True)

            ctk.CTkLabel(
                left, text=b["name"],
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color=COLOR_TEXT, anchor="w",
            ).pack(anchor="w")

            ctk.CTkLabel(
                left,
                text=f"{'📚 ' if total == 0 else ''}共 {total} 张 · 已掌握 {reviewed} ({pct:.0f}%)",
                font=ctk.CTkFont(size=12),
                text_color=COLOR_TEXT_SUB, anchor="w",
            ).pack(anchor="w", pady=(2, 0))

            arrow = ctk.CTkLabel(
                inner, text="›",
                font=ctk.CTkFont(size=24, weight="bold"),
                text_color="#C7C7CC",
            )
            arrow.pack(side="right", padx=(5, 0))

            card.bind("<Button-1>", lambda e, bk=b: self.app._show_topics(bk))
            for ch in card.winfo_children():
                ch.bind("<Button-1>", lambda e, bk=b: self.app._show_topics(bk))
                for sub in ch.winfo_children():
                    sub.bind("<Button-1>", lambda e, bk=b: self.app._show_topics(bk))

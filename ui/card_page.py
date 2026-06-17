import customtkinter as ctk
import threading
from database.db import get_cards, log_review
from config import COLOR_TEXT, COLOR_TEXT_SUB, COLOR_PRIMARY, COLOR_SUCCESS, COLOR_DANGER


class CardPage(ctk.CTkFrame):
    def __init__(self, parent, app, topic, subject=None, book=None):
        super().__init__(parent, fg_color="#F2F3F7", corner_radius=0)
        self.app = app
        self.topic = topic
        self.subject = subject
        self.book = book
        self.cards = get_cards(topic["id"])
        self.idx = 0
        self.flipped = False
        self.results = []
        self.finished = False

        if not self.cards:
            self._show_empty()
            return
        self._build()

    def _speak(self, text):
        if not text:
            return
        threading.Thread(target=self._do_speak, args=(text,), daemon=True).start()

    def _do_speak(self, text):
        try:
            import pythoncom
            from win32com.client import Dispatch
            pythoncom.CoInitialize()
            engine = Dispatch("SAPI.SpVoice")
            for v in engine.GetVoices():
                name = v.GetDescription().lower()
                if "zira" in name or "english" in name:
                    engine.Voice = v
                    break
            engine.Rate = 1
            engine.Speak(text, 1)
        except Exception:
            pass

    def _build(self):
        top = ctk.CTkFrame(self, fg_color="transparent")
        top.pack(fill="x", padx=20, pady=(36, 0))

        back_lbl = ctk.CTkLabel(
            top, text="‹ 返回",
            font=ctk.CTkFont(size=15),
            text_color=COLOR_PRIMARY, cursor="hand2",
        )
        back_lbl.pack(side="left")
        back_lbl.bind("<Button-1>", lambda e, app=self.app, bk=self.book or self.app.current_book: app._show_topics(bk))

        ctk.CTkLabel(
            top, text=self.topic["name"],
            font=ctk.CTkFont(size=16, weight="bold"),
            text_color=COLOR_TEXT,
        ).pack(side="left", padx=12)

        self.prog_lbl = ctk.CTkLabel(
            top, text="", font=ctk.CTkFont(size=13),
            text_color=COLOR_TEXT_SUB,
        )
        self.prog_lbl.pack(side="right")

        self.bar = ctk.CTkProgressBar(
            self, height=4, corner_radius=2,
            fg_color="#E8EDF2", progress_color=COLOR_PRIMARY,
        )
        self.bar.pack(fill="x", padx=20, pady=(8, 0))

        self.center = ctk.CTkFrame(self, fg_color="transparent")
        self.center.pack(expand=True, fill="both", padx=20, pady=10)

        self.card = ctk.CTkFrame(
            self.center, fg_color="white", corner_radius=20,
            cursor="hand2",
        )
        self.card.pack(expand=True, fill="both")
        self._build_card_inner()

        self.btn_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.btn_frame.pack(pady=(6, 28))

        self.btn_unknown = ctk.CTkButton(
            self.btn_frame, text="不认识", width=130, height=48,
            fg_color=COLOR_DANGER, font=ctk.CTkFont(size=15, weight="bold"),
            corner_radius=24, command=lambda: self._answer(0),
        )
        self.btn_unknown.pack(side="left", padx=8)

        self.btn_known = ctk.CTkButton(
            self.btn_frame, text="认识", width=130, height=48,
            fg_color=COLOR_SUCCESS, font=ctk.CTkFont(size=15, weight="bold"),
            corner_radius=24, command=lambda: self._answer(1),
        )
        self.btn_known.pack(side="left", padx=8)

        self._show_card()

    def _build_card_inner(self):
        self.inner = ctk.CTkFrame(self.card, fg_color="transparent")
        self.inner.place(relx=0.5, rely=0.5, anchor="center")

        self.word_lbl = ctk.CTkLabel(
            self.inner, text="",
            font=ctk.CTkFont(size=30, weight="bold"),
            text_color="#1A1A2E", justify="center",
        )
        self.word_lbl.pack(pady=(10, 4))

        self.phonetic_lbl = ctk.CTkLabel(
            self.inner, text="",
            font=ctk.CTkFont(size=15),
            text_color="#8E8E93", justify="center",
        )
        self.phonetic_lbl.pack(pady=(0, 8))

        is_english = self.subject and self.subject.get("name") == "english"
        if is_english:
            self.speak_btn = ctk.CTkLabel(
                self.inner, text="🔊 点击朗读",
                font=ctk.CTkFont(size=16, weight="bold"),
                text_color=COLOR_PRIMARY, cursor="hand2",
            )
            self.speak_btn.pack(pady=(0, 12))
            self.speak_btn.bind("<Button-1>", lambda e: self._speak(self.current_word()))

        self.def_lbl = ctk.CTkLabel(
            self.inner, text="",
            font=ctk.CTkFont(size=16),
            text_color="#2C3E50", justify="center",
            wraplength=320,
        )
        self.def_lbl.pack(pady=(0, 4))

        self.example_lbl = ctk.CTkLabel(
            self.inner, text="",
            font=ctk.CTkFont(size=13),
            text_color="#8E8E93", justify="center",
            wraplength=320,
        )
        self.example_lbl.pack(pady=(0, 10))

        self.flip_hint = ctk.CTkLabel(
            self.inner, text="点击卡片查看详情",
            font=ctk.CTkFont(size=12),
            text_color="#C7C7CC",
        )
        self.flip_hint.pack(pady=(0, 4))

        self.card.bind("<Button-1>", lambda e: self._flip())
        for w in [self.word_lbl, self.def_lbl, self.example_lbl, self.flip_hint]:
            w.bind("<Button-1>", lambda e: self._flip())

    def current_word(self):
        if self.idx < len(self.cards):
            return self.cards[self.idx]["front"]
        return ""

    def _show_card(self):
        if self.idx >= len(self.cards):
            self._summary()
            return
        c = self.cards[self.idx]
        self.flipped = False
        self._set_content(c["front"], c.get("phonetic", ""), c["back"], c.get("example", ""))
        self.prog_lbl.configure(text=f"{self.idx + 1}/{len(self.cards)}")
        self.bar.set((self.idx) / len(self.cards))
        self.btn_unknown.configure(state="normal")
        self.btn_known.configure(state="normal")

    def _set_content(self, word, phonetic, definition, example):
        self.word_lbl.configure(text=word)
        self.phonetic_lbl.configure(text=phonetic)
        self.def_lbl.configure(text=definition)
        self.example_lbl.configure(text=f"📝 {example}" if example else "")
        self.flip_hint.configure(text="点击卡片翻转")

    def _flip(self):
        if self.finished or self.idx >= len(self.cards):
            return
        self.flipped = not self.flipped
        c = self.cards[self.idx]
        if self.flipped:
            self.def_lbl.configure(text=c.get("back_detail", c["back"]), font=ctk.CTkFont(size=14), text_color="#2C3E50")
            self.example_lbl.configure(text=f"📝 {c.get('example', '')}" if c.get("example") else "")
            self.flip_hint.configure(text="点击查看单词")
            self.word_lbl.configure(font=ctk.CTkFont(size=22, weight="bold"))
        else:
            self._set_content(c["front"], c.get("phonetic", ""), c["back"], c.get("example", ""))
            self.word_lbl.configure(font=ctk.CTkFont(size=30, weight="bold"))

    def _answer(self, result):
        if self.finished:
            return
        log_review(self.cards[self.idx]["id"], result)
        self.results.append(result)
        self.idx += 1
        self._show_card()

    def _summary(self):
        self.finished = True
        self.card.configure(cursor="")
        self.inner.destroy()
        self.btn_frame.pack_forget()

        s = ctk.CTkFrame(self.card, fg_color="transparent")
        s.place(relx=0.5, rely=0.5, anchor="center")

        ctk.CTkLabel(
            s, text="🎉 完成！",
            font=ctk.CTkFont(size=30, weight="bold"),
            text_color="#1A1A2E",
        ).pack(pady=(0, 4))

        known = sum(self.results)
        total = len(self.results)
        pct = (known / total * 100) if total else 0

        for t, v in [(f"共 {total} 张卡片", "#8E8E93"), (f"认识 {known}  不认识 {total - known}", "#8E8E93")]:
            ctk.CTkLabel(s, text=t, font=ctk.CTkFont(size=14), text_color=v).pack()

        bar = ctk.CTkProgressBar(
            s, height=6, corner_radius=3,
            fg_color="#FFE0E0", progress_color=COLOR_SUCCESS,
        )
        bar.pack(fill="x", padx=24, pady=(8, 4))
        bar.set(pct / 100)

        ctk.CTkLabel(
            s, text=f"掌握率 {pct:.0f}%",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color=COLOR_SUCCESS if pct >= 60 else COLOR_DANGER,
        ).pack(pady=(0, 16))

        row = ctk.CTkFrame(s, fg_color="transparent")
        row.pack()
        ctk.CTkButton(
            row, text="再来一次", width=110, height=40,
            fg_color=COLOR_PRIMARY, corner_radius=20,
            font=ctk.CTkFont(size=14), command=self._restart,
        ).pack(side="left", padx=5)
        ctk.CTkButton(
            row, text="返回", width=110, height=40,
            fg_color="#E8EDF2", text_color="#1A1A2E",
            corner_radius=20, font=ctk.CTkFont(size=14),
            command=lambda: self.app._show_topics(self.book or self.app.current_book),
        ).pack(side="left", padx=5)

    def _restart(self):
        self.finished = False
        self.idx = 0
        self.results = []
        self.card.configure(cursor="hand2")
        self._build_card_inner()
        self.btn_frame.pack(pady=(6, 28))
        self._show_card()

    def _show_empty(self):
        ctk.CTkLabel(
            self, text="此章节暂无卡片",
            font=ctk.CTkFont(size=18), text_color=COLOR_TEXT_SUB,
        ).pack(expand=True)

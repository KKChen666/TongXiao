import customtkinter as ctk
from config import APP_TITLE, APP_W, APP_H, COLOR_PRIMARY, COLOR_NAV_INACTIVE
from database.db import init_db
from database.seed import seed_data
from ui.subject_page import SubjectPage
from ui.book_page import BookPage
from ui.topic_page import TopicPage
from ui.card_page import CardPage
from ui.import_page import ImportPage
from ui.profile_page import ProfilePage


class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry(f"{APP_W}x{APP_H}")
        self.resizable(False, False)

        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("blue")

        init_db()
        seed_data()

        self.tab = "review"
        self.nav_stack = []

        self.container = ctk.CTkFrame(self, fg_color="#F2F3F7", corner_radius=0)
        self.container.pack(fill="both", expand=True)

        self.bottom_bar = ctk.CTkFrame(self, fg_color="white", height=56, corner_radius=0)
        self.bottom_bar.pack(fill="x", side="bottom")
        self.bottom_bar.pack_propagate(False)

        self._nav_btns = {}
        tabs = [
            ("review", "📖", "背诵"),
            ("import", "📥", "导入"),
            ("profile", "👤", "我的"),
        ]
        for key, icon, label in tabs:
            f = ctk.CTkFrame(self.bottom_bar, fg_color="transparent")
            f.pack(side="left", expand=True, fill="both")
            btn = ctk.CTkLabel(
                f, text=f"{icon}\n{label}",
                font=ctk.CTkFont(size=11),
                text_color=COLOR_PRIMARY if key == "review" else COLOR_NAV_INACTIVE,
                cursor="hand2",
            )
            btn.pack(expand=True)
            btn.bind("<Button-1>", lambda e, k=key: self._switch_tab(k))
            self._nav_btns[key] = btn

        self._show_review()

    def _switch_tab(self, tab):
        if tab == self.tab:
            if tab == "review":
                self._show_review()
            return
        self.tab = tab
        self.nav_stack.clear()
        for k, btn in self._nav_btns.items():
            btn.configure(text_color=COLOR_PRIMARY if k == tab else COLOR_NAV_INACTIVE)
        if tab == "review":
            self._show_review()
        elif tab == "import":
            self._show_import()
        elif tab == "profile":
            self._show_profile()

    def _clear(self):
        for w in self.container.winfo_children():
            w.destroy()

    def _show_review(self):
        self._clear()
        self.bottom_bar.pack(fill="x", side="bottom")
        self.current_subject = None
        self.current_book = None
        SubjectPage(self.container, self).pack(fill="both", expand=True)

    def _show_books(self, subject):
        self._clear()
        self.bottom_bar.pack(fill="x", side="bottom")
        self.current_subject = subject
        self.current_book = None
        BookPage(self.container, self, subject).pack(fill="both", expand=True)

    def _show_topics(self, book):
        self._clear()
        self.bottom_bar.pack(fill="x", side="bottom")
        self.current_book = book
        TopicPage(self.container, self, book).pack(fill="both", expand=True)

    def _show_cards(self, topic, book=None):
        self._clear()
        self.bottom_bar.pack_forget()
        sub = None
        if self.current_subject:
            sub = self.current_subject
        elif book:
            from database.db import get_subjects
            subs = get_subjects()
            for s in subs:
                if s["id"] == book["subject_id"]:
                    sub = s
                    break
        CardPage(self.container, self, topic, sub, book).pack(fill="both", expand=True)

    def _show_import(self):
        self._clear()
        self.bottom_bar.pack(fill="x", side="bottom")
        ImportPage(self.container, self).pack(fill="both", expand=True)

    def _show_profile(self):
        self._clear()
        self.bottom_bar.pack(fill="x", side="bottom")
        ProfilePage(self.container, self).pack(fill="both", expand=True)

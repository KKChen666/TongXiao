import customtkinter as ctk
from config import APP_TITLE, APP_SIZE, MIN_APP_SIZE
from database.db import init_db
from database.seed import seed_data
from ui.subject_page import SubjectPage
from ui.topic_page import TopicPage
from ui.card_page import CardPage


class App(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry(APP_SIZE)
        self.minsize(*MIN_APP_SIZE)

        ctk.set_appearance_mode("light")
        ctk.set_default_color_theme("blue")

        init_db()
        seed_data()

        self.container = ctk.CTkFrame(self, fg_color="transparent")
        self.container.pack(fill="both", expand=True)

        self.pages = {}
        self.current_page = None
        self.current_subject = None
        self.current_topic = None

        self.show_subjects()

    def clear_container(self):
        for widget in self.container.winfo_children():
            widget.destroy()
        self.current_page = None

    def show_subjects(self):
        self.clear_container()
        self.current_subject = None
        self.current_topic = None
        page = SubjectPage(self.container, self)
        page.pack(fill="both", expand=True)
        self.current_page = page

    def show_topics(self, subject):
        self.clear_container()
        self.current_subject = subject
        self.current_topic = None
        page = TopicPage(self.container, self, subject)
        page.pack(fill="both", expand=True)
        self.current_page = page

    def show_cards(self, topic):
        self.clear_container()
        self.current_topic = topic
        page = CardPage(self.container, self, topic)
        page.pack(fill="both", expand=True)
        self.current_page = page

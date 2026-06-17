from database.db import init_db, get_subjects, get_topics, get_cards
from database.seed import seed_data

seed_data()

for s in get_subjects():
    print(f"Subject: id={s['id']}, name={s['name']}, display={s['display_name']}")
    for t in get_topics(s["id"]):
        cards = get_cards(t["id"])
        print(f"  Topic: id={t['id']}, name={t['name']}, cards={len(cards)}")
        if cards:
            print(f"    First: {cards[0]['front']}")

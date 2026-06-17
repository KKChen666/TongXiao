from database.db import init_db, get_subjects, get_topics, get_cards, get_subject_progress, get_topic_progress
from database.seed import seed_data

seed_data()
subjects = get_subjects()
print("Subjects:", [(s["id"], s["display_name"]) for s in subjects])

for s in subjects:
    total, rev = get_subject_progress(s["id"])
    print(f"  {s['display_name']}: {rev}/{total}")
    topics = get_topics(s["id"])
    for t in topics:
        total2, rev2 = get_topic_progress(t["id"])
        print(f"    {t['name']}: {rev2}/{total2}")

cards = get_cards(1)
print(f"\nFirst topic cards: {len(cards)}")
if cards:
    print(f"  First card: {cards[0]['front']} -> {cards[0]['back'][:30]}...")
print("DB test passed!")

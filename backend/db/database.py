"""
Database initialization and data seeding routines
"""

from backend.db.repository import get_repository
from backend.ml.pipeline import get_model

def init_and_seed_database():
    """
    Initializes repository and seeds historical scored patients and
    initial top-10 nurse notes if the database is unseeded.
    """
    repo = get_repository()
    if not repo.is_seeded():
        model = get_model()
        scored_records = model.historical_predictions.to_dict(orient="records")
        repo.seed_initial_patients(scored_records)
        print(f"Database seeded with {len(scored_records)} patients and top-10 nurse notes.")
    else:
        print("Database already contains data; seeding skipped to preserve user edits.")

if __name__ == "__main__":
    init_and_seed_database()

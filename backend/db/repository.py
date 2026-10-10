"""
MediSense Database Repository
Provides durable persistence for patient records, screening outcomes,
and nurse follow-up notes with approval workflow states.
Supports local SQLite and hosted libSQL/Turso compatibility.
"""

import os
import json
import sqlite3
import datetime
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path

from backend.config import SQLITE_DB_PATH, IS_HOSTED_DB, IS_DEMO_MODE, DEMO_STORAGE_NOTICE
from backend.schemas.models import (
    PatientRecord,
    RiskFactorDetail,
    NurseNoteUpdate,
    TopNurseNote
)

class MediSenseRepository:
    def __init__(self, db_path: str = SQLITE_DB_PATH):
        self.db_path = db_path
        # Ensure parent directory exists
        Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_db(self):
        """
        Creates schema tables if they do not exist.
        """
        with self._get_connection() as conn:
            cursor = conn.cursor()

            # Patients table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS patients (
                    id INTEGER PRIMARY KEY,
                    patient_code TEXT UNIQUE,
                    pregnancies INTEGER,
                    glucose REAL,
                    blood_pressure REAL,
                    skin_thickness REAL,
                    insulin REAL,
                    bmi REAL,
                    diabetes_pedigree_function REAL,
                    age INTEGER,
                    outcome INTEGER,
                    estimated_risk REAL,
                    risk_band TEXT,
                    queue_rank INTEGER,
                    is_in_callback_queue INTEGER,
                    is_historical INTEGER,
                    top_factors_json TEXT,
                    recommended_action TEXT,
                    created_at TEXT
                )
            """)

            # Nurse notes & approval status
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS nurse_notes (
                    patient_id INTEGER PRIMARY KEY,
                    patient_code TEXT,
                    note_text TEXT,
                    review_status TEXT,
                    approval_status TEXT,
                    reviewed_by TEXT,
                    updated_at TEXT,
                    FOREIGN KEY(patient_id) REFERENCES patients(id)
                )
            """)

            # Screening submissions table (new patient screenings)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS new_screenings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    patient_id TEXT,
                    pregnancies INTEGER,
                    glucose REAL,
                    blood_pressure REAL,
                    skin_thickness REAL,
                    insulin REAL,
                    bmi REAL,
                    diabetes_pedigree_function REAL,
                    age INTEGER,
                    estimated_risk REAL,
                    risk_band TEXT,
                    top_factors_json TEXT,
                    recommended_action TEXT,
                    suggested_nurse_note TEXT,
                    approval_status TEXT,
                    created_at TEXT
                )
            """)
            conn.commit()

    def is_seeded(self) -> bool:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM patients")
            count = cursor.fetchone()[0]
            return count > 0

    def seed_initial_patients(self, scored_records: List[Dict[str, Any]]):
        """
        Safely seeds historical dataset and top-10 nurse notes if table is empty.
        """
        if self.is_seeded():
            return

        with self._get_connection() as conn:
            cursor = conn.cursor()
            now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            for rec in scored_records:
                cursor.execute("""
                    INSERT INTO patients (
                        id, patient_code, pregnancies, glucose, blood_pressure,
                        skin_thickness, insulin, bmi, diabetes_pedigree_function,
                        age, outcome, estimated_risk, risk_band, queue_rank,
                        is_in_callback_queue, is_historical, top_factors_json,
                        recommended_action, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    rec["patient_id"],
                    rec["patient_code"],
                    rec["pregnancies"],
                    rec["glucose"],
                    rec["blood_pressure"],
                    rec["skin_thickness"],
                    rec["insulin"],
                    rec["bmi"],
                    rec["diabetes_pedigree_function"],
                    rec["age"],
                    rec["outcome"],
                    rec["estimated_risk"],
                    rec["risk_band"],
                    rec["queue_rank"],
                    1 if rec.get("is_in_callback_queue", False) else 0,
                    1 if rec.get("is_historical", True) else 0,
                    json.dumps([f.model_dump() for f in rec["top_factors"]]),
                    rec["recommended_action"],
                    now_str
                ))

                # If this record has a nurse note (top 10), seed note table
                if rec.get("nurse_note"):
                    cursor.execute("""
                        INSERT INTO nurse_notes (
                            patient_id, patient_code, note_text, review_status,
                            approval_status, reviewed_by, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (
                        rec["patient_id"],
                        rec["patient_code"],
                        rec["nurse_note"],
                        rec.get("review_status", "Pending"),
                        rec.get("approval_status", "PENDING_APPROVAL"),
                        "Clinical Support Nurse",
                        now_str
                    ))

            conn.commit()

    def get_patients(
        self,
        page: int = 1,
        page_size: int = 20,
        search: Optional[str] = None,
        risk_band: Optional[str] = None,
        callback_only: bool = False,
        sort_by: str = "queue_rank",
        sort_order: str = "ASC"
    ) -> Tuple[List[PatientRecord], int]:
        with self._get_connection() as conn:
            cursor = conn.cursor()

            query = """
                SELECT p.*, n.note_text, n.review_status, n.approval_status, n.reviewed_by, n.updated_at
                FROM patients p
                LEFT JOIN nurse_notes n ON p.id = n.patient_id
                WHERE 1=1
            """
            params = []

            if callback_only:
                query += " AND p.is_in_callback_queue = 1"

            if search:
                query += " AND (p.patient_code LIKE ? OR CAST(p.id AS TEXT) LIKE ?)"
                params.extend([f"%{search}%", f"%{search}%"])

            if risk_band:
                query += " AND p.risk_band = ?"
                params.append(risk_band)

            # Count total matching
            count_query = f"SELECT COUNT(*) FROM ({query})"
            cursor.execute(count_query, params)
            total = cursor.fetchone()[0]

            # Sorting validation
            allowed_sort = ["queue_rank", "estimated_risk", "glucose", "bmi", "age", "id"]
            if sort_by not in allowed_sort:
                sort_by = "queue_rank"
            order = "DESC" if sort_order.upper() == "DESC" else "ASC"

            query += f" ORDER BY p.{sort_by} {order} LIMIT ? OFFSET ?"
            params.extend([page_size, (page - 1) * page_size])

            cursor.execute(query, params)
            rows = cursor.fetchall()

            patients = []
            for r in rows:
                factors_raw = json.loads(r["top_factors_json"]) if r["top_factors_json"] else []
                factors = [RiskFactorDetail(**f) for f in factors_raw]

                patients.append(PatientRecord(
                    id=r["id"],
                    patient_code=r["patient_code"],
                    pregnancies=r["pregnancies"],
                    glucose=r["glucose"],
                    blood_pressure=r["blood_pressure"],
                    skin_thickness=r["skin_thickness"],
                    insulin=r["insulin"],
                    bmi=r["bmi"],
                    diabetes_pedigree_function=r["diabetes_pedigree_function"],
                    age=r["age"],
                    outcome=r["outcome"],
                    estimated_risk=r["estimated_risk"],
                    risk_band=r["risk_band"],
                    queue_rank=r["queue_rank"],
                    is_in_callback_queue=bool(r["is_in_callback_queue"]),
                    is_historical=bool(r["is_historical"]),
                    top_factors=factors,
                    recommended_action=r["recommended_action"],
                    nurse_note=r["note_text"],
                    review_status=r["review_status"] or "Pending",
                    approval_status=r["approval_status"] or "PENDING_APPROVAL",
                    reviewed_by=r["reviewed_by"],
                    updated_at=r["updated_at"]
                ))

            return patients, total

    def get_patient_by_id(self, patient_id: int) -> Optional[PatientRecord]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.*, n.note_text, n.review_status, n.approval_status, n.reviewed_by, n.updated_at
                FROM patients p
                LEFT JOIN nurse_notes n ON p.id = n.patient_id
                WHERE p.id = ?
            """, (patient_id,))
            r = cursor.fetchone()
            if not r:
                return None

            factors_raw = json.loads(r["top_factors_json"]) if r["top_factors_json"] else []
            factors = [RiskFactorDetail(**f) for f in factors_raw]

            return PatientRecord(
                id=r["id"],
                patient_code=r["patient_code"],
                pregnancies=r["pregnancies"],
                glucose=r["glucose"],
                blood_pressure=r["blood_pressure"],
                skin_thickness=r["skin_thickness"],
                insulin=r["insulin"],
                bmi=r["bmi"],
                diabetes_pedigree_function=r["diabetes_pedigree_function"],
                age=r["age"],
                outcome=r["outcome"],
                estimated_risk=r["estimated_risk"],
                risk_band=r["risk_band"],
                queue_rank=r["queue_rank"],
                is_in_callback_queue=bool(r["is_in_callback_queue"]),
                is_historical=bool(r["is_historical"]),
                top_factors=factors,
                recommended_action=r["recommended_action"],
                nurse_note=r["note_text"],
                review_status=r["review_status"] or "Pending",
                approval_status=r["approval_status"] or "PENDING_APPROVAL",
                reviewed_by=r["reviewed_by"],
                updated_at=r["updated_at"]
            )

    def get_top_nurse_notes(self) -> List[TopNurseNote]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT p.id, p.patient_code, p.queue_rank, p.estimated_risk, p.risk_band,
                       p.glucose, p.bmi, p.age, p.top_factors_json,
                       n.note_text, n.review_status, n.approval_status, n.reviewed_by, n.updated_at
                FROM patients p
                JOIN nurse_notes n ON p.id = n.patient_id
                ORDER BY p.queue_rank ASC
                LIMIT 10
            """)
            rows = cursor.fetchall()

            notes = []
            for r in rows:
                factors_raw = json.loads(r["top_factors_json"]) if r["top_factors_json"] else []
                factors = [RiskFactorDetail(**f) for f in factors_raw]

                notes.append(TopNurseNote(
                    patient_id=r["id"],
                    patient_code=r["patient_code"],
                    queue_rank=r["queue_rank"],
                    estimated_risk=r["estimated_risk"],
                    risk_band=r["risk_band"],
                    glucose=r["glucose"],
                    bmi=r["bmi"],
                    age=r["age"],
                    note_text=r["note_text"] or "",
                    review_status=r["review_status"] or "Pending",
                    approval_status=r["approval_status"] or "PENDING_APPROVAL",
                    top_factors=factors,
                    reviewed_by=r["reviewed_by"],
                    updated_at=r["updated_at"]
                ))
            return notes

    def update_nurse_note(self, patient_id: int, update: NurseNoteUpdate) -> Optional[TopNurseNote]:
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT patient_code FROM patients WHERE id = ?", (patient_id,))
            p_row = cursor.fetchone()
            if not p_row:
                return None
            patient_code = p_row["patient_code"]

            cursor.execute("SELECT * FROM nurse_notes WHERE patient_id = ?", (patient_id,))
            existing = cursor.fetchone()

            now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

            if existing:
                note_text = update.note_text if update.note_text is not None else existing["note_text"]
                review_status = update.review_status if update.review_status is not None else existing["review_status"]
                approval_status = update.approval_status if update.approval_status is not None else existing["approval_status"]
                reviewed_by = update.reviewed_by if update.reviewed_by is not None else existing["reviewed_by"]

                cursor.execute("""
                    UPDATE nurse_notes
                    SET note_text = ?, review_status = ?, approval_status = ?, reviewed_by = ?, updated_at = ?
                    WHERE patient_id = ?
                """, (note_text, review_status, approval_status, reviewed_by, now_str, patient_id))
            else:
                cursor.execute("""
                    INSERT INTO nurse_notes (
                        patient_id, patient_code, note_text, review_status,
                        approval_status, reviewed_by, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    patient_id,
                    patient_code,
                    update.note_text or "",
                    update.review_status or "Pending",
                    update.approval_status or "PENDING_APPROVAL",
                    update.reviewed_by or "Staff Nurse",
                    now_str
                ))
            conn.commit()

        notes = self.get_top_nurse_notes()
        for n in notes:
            if n.patient_id == patient_id:
                return n
        return None

    def record_new_screening(self, screening_data: Dict[str, Any]):
        with self._get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO new_screenings (
                    patient_id, pregnancies, glucose, blood_pressure, skin_thickness,
                    insulin, bmi, diabetes_pedigree_function, age, estimated_risk,
                    risk_band, top_factors_json, recommended_action, suggested_nurse_note,
                    approval_status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                screening_data["patient_id"],
                screening_data["pregnancies"],
                screening_data["glucose"],
                screening_data["blood_pressure"],
                screening_data["skin_thickness"],
                screening_data["insulin"],
                screening_data["bmi"],
                screening_data["diabetes_pedigree_function"],
                screening_data["age"],
                screening_data["estimated_risk_probability"],
                screening_data["risk_band"],
                json.dumps([f.model_dump() for f in screening_data["top_risk_factors"]]),
                screening_data["recommended_action"],
                screening_data["suggested_nurse_note"],
                screening_data["approval_status"],
                screening_data["created_at"]
            ))
            conn.commit()


_repo_instance = None

def get_repository() -> MediSenseRepository:
    global _repo_instance
    if _repo_instance is None:
        _repo_instance = MediSenseRepository()
    return _repo_instance

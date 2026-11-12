import sqlite3
import unittest
from pathlib import Path

MIGRATION = Path(__file__).resolve().parents[1] / "migrations" / "0001_create_certificates.sql"


class CertificateMigrationTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(":memory:")
        self.db.executescript(MIGRATION.read_text(encoding="utf-8"))

    def tearDown(self):
        self.db.close()

    def test_creates_empty_registry_without_demo_records(self):
        count = self.db.execute("SELECT COUNT(*) FROM certificates").fetchone()[0]
        self.assertEqual(count, 0)

    def test_accepts_active_certificate(self):
        self.db.execute(
            """INSERT INTO certificates
               (certificate_number, holder_name, program_name, issue_date, issuer, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            ("ALB-2026-0001", "متدرب", "برنامج", "2026-10-01", "مركز العبقري", "active"),
        )
        row = self.db.execute(
            "SELECT status FROM certificates WHERE certificate_number = ?",
            ("ALB-2026-0001",),
        ).fetchone()
        self.assertEqual(row[0], "active")

    def test_rejects_unknown_status(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                """INSERT INTO certificates
                   (certificate_number, holder_name, program_name, issue_date, issuer, status)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                ("ALB-2026-0002", "متدرب", "برنامج", "2026-10-01", "مركز العبقري", "pending"),
            )

    def test_certificate_number_is_unique(self):
        values = ("ALB-2026-0003", "متدرب", "برنامج", "2026-10-01", "مركز العبقري", "active")
        self.db.execute(
            """INSERT INTO certificates
               (certificate_number, holder_name, program_name, issue_date, issuer, status)
               VALUES (?, ?, ?, ?, ?, ?)""",
            values,
        )
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute(
                """INSERT INTO certificates
                   (certificate_number, holder_name, program_name, issue_date, issuer, status)
                   VALUES (?, ?, ?, ?, ?, ?)""",
                values,
            )


if __name__ == "__main__":
    unittest.main(verbosity=2)

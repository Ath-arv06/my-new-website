import sqlite3
import json
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import DB_PATH
from app.core.logging import logger, get_utc_timestamp

def get_db_connection() -> sqlite3.Connection:
    """Return an active SQLite connection with row dict access and FK enforcement."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    """Initialize database tables strictly adhering to PDF 1 & PDF 2 schemas."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Documents Table (PDF 1 Section 1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS documents (
        document_id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        document_type TEXT NOT NULL,
        image_path TEXT NOT NULL,
        sha256 TEXT UNIQUE NOT NULL,
        mime_type TEXT NOT NULL,
        source TEXT NOT NULL,
        ground_truth_label TEXT NOT NULL DEFAULT 'UNKNOWN',
        created_at TEXT NOT NULL
    );
    """)

    # 2. Extracted Fields Table (PDF 1 Section 1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS extracted_fields (
        field_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        field_name TEXT NOT NULL,
        field_value_encrypted TEXT NOT NULL,
        source TEXT NOT NULL,
        confidence REAL NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );
    """)

    # 3. Verification Checks Table (PDF 1 Section 1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_checks (
        check_id TEXT PRIMARY KEY,
        document_id TEXT NOT NULL,
        check_type TEXT NOT NULL,
        status TEXT NOT NULL,
        provider TEXT NOT NULL,
        reference_id TEXT,
        details TEXT NOT NULL,
        checked_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );
    """)

    # 4. Decisions Table (PDF 1 Section 1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS decisions (
        document_id TEXT PRIMARY KEY,
        decision TEXT NOT NULL,
        reason TEXT NOT NULL,
        risk_score REAL NOT NULL,
        decided_at TEXT NOT NULL,
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
    );
    """)

    # 5. Audit Events Table (PDF 1 Section 1)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_events (
        event_id TEXT PRIMARY KEY,
        document_id TEXT,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        metadata TEXT NOT NULL
    );
    """)

    # 6. Verification Cases Table (PDF 2 Section 5)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS verification_cases (
        case_id TEXT PRIMARY KEY,
        document_id TEXT,
        document_type TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TEXT NOT NULL,
        completed_at TEXT,
        risk_score REAL DEFAULT 0.0,
        decision_reason TEXT,
        FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE SET NULL
    );
    """)

    conn.commit()
    conn.close()
    logger.info("Relational database schema initialized successfully at %s", DB_PATH)

def insert_document(doc: Dict[str, Any]) -> str:
    conn = get_db_connection()
    doc_id = doc.get("document_id") or str(uuid.uuid4())
    conn.execute("""
    INSERT OR REPLACE INTO documents (
        document_id, file_name, document_type, image_path, sha256, mime_type, source, ground_truth_label, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        doc_id,
        doc.get("file_name", ""),
        doc.get("document_type", "UNKNOWN"),
        doc.get("image_path", ""),
        doc.get("sha256", ""),
        doc.get("mime_type", "image/jpeg"),
        doc.get("source", "UPLOAD"),
        doc.get("ground_truth_label", "UNKNOWN"),
        doc.get("created_at", get_utc_timestamp())
    ))
    conn.commit()
    conn.close()
    return doc_id

def insert_extracted_fields(document_id: str, fields: List[Dict[str, Any]]):
    conn = get_db_connection()
    for f in fields:
        field_id = f.get("field_id") or str(uuid.uuid4())
        conn.execute("""
        INSERT INTO extracted_fields (
            field_id, document_id, field_name, field_value_encrypted, source, confidence
        ) VALUES (?, ?, ?, ?, ?, ?)
        """, (
            field_id,
            document_id,
            f.get("field_name"),
            f.get("field_value_encrypted", ""),
            f.get("source", "OCR"),
            float(f.get("confidence", 1.0))
        ))
    conn.commit()
    conn.close()

def insert_verification_checks(document_id: str, checks: List[Dict[str, Any]]):
    conn = get_db_connection()
    for c in checks:
        check_id = c.get("check_id") or str(uuid.uuid4())
        details_str = json.dumps(c.get("details", {}))
        conn.execute("""
        INSERT INTO verification_checks (
            check_id, document_id, check_type, status, provider, reference_id, details, checked_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            check_id,
            document_id,
            c.get("check_type"),
            c.get("status", "PASS"),
            c.get("provider", "LOCAL_ENGINE"),
            c.get("reference_id", None),
            details_str,
            c.get("checked_at", get_utc_timestamp())
        ))
    conn.commit()
    conn.close()

def insert_decision(document_id: str, decision: Dict[str, Any]):
    conn = get_db_connection()
    conn.execute("""
    INSERT OR REPLACE INTO decisions (
        document_id, decision, reason, risk_score, decided_at
    ) VALUES (?, ?, ?, ?, ?)
    """, (
        document_id,
        decision.get("decision", "UNABLE_TO_VERIFY"),
        decision.get("reason", "No authoritative verification source available"),
        float(decision.get("risk_score", 50.0)),
        decision.get("decided_at", get_utc_timestamp())
    ))
    conn.commit()
    conn.close()

def log_audit_event(document_id: Optional[str], event_type: str, actor: str, metadata: Dict[str, Any]) -> str:
    conn = get_db_connection()
    event_id = str(uuid.uuid4())
    conn.execute("""
    INSERT INTO audit_events (
        event_id, document_id, event_type, actor, timestamp, metadata
    ) VALUES (?, ?, ?, ?, ?, ?)
    """, (
        event_id,
        document_id,
        event_type,
        actor,
        get_utc_timestamp(),
        json.dumps(metadata)
    ))
    conn.commit()
    conn.close()
    return event_id

def get_document_full(doc_id_or_sha: str) -> Optional[Dict[str, Any]]:
    """Retrieve document record along with extracted fields, checks, and decision."""
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM documents WHERE document_id = ? OR sha256 = ?", (doc_id_or_sha, doc_id_or_sha))
    doc = cur.fetchone()
    if not doc:
        conn.close()
        return None
    
    doc_dict = dict(doc)
    doc_id = doc_dict["document_id"]
    
    # Fields
    cur.execute("SELECT * FROM extracted_fields WHERE document_id = ?", (doc_id,))
    doc_dict["extracted_fields"] = [dict(r) for r in cur.fetchall()]
    
    # Checks
    cur.execute("SELECT * FROM verification_checks WHERE document_id = ?", (doc_id,))
    checks = []
    for r in cur.fetchall():
        item = dict(r)
        try:
            item["details"] = json.loads(item["details"])
        except Exception:
            pass
        checks.append(item)
    doc_dict["verification_checks"] = checks
    
    # Decision
    cur.execute("SELECT * FROM decisions WHERE document_id = ?", (doc_id,))
    decision = cur.fetchone()
    doc_dict["decision"] = dict(decision) if decision else None
    
    conn.close()
    return doc_dict

def list_all_documents() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM documents ORDER BY created_at DESC")
    docs = [dict(r) for r in cur.fetchall()]
    conn.close()
    return docs

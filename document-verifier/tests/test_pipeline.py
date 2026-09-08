import pytest
import uuid
from app.core.database import (
    init_db, get_db_connection, insert_document, insert_extracted_fields,
    insert_verification_checks, insert_decision, get_document_full, list_all_documents
)

def test_database_schema_and_crud():
    init_db()
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Verify tables
    tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
    assert "documents" in tables
    assert "extracted_fields" in tables
    assert "verification_checks" in tables
    assert "decisions" in tables
    assert "audit_events" in tables
    assert "verification_cases" in tables
    conn.close()

    # Test Insertion
    doc_id = str(uuid.uuid4())
    test_hash = f"test_hash_{uuid.uuid4().hex}"
    
    insert_document({
        "document_id": doc_id,
        "file_name": "test_sample.jpg",
        "document_type": "PAN",
        "image_path": "c:/path/to/test_sample.jpg",
        "sha256": test_hash,
        "mime_type": "image/jpeg",
        "source": "TEST",
        "ground_truth_label": "UNKNOWN"
    })

    insert_extracted_fields(doc_id, [
        {"field_name": "pan_number", "field_value_encrypted": "ENC:dummy", "source": "OCR", "confidence": 0.98}
    ])

    insert_verification_checks(doc_id, [
        {"check_type": "PAN_SYNTAX", "status": "PASS", "provider": "TEST_ENGINE", "details": {"ok": True}}
    ])

    insert_decision(doc_id, {
        "decision": "UNABLE_TO_VERIFY",
        "reason": "Test record created without authoritative source",
        "risk_score": 45.0
    })

    full_doc = get_document_full(doc_id)
    assert full_doc is not None
    assert full_doc["document_type"] == "PAN"
    assert len(full_doc["extracted_fields"]) == 1
    assert len(full_doc["verification_checks"]) == 1
    assert full_doc["decision"]["decision"] == "UNABLE_TO_VERIFY"

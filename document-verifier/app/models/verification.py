from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ExtractedIdentity(BaseModel):
    name: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None

class ExtractedDocument(BaseModel):
    document_number: Optional[str] = None
    document_type: str = "UNKNOWN"
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    issuing_authority: Optional[str] = None

class MachineReadable(BaseModel):
    qr_present: bool = False
    qr_valid: Optional[bool] = None
    qr_payload: Optional[str] = None
    barcode_present: bool = False
    barcode_payload: Optional[str] = None
    mrz_present: bool = False
    mrz_valid: Optional[bool] = None
    mrz_lines: Optional[List[str]] = None

class SecurityFeatures(BaseModel):
    digital_signature_present: bool = False
    digital_signature_valid: Optional[bool] = None
    tampering_detected: Optional[bool] = None
    tamper_score: float = 0.0
    suspicious_regions: List[str] = Field(default_factory=list)

class VerificationDetails(BaseModel):
    issuer_status: str = "NOT_CHECKED"
    field_match: Optional[str] = None
    decision: str = "UNABLE_TO_VERIFY"
    risk_score: float = 50.0
    reasons: List[str] = Field(default_factory=list)

class NormalizedDatasetRecord(BaseModel):
    """Normalized record matching PDF 1 Section 3 specification."""
    document_id: str
    file_name: str
    document_type: str
    ground_truth_label: str = "UNKNOWN"
    sha256: str
    extracted: Dict[str, Any]
    machine_readable: Dict[str, Any]
    security: Dict[str, Any]
    verification: Dict[str, Any]

class CaseCreateRequest(BaseModel):
    document_type: str = "UNKNOWN"
    consent: bool = True
    user_id: Optional[str] = "ADMIN-101"

class CaseResponse(BaseModel):
    case_id: str
    document_type: str
    status: str
    created_at: str
    risk_score: float = 0.0
    decision_reason: Optional[str] = None

class VerificationReportResponse(BaseModel):
    case_id: str
    document_type: str
    decision: str
    confidence: str
    checks: Dict[str, str]
    mismatches: List[str]
    verified_at: str
    report_text: str

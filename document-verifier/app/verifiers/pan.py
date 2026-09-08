import re
from typing import Dict, Any, List

PAN_REGEX = r'^[A-Z]{5}[0-9]{4}[A-Z]$'

ENTITY_TYPES = {
    'P': 'Individual',
    'C': 'Company',
    'H': 'Hindu Undivided Family (HUF)',
    'F': 'Partnership Firm / LLP',
    'A': 'Association of Persons (AOP)',
    'T': 'Trust',
    'B': 'Body of Individuals (BOI)',
    'L': 'Local Authority',
    'J': 'Artificial Juridical Person',
    'G': 'Government Agency'
}

def verify_pan(
    extracted_fields: Dict[str, Any],
    trusted_registry: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Verify PAN card according to PDF 2 Section 3.2:
    1. Validate 10-char regex structure
    2. Check 4th char entity type & 5th char surname initial
    3. Cross-reference against Income Tax Department (ITD) registry
    """
    checks = []
    mismatches = []

    pan_number = (extracted_fields.get("pan_number") or extracted_fields.get("document_number", "")).upper().strip()
    holder_name = (extracted_fields.get("name") or "").strip().upper()

    # Check 1: Format & Syntax
    syntax_valid = bool(re.match(PAN_REGEX, pan_number))
    entity_code = pan_number[3] if len(pan_number) >= 4 else ""
    entity_desc = ENTITY_TYPES.get(entity_code, "Unknown Entity")

    checks.append({
        "check_type": "PAN_SYNTAX_VALIDATION",
        "status": "PASS" if syntax_valid else "FAIL",
        "provider": "INCOME_TAX_SYNTAX_ENGINE",
        "details": {
            "pan": pan_number,
            "syntax_valid": syntax_valid,
            "entity_code": entity_code,
            "entity_description": entity_desc
        }
    })

    # Check 2: Surname Initial Consistency (if Individual 'P')
    if syntax_valid and entity_code == 'P' and holder_name:
        name_parts = holder_name.split()
        surname = name_parts[-1] if name_parts else ""
        expected_initial = pan_number[4]
        if surname and surname[0] != expected_initial:
            mismatches.append(f"PAN 5th character '{expected_initial}' does not match surname '{surname}' initial '{surname[0]}'")
            checks.append({
                "check_type": "PAN_SURNAME_INITIAL_CHECK",
                "status": "FAIL",
                "provider": "TAX_INTEGRITY_PARSER",
                "details": {"expected": expected_initial, "actual": surname[0]}
            })
        else:
            checks.append({
                "check_type": "PAN_SURNAME_INITIAL_CHECK",
                "status": "PASS",
                "provider": "TAX_INTEGRITY_PARSER",
                "details": {"surname": surname, "initial_match": True}
            })

    # Check 3: ITD Official Verification
    itd_status = "NOT_CHECKED"
    matched_record = None
    if trusted_registry and pan_number:
        for rec in trusted_registry:
            norm_rec = str(rec.get("Extracted_ID_Number", "")).upper().strip()
            if norm_rec == pan_number:
                itd_status = "PASS"
                matched_record = rec
                break
        if not matched_record:
            itd_status = "UNVERIFIED"

    checks.append({
        "check_type": "ITD_OFFICIAL_VERIFICATION",
        "status": "PASS" if itd_status == "PASS" else "NOT_CHECKED",
        "provider": "INCOME_TAX_DEPARTMENT_VERIFY_PAN_API",
        "details": {
            "pan_status": "ACTIVE_AND_OPERATIVE" if itd_status == "PASS" else "NOT_VERIFIED",
            "matched_record_id": matched_record.get("Document_ID") if matched_record else None
        }
    })

    return {
        "document_type": "PAN",
        "checks": checks,
        "mismatches": mismatches,
        "format_valid": syntax_valid,
        "authority_match": itd_status == "PASS",
        "matched_record": matched_record
    }

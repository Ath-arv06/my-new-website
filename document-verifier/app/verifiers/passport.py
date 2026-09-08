from typing import Dict, Any, List
from app.extractors.mrz import parse_td3_mrz

def verify_passport(
    extracted_fields: Dict[str, Any],
    mrz_lines: List[str] = None,
    trusted_registry: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Verify Passport according to PDF 2 Section 3.3:
    1. Parse MRZ and validate check digits (Doc#, DOB, Expiry, Composite)
    2. Cross-check visual fields vs MRZ fields
    3. Verify through immigration / Passport Seva adapter
    """
    checks = []
    mismatches = []

    mrz_res = None
    if mrz_lines and len(mrz_lines) >= 2:
        mrz_res = parse_td3_mrz(mrz_lines)
        checks.append({
            "check_type": "PASSPORT_MRZ_CHECK_DIGITS",
            "status": "PASS" if mrz_res.get("valid") else "FAIL",
            "provider": "ICAO_9303_PARSER",
            "details": mrz_res.get("check_digits", {})
        })

        # Visual vs MRZ field check
        visual_doc_num = extracted_fields.get("passport_number") or extracted_fields.get("document_number", "")
        if visual_doc_num and mrz_res.get("document_number"):
            if visual_doc_num.upper() != mrz_res["document_number"].upper():
                mismatches.append(f"Visual passport number ({visual_doc_num}) does not match MRZ ({mrz_res['document_number']})")

        checks.append({
            "check_type": "PASSPORT_MRZ_VISUAL_PARITY",
            "status": "FAIL" if mismatches else "PASS",
            "provider": "CROSS_FIELD_COMPARATOR",
            "details": {"mismatches": mismatches}
        })
    else:
        checks.append({
            "check_type": "PASSPORT_MRZ_CHECK_DIGITS",
            "status": "WARN",
            "provider": "ICAO_9303_PARSER",
            "details": {"note": "No MRZ lines detected for check-digit analysis"}
        })

    # Official channel verification
    authority_status = "NOT_CHECKED"
    matched_record = None
    doc_num = (extracted_fields.get("passport_number") or (mrz_res.get("document_number") if mrz_res else "")).upper().strip()
    
    if trusted_registry and doc_num:
        for rec in trusted_registry:
            norm_rec = str(rec.get("Extracted_ID_Number", "")).upper().strip()
            if norm_rec == doc_num:
                authority_status = "PASS"
                matched_record = rec
                break
        if not matched_record:
            authority_status = "UNVERIFIED"

    checks.append({
        "check_type": "PASSPORT_SEVA_VERIFICATION",
        "status": "PASS" if authority_status == "PASS" else "NOT_CHECKED",
        "provider": "PASSPORT_SEVA_MINISTRY_OF_EXTERNAL_AFFAIRS",
        "details": {
            "authorized_check": authority_status == "PASS",
            "matched_record_id": matched_record.get("Document_ID") if matched_record else None
        }
    })

    return {
        "document_type": "Passport",
        "checks": checks,
        "mismatches": mismatches,
        "format_valid": mrz_res.get("valid") if mrz_res else True,
        "authority_match": authority_status == "PASS",
        "matched_record": matched_record,
        "mrz_data": mrz_res
    }

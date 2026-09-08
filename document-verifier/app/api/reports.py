from datetime import datetime, timezone
from typing import Dict, Any, List

def generate_audit_report(case_id: str, doc_type: str, decision_data: Dict[str, Any], checks: List[Dict[str, Any]]) -> str:
    """
    Generate an audit-friendly text report conforming strictly to PDF 2 Section 13.
    """
    decision = decision_data.get("decision", "UNABLE_TO_VERIFY")
    now_str = datetime.now(timezone.utc).strftime("%d %b %Y %H:%M UTC")

    lines = [
        "DOCUMENT VERIFICATION REPORT",
        "----------------------------",
        f"Document type: {doc_type}",
        f"Case ID: {case_id}",
        f"Decision: {decision}",
        f"Verification time: {now_str}",
        "",
        "Checks:"
    ]

    for c in checks:
        status = c.get("status", "PASS")
        ctype = c.get("check_type", "").replace("_", " ").title()
        lines.append(f"[{status}] {ctype}")

    lines.append("")
    lines.append("Result explanation:")
    lines.append(decision_data.get("reason", "Verification completed."))

    if decision == "INVALID / POSSIBLE TAMPERING":
        lines.append("")
        lines.append("Reasons:")
        for hf in decision_data.get("hard_failures", []):
            lines.append(f"[FAIL] {hf}")
        for sn in decision_data.get("supporting_negatives", []):
            lines.append(f"[WARN] {sn}")
        lines.append("")
        lines.append("Action:")
        lines.append("Do not treat the submitted file as an authoritative identity document.")
        lines.append("Request a fresh document directly from an official source.")
    elif decision == "UNABLE_TO_VERIFY":
        lines.append("")
        lines.append("Action:")
        lines.append("Document lacks authoritative registry confirmation or cryptographic proof.")
        lines.append("Use secondary verification or request original document via DigiLocker.")
    else:
        lines.append("")
        lines.append("Action:")
        lines.append("Document authenticity successfully verified against trusted authoritative baseline.")

    lines.append("")
    lines.append("Privacy:")
    lines.append("Only the minimum data required for verification was retained in encrypted vault.")

    return "\n".join(lines)

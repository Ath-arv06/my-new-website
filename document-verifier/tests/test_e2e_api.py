import urllib.request
import json
import uuid
from pathlib import Path

def test_full_api_workflow():
    base_url = "http://localhost:8000"
    
    # 1. Create Case
    req = urllib.request.Request(
        f"{base_url}/v1/verification/cases",
        data=json.dumps({"document_type": "PAN", "consent": True}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    case_res = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))
    case_id = case_res["case_id"]
    print("Created Case ID:", case_id)

    # 2. Upload Document
    sample_file = Path(r"C:\Users\divya\OneDrive\Desktop\data set\WhatsApp Image 2026-09-08 at 10.43.35 AM.jpeg")
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    file_bytes = sample_file.read_bytes()
    
    header = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{sample_file.name}"\r\n'
        f"Content-Type: image/jpeg\r\n\r\n"
    ).encode("utf-8")
    footer = f"\r\n--{boundary}--\r\n".encode("utf-8")
    multipart_body = header + file_bytes + footer

    upload_req = urllib.request.Request(
        f"{base_url}/v1/verification/cases/{case_id}/document",
        data=multipart_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    up_res = json.loads(urllib.request.urlopen(upload_req).read().decode("utf-8"))
    print(f"Uploaded Document: {up_res['status']} | SHA: {up_res['sha256'][:16]}")

    # 3. Scan
    scan_req = urllib.request.Request(
        f"{base_url}/v1/verification/cases/{case_id}/scan",
        data=b"",
        headers={"Content-Type": "application/json"}
    )
    scan_res = json.loads(urllib.request.urlopen(scan_req).read().decode("utf-8"))
    print(f"Scan complete: Type={scan_res['classified_type']}, Fields={scan_res['fields_extracted']}")

    # 4. Verify
    verify_req = urllib.request.Request(
        f"{base_url}/v1/verification/cases/{case_id}/verify",
        data=b"",
        headers={"Content-Type": "application/json"}
    )
    verify_res = json.loads(urllib.request.urlopen(verify_req).read().decode("utf-8"))
    print(f"Verification Decision: {verify_res['decision']} (Confidence: {verify_res['confidence']})")
    print(f"Checks: {json.dumps(verify_res['checks'], indent=2)}")

    # 5. Get Audit Report
    rep_res = json.loads(urllib.request.urlopen(f"{base_url}/v1/verification/cases/{case_id}/report").read().decode("utf-8"))
    print("\n" + "=" * 50)
    print("USER-FACING AUDIT REPORT (PDF 2 SECTION 13 FORMAT):")
    print("=" * 50)
    print(rep_res["report_text"])
    print("=" * 50)

if __name__ == "__main__":
    test_full_api_workflow()

import re
from typing import Dict, Any, List, Optional
from PIL import Image

def extract_patterns_from_text(raw_text: str) -> Dict[str, Any]:
    """
    Extract structured government document fields from OCR text using specialized Indian ID regex.
    """
    text_clean = raw_text.replace('\n', ' ')
    results = {
        "aadhaar_numbers": [],
        "pan_numbers": [],
        "passport_numbers": [],
        "dl_numbers": [],
        "epic_numbers": [],
        "dates": [],
        "possible_names": [],
        "issuing_authorities": []
    }

    # 1. Aadhaar: 12 digits (often 4 4 4)
    aadhaar_matches = re.findall(r'\b([2-9][0-9]{3}\s?[0-9]{4}\s?[0-9]{4})\b', text_clean)
    for m in aadhaar_matches:
        cleaned = m.replace(' ', '')
        if len(cleaned) == 12:
            results["aadhaar_numbers"].append(cleaned)

    # 2. PAN: 5 uppercase letters, 4 numbers, 1 uppercase letter
    pan_matches = re.findall(r'\b([A-Z]{5}[0-9]{4}[A-Z])\b', text_clean.upper())
    results["pan_numbers"] = list(set(pan_matches))

    # 3. Passport: 1 uppercase letter followed by 7 digits
    passport_matches = re.findall(r'\b([A-PR-WYa-pr-wy][1-9][0-9]{6})\b', text_clean)
    results["passport_numbers"] = list(set(passport_matches))

    # 4. Driving Licence: State Code (2) + RTO (2) + Year (4) + 7 digits
    dl_matches = re.findall(r'\b([A-Z]{2}[0-9]{2}\s?(?:19|20)[0-9]{2}[0-9]{7})\b', text_clean.upper())
    if not dl_matches:
        dl_matches = re.findall(r'\b([A-Z]{2}[ -]?[0-9]{2}[ -]?[0-9]{4}[ -]?[0-9]{7})\b', text_clean.upper())
    results["dl_numbers"] = [m.replace(' ', '').replace('-', '') for m in set(dl_matches)]

    # 5. EPIC / Voter ID: 3 letters + 7 digits
    epic_matches = re.findall(r'\b([A-Z]{3}[0-9]{7})\b', text_clean.upper())
    results["epic_numbers"] = list(set(epic_matches))

    # 6. Dates (DD/MM/YYYY or DD-MM-YYYY)
    date_matches = re.findall(r'\b(\d{2}[/-]\d{2}[/-](?:19|20)\d{2})\b', text_clean)
    results["dates"] = list(set(date_matches))

    # 7. Authority keywords
    authorities = []
    if "INCOME TAX DEPARTMENT" in text_clean.upper() or "GOVT. OF INDIA" in text_clean.upper():
        authorities.append("INCOME TAX DEPARTMENT")
    if "UNIQUE IDENTIFICATION" in text_clean.upper() or "UIDAI" in text_clean.upper():
        authorities.append("UIDAI")
    if "ELECTION COMMISSION" in text_clean.upper() or "NIRVACHAN" in text_clean.upper():
        authorities.append("ELECTION COMMISSION OF INDIA")
    if "TRANSPORT DEPARTMENT" in text_clean.upper() or "SARATHI" in text_clean.upper() or "PARIVAHAN" in text_clean.upper():
        authorities.append("TRANSPORT DEPARTMENT")
    if "PASSPORT" in text_clean.upper() or "REPUBLIC OF INDIA" in text_clean.upper():
        authorities.append("MINISTRY OF EXTERNAL AFFAIRS")
    results["issuing_authorities"] = authorities

    return results

def classify_document_type(extracted: Dict[str, Any], file_name: str = "") -> str:
    """Classify document into one of the five target Indian ID types."""
    if extracted.get("pan_numbers") or "pan" in file_name.lower():
        return "PAN"
    if extracted.get("aadhaar_numbers") or "aadhaar" in file_name.lower() or "uidai" in file_name.lower():
        return "Aadhaar"
    if extracted.get("passport_numbers") or "passport" in file_name.lower():
        return "Passport"
    if extracted.get("dl_numbers") or "dl" in file_name.lower() or "driving" in file_name.lower() or "licence" in file_name.lower() or "license" in file_name.lower():
        return "Driving Licence"
    if extracted.get("epic_numbers") or "voter" in file_name.lower() or "epic" in file_name.lower():
        return "Voter ID"
    return "UNKNOWN"

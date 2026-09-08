from typing import Dict, Any, Tuple, Optional

def calculate_mrz_check_digit(data: str) -> int:
    """Calculate ICAO Doc 9303 check digit using weights 7, 3, 1."""
    weights = [7, 3, 1]
    total = 0
    for i, char in enumerate(data):
        if char.isdigit():
            val = int(char)
        elif char.isalpha():
            val = ord(char.upper()) - 55  # 'A' -> 10, ..., 'Z' -> 35
        elif char == '<':
            val = 0
        else:
            val = 0
        total += val * weights[i % 3]
    return total % 10

def validate_mrz_check_digit(data: str, expected_digit: str) -> bool:
    """Validate check digit against expected digit character."""
    if not expected_digit.isdigit():
        return False
    return calculate_mrz_check_digit(data) == int(expected_digit)

def parse_td3_mrz(lines: list[str]) -> Dict[str, Any]:
    """
    Parse ICAO 9303 TD3 Machine Readable Zone (2 lines of 44 characters).
    Returns parsed fields, check digit verification results, and structural status.
    """
    if len(lines) < 2:
        return {"valid": False, "error": "Insufficient MRZ lines (need 2 for TD3)"}

    line1 = lines[0].replace(' ', '').upper().strip()
    line2 = lines[1].replace(' ', '').upper().strip()

    if len(line1) != 44 or len(line2) != 44:
        return {"valid": False, "error": f"Invalid line length: line1={len(line1)}, line2={len(line2)}"}

    # Line 1: Type (2), Issuing Country (3), Names (39)
    doc_type = line1[0:2].replace('<', '')
    issuing_country = line1[2:5].replace('<', '')
    name_field = line1[5:44]
    name_parts = name_field.split('<<')
    surname = name_parts[0].replace('<', ' ').strip()
    given_names = name_parts[1].replace('<', ' ').strip() if len(name_parts) > 1 else ""

    # Line 2 fields
    doc_number = line2[0:9].replace('<', '')
    doc_num_check = line2[9]
    nationality = line2[10:13].replace('<', '')
    dob_raw = line2[13:19]  # YYMMDD
    dob_check = line2[19]
    gender = line2[20]
    expiry_raw = line2[21:27]  # YYMMDD
    expiry_check = line2[27]
    optional_data = line2[28:42]
    optional_check = line2[42]
    composite_check = line2[43]

    # Verify check digits
    doc_num_valid = validate_mrz_check_digit(line2[0:9], doc_num_check)
    dob_valid = validate_mrz_check_digit(dob_raw, dob_check)
    expiry_valid = validate_mrz_check_digit(expiry_raw, expiry_check)

    # Composite string in TD3: line2[0:10] + line2[13:20] + line2[21:43]
    composite_data = line2[0:10] + line2[13:20] + line2[21:43]
    composite_valid = validate_mrz_check_digit(composite_data, composite_check)

    all_valid = doc_num_valid and dob_valid and expiry_valid and composite_valid

    # Format dates
    def format_date(yymmdd: str) -> str:
        if len(yymmdd) == 6 and yymmdd.isdigit():
            yy = int(yymmdd[:2])
            mm = yymmdd[2:4]
            dd = yymmdd[4:6]
            year = 1900 + yy if yy > 40 else 2000 + yy
            return f"{year}-{mm}-{dd}"
        return yymmdd

    return {
        "valid": all_valid,
        "document_type": doc_type or "PASSPORT",
        "issuing_country": issuing_country,
        "surname": surname,
        "given_names": given_names,
        "full_name": f"{given_names} {surname}".strip(),
        "document_number": doc_number,
        "nationality": nationality,
        "dob": format_date(dob_raw),
        "gender": "M" if gender == "M" else ("F" if gender == "F" else "X"),
        "expiry_date": format_date(expiry_raw),
        "check_digits": {
            "document_number": {"valid": doc_num_valid, "expected": doc_num_check},
            "dob": {"valid": dob_valid, "expected": dob_check},
            "expiry": {"valid": expiry_valid, "expected": expiry_check},
            "composite": {"valid": composite_valid, "expected": composite_check}
        }
    }

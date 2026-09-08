import pytest
from app.verifiers.aadhaar import validate_verhoeff, verify_aadhaar
from app.verifiers.pan import verify_pan
from app.verifiers.passport import verify_passport
from app.verifiers.driving_license import verify_driving_licence
from app.verifiers.epic import verify_epic
from app.extractors.mrz import calculate_mrz_check_digit, parse_td3_mrz
from app.verifiers.digilocker import digilocker_client

def test_aadhaar_verhoeff_checksum():
    # Valid sample with correct Verhoeff checksum
    valid_aadhaar = "901848217368"
    assert validate_verhoeff(valid_aadhaar) == True
    # Mutating the last digit should fail Verhoeff
    assert validate_verhoeff("901848217362") == False
    # Short length should fail
    assert validate_verhoeff("123456") == False

def test_pan_syntax_and_surname():
    # Valid PAN for individual (P) with surname initial 'S'
    res_valid = verify_pan({
        "pan_number": "ABCPS1234F",
        "name": "RAHUL SHARMA"
    })
    assert res_valid["format_valid"] == True
    assert len(res_valid["mismatches"]) == 0

    # Surname initial mismatch (P indicates Individual, 5th char 'K', but surname is 'VERMA')
    res_mismatch = verify_pan({
        "pan_number": "ABCPK1234F",
        "name": "ANAND VERMA"
    })
    assert len(res_mismatch["mismatches"]) > 0

    # Invalid syntax
    res_bad = verify_pan({"pan_number": "12345ABCDE"})
    assert res_bad["format_valid"] == False

def test_passport_mrz_td3():
    # Standard ICAO TD3 passport sample (DocNum 9 chars, e.g. Z2849102<)
    doc_field = "Z2849102<"
    doc_check = str(calculate_mrz_check_digit(doc_field))
    dob = "950815"
    dob_check = str(calculate_mrz_check_digit(dob))
    exp = "300814"
    exp_check = str(calculate_mrz_check_digit(exp))
    
    line1 = "P<INDTHAPLIYAL<<GARIMA<<<<<<<<<<<<<<<<<<<<<<"
    optional = "12345678901234"
    opt_check = str(calculate_mrz_check_digit(optional))
    comp_data = f"{doc_field}{doc_check}{dob}{dob_check}{exp}{exp_check}{optional}{opt_check}"
    comp_check = str(calculate_mrz_check_digit(comp_data))
    
    line2 = f"{doc_field}{doc_check}IND{dob}{dob_check}F{exp}{exp_check}{optional}{opt_check}{comp_check}"
    assert len(line1) == 44
    assert len(line2) == 44

    parsed = parse_td3_mrz([line1, line2])
    assert parsed["valid"] == True
    assert parsed["surname"] == "THAPLIYAL"
    assert parsed["given_names"] == "GARIMA"
    assert parsed["document_number"] == "Z2849102"


def test_driving_license_format():
    # Valid Indian state code and Sarathi format
    res_valid = verify_driving_licence({"dl_number": "UP34 20250011079"})
    assert res_valid["format_valid"] == True

    # Invalid state code
    res_bad_state = verify_driving_licence({"dl_number": "ZZ99 20250011079"})
    assert res_bad_state["format_valid"] == False

def test_epic_voter_id_format():
    res_valid = verify_epic({"epic_number": "FSZ1842901"})
    assert res_valid["format_valid"] == True

    res_invalid = verify_epic({"epic_number": "123"})
    assert res_invalid["format_valid"] == False

def test_digilocker_consent_session():
    session = digilocker_client.create_consent_session("USER-42", "Aadhaar", "http://localhost:3000/cb")
    assert session["consent_status"] == "PENDING_CONSENT"
    assert "session_id" in session

    # Authorize
    cb_res = digilocker_client.handle_auth_callback(session["session_id"], "auth_code_xyz")
    assert cb_res["success"] == True
    assert cb_res["session"]["consent_status"] == "CONSENT_GRANTED"

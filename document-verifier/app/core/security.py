import hashlib
import hmac
import base64
from typing import Optional
from app.core.config import SECRET_KEY, ENCRYPTION_SALT

def compute_sha256(data: bytes) -> str:
    """Compute SHA-256 hex digest for given bytes."""
    return hashlib.sha256(data).hexdigest()

def compute_file_sha256(file_path: str) -> str:
    """Compute SHA-256 hex digest of a file on disk."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()

def encrypt_field(value: str) -> str:
    """Deterministic tokenized encryption for sensitive PII at rest."""
    if not value:
        return ""
    key = hashlib.sha256((SECRET_KEY + ENCRYPTION_SALT).encode('utf-8')).digest()
    # Masked prefix + HMAC digest token
    mac = hmac.new(key, value.encode('utf-8'), hashlib.sha256).hexdigest()[:16]
    masked = mask_identifier(value)
    token = base64.urlsafe_b64encode(f"{masked}::{mac}".encode('utf-8')).decode('utf-8')
    return f"ENC:{token}"

def mask_identifier(val: str) -> str:
    """Mask document identifiers for privacy-safe display and logging."""
    if not val:
        return ""
    cleaned = val.strip()
    if len(cleaned) <= 4:
        return "****"
    if len(cleaned) == 12 and cleaned.isdigit():  # Aadhaar 12-digit
        return f"XXXX XXXX {cleaned[-4:]}"
    if len(cleaned) == 10 and cleaned[:5].isalpha() and cleaned[5:9].isdigit():  # PAN
        return f"{cleaned[:2]}XXXXX{cleaned[-2:]}"
    # General mask
    keep = min(2, len(cleaned) // 4)
    return f"{cleaned[:keep]}{'*' * (len(cleaned) - keep * 2)}{cleaned[-keep:]}"

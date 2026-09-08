import re
from typing import Dict, Any

def inspect_pdf_structure(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Inspect raw PDF structure for tampering indicators:
    - Incremental updates (multiple %%EOF markers)
    - Embedded JavaScript or launch actions
    - Digital signature dictionaries (/ByteRange, /Contents)
    - Form XObjects and annotations
    """
    text = pdf_bytes.decode('latin-1', errors='ignore')
    
    eof_count = len(re.findall(r'%%EOF', text))
    has_incremental_update = eof_count > 1
    
    # Signature dictionary detection
    has_signature = "/ByteRange" in text and "/Contents" in text
    
    # Annotations and overlay objects
    annotation_count = len(re.findall(r'/Type\s*/Annot', text))
    js_actions = len(re.findall(r'/JavaScript|/JS', text))
    
    return {
        "is_pdf": text.startswith("%PDF-"),
        "eof_count": eof_count,
        "has_incremental_update": has_incremental_update,
        "has_digital_signature": has_signature,
        "annotation_count": annotation_count,
        "has_suspicious_js": js_actions > 0,
        "integrity_risk": "HIGH" if (has_incremental_update and annotation_count > 5) else "LOW"
    }

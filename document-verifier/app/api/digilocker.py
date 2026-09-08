from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.verifiers.digilocker import digilocker_client
from app.core.logging import logger, get_utc_timestamp

router = APIRouter(prefix="/v1/digilocker", tags=["DigiLocker"])

class DigiLockerSessionRequest(BaseModel):
    user_id: str = "USER-1001"
    document_type: str = "Aadhaar"
    redirect_uri: str = "http://localhost:3000/callback"
    consent: bool = True

@router.post("/session")
async def start_digilocker_session(req: DigiLockerSessionRequest):
    """Start an authorized DigiLocker requester session with explicit user consent."""
    if not req.consent:
        raise HTTPException(status_code=400, detail="Explicit user consent is mandatory for DigiLocker retrieval.")
    
    session = digilocker_client.create_consent_session(
        user_id=req.user_id,
        doc_type=req.document_type,
        redirect_uri=req.redirect_uri
    )
    logger.info("DigiLocker session created: %s for doc_type: %s", session["session_id"], req.document_type)
    return {
        "success": True,
        "session_id": session["session_id"],
        "auth_url": session["auth_url"],
        "consent_status": session["consent_status"],
        "created_at": session["created_at"]
    }

@router.post("/callback")
async def digilocker_callback(session_id: str, code: str):
    """OAuth 2.0 authorization code callback simulation."""
    res = digilocker_client.handle_auth_callback(session_id, code)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.post("/webhooks")
async def digilocker_webhook(payload: Dict[str, Any] = Body(...)):
    """Receive integration webhook callbacks from DigiLocker partner portal."""
    logger.info("Received DigiLocker webhook event: %s", payload.get("event_type"))
    return {"status": "ACKNOWLEDGED", "received_at": get_utc_timestamp()}

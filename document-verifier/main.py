import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import HOST, PORT
from app.core.database import init_db, list_all_documents, get_document_full
from app.api.cases import router as cases_router
from app.api.digilocker import router as digilocker_router
from app.core.logging import logger

app = FastAPI(
    title="AuthBridge - Indian Government Document Authenticity Verification API",
    version="1.0.0",
    description="Deterministic multi-signal authenticity verification for Aadhaar, PAN, Passport, Voter ID, and Driving Licence."
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers (PDF 2 Section 6)
app.include_router(cases_router)
app.include_router(digilocker_router)

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("AuthBridge Verification Service started on %s:%d", HOST, PORT)

@app.get("/health")
async def health_check():
    return {"status": "HEALTHY", "service": "document-verifier", "version": "1.0.0"}

@app.get("/v1/documents")
async def get_all_documents():
    """List all ingested documents from the dataset/database."""
    docs = list_all_documents()
    return {"count": len(docs), "documents": docs}

@app.get("/v1/documents/{doc_id}")
async def get_single_document(doc_id: str):
    """Get full evidence tree, checks, and decision for a document."""
    doc = get_document_full(doc_id)
    if not doc:
        return {"error": "Document not found"}
    return doc

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False)

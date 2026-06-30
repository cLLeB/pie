"""FastAPI app: event ingestion, server-side certificate signing, verification,
and a registry for independent certificate lookup."""

from __future__ import annotations

import os
import time
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from . import __version__, config
from .exams import ExamRepo
from .identity import IdentityClient
from .lti import LtiError, validate_launch
from .qti import qti_to_exam
from .signing import sign_certificate, verify_certificate, verify_chain
from .store import EventStore, SqliteStore, Store


def _now_ms() -> int:
    return int(time.time() * 1000)


class EventBatch(BaseModel):
    session_id: str = Field(min_length=1)
    events: list[dict[str, Any]]


class SignRequest(BaseModel):
    tenant: str = Field(min_length=1)
    root: str = Field(min_length=1)


class VerifyRequest(BaseModel):
    tenant: str = Field(min_length=1)
    bundle: dict[str, Any]
    cert: dict[str, Any]


class IdentityVerifyRequest(BaseModel):
    tenant: str = Field(min_length=1)
    user_id: str = Field(min_length=1)
    image: str = Field(min_length=1)


class QtiImportRequest(BaseModel):
    exam_id: str = Field(min_length=1)
    title: str = Field(min_length=1)
    qti_xml: str = Field(min_length=1)
    duration_seconds: int = 1800


class LtiLaunchRequest(BaseModel):
    id_token: str = Field(min_length=1)


def _default_lti() -> dict[str, str] | None:
    pub = os.environ.get("PIE_LTI_PUBLIC_KEY")
    aud = os.environ.get("PIE_LTI_AUDIENCE")
    iss = os.environ.get("PIE_LTI_ISSUER")
    if pub and aud and iss:
        return {"public_key": pub, "audience": aud, "issuer": iss}
    return None


def _default_store() -> EventStore:
    path = os.environ.get("PIE_DB_PATH")
    return SqliteStore(path) if path else Store()


def create_app(
    store: EventStore | None = None,
    identity: IdentityClient | None = None,
    exams: ExamRepo | None = None,
    lti_config: dict[str, str] | None = None,
) -> FastAPI:
    app = FastAPI(title="PIE Server", version=__version__)
    app.state.store = store or _default_store()
    app.state.identity = identity
    app.state.exams = exams or ExamRepo()
    app.state.lti = lti_config or _default_lti()

    origins = [o for o in os.environ.get("PIE_CORS_ORIGINS", "").split(",") if o.strip()]
    if origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=["GET", "POST"],
            allow_headers=["content-type"],
        )

    @app.get("/healthz")
    def healthz() -> dict[str, str]:
        return {"status": "ok", "version": __version__}

    @app.post("/lti/launch")
    def lti_launch(req: LtiLaunchRequest) -> dict[str, Any]:
        cfg = app.state.lti
        if not cfg:
            raise HTTPException(status_code=503, detail="LTI not configured")
        try:
            return validate_launch(req.id_token, cfg["public_key"], cfg["audience"], cfg["issuer"])
        except LtiError as exc:
            raise HTTPException(status_code=401, detail=str(exc)) from exc

    @app.post("/v1/exams/import-qti")
    def import_qti(req: QtiImportRequest) -> dict[str, Any]:
        try:
            exam = qti_to_exam(req.qti_xml, req.exam_id, req.title, req.duration_seconds)
        except Exception as exc:  # malformed XML → 400, not 500
            raise HTTPException(status_code=400, detail=f"invalid QTI: {exc}") from exc
        app.state.exams.add(exam)
        return exam

    @app.get("/v1/exams/{exam_id}")
    def get_exam(exam_id: str) -> dict[str, Any]:
        exam = app.state.exams.get(exam_id)
        if exam is None:
            raise HTTPException(status_code=404, detail="exam not found")
        return exam

    @app.post("/v1/events")
    def ingest_events(batch: EventBatch) -> dict[str, int]:
        accepted = app.state.store.append_events(batch.session_id, batch.events)
        return {"accepted": accepted}

    @app.post("/v1/certificates/sign")
    def sign(req: SignRequest) -> dict[str, Any]:
        secret = config.secret_for(req.tenant)
        if secret is None:
            raise HTTPException(status_code=404, detail="unknown tenant")
        cert = sign_certificate(req.root, secret, _now_ms())
        app.state.store.save_certificate(cert)
        return cert

    @app.post("/v1/certificates/verify")
    def verify(req: VerifyRequest) -> dict[str, bool]:
        secret = config.secret_for(req.tenant)
        if secret is None:
            raise HTTPException(status_code=404, detail="unknown tenant")
        events = req.bundle.get("events", [])
        chain_ok = verify_chain(events)
        root_matches = req.bundle.get("root") == req.cert.get("root")
        signature_ok = verify_certificate(req.cert, secret)
        return {
            "chainOk": chain_ok,
            "rootMatches": bool(root_matches),
            "signatureOk": signature_ok,
            "ok": chain_ok and bool(root_matches) and signature_ok,
        }

    @app.post("/v1/identity/verify")
    def identity_verify(req: IdentityVerifyRequest) -> dict[str, Any]:
        if app.state.identity is None:
            raise HTTPException(status_code=503, detail="identity backend not configured")
        result = app.state.identity.verify(req.tenant, req.user_id, req.image)
        return {"match": bool(result.get("success")), "score": float(result.get("score", 0.0))}

    @app.get("/v1/certificates/{root}")
    def lookup(root: str) -> dict[str, Any]:
        cert = app.state.store.certificate(root)
        if cert is None:
            raise HTTPException(status_code=404, detail="certificate not found")
        return cert

    return app


app = create_app()

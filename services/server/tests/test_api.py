from fastapi.testclient import TestClient

from pie_server.app import create_app
from pie_server.signing import sign_certificate, sha256_hex, canonicalize


def client() -> TestClient:
    return TestClient(create_app())


def _chain():
    """A minimal valid 2-event chain matching integrity-core's hashing."""
    e0b = {"seq": 0, "ts": 1, "type": "session.start", "data": {}, "prevHash": "GENESIS"}
    e0 = {**e0b, "hash": sha256_hex(canonicalize(e0b))}
    e1b = {"seq": 1, "ts": 2, "type": "session.submit", "data": {}, "prevHash": e0["hash"]}
    e1 = {**e1b, "hash": sha256_hex(canonicalize(e1b))}
    return [e0, e1]


def test_healthz():
    r = client().get("/healthz")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_get_demo_exam():
    r = client().get("/v1/exams/pie-demo-001")
    assert r.status_code == 200
    body = r.json()
    assert body["id"] == "pie-demo-001"
    assert len(body["questions"]) == 3


def test_get_unknown_exam_404():
    assert client().get("/v1/exams/nope").status_code == 404


def test_ingest_events():
    r = client().post("/v1/events", json={"session_id": "s1", "events": [{"type": "focus.lost"}]})
    assert r.status_code == 200
    assert r.json() == {"accepted": 1}


def test_sign_then_lookup_in_registry():
    c = client()
    r = c.post("/v1/certificates/sign", json={"tenant": "demo", "root": "deadbeef"})
    assert r.status_code == 200
    cert = r.json()
    assert cert["root"] == "deadbeef"
    assert cert["alg"] == "HMAC-SHA256"

    got = c.get(f"/v1/certificates/{cert['root']}")
    assert got.status_code == 200
    assert got.json()["signature"] == cert["signature"]


def test_sign_unknown_tenant_404():
    r = client().post("/v1/certificates/sign", json={"tenant": "nope", "root": "x"})
    assert r.status_code == 404


def test_verify_endpoint_accepts_a_valid_signed_bundle():
    events = _chain()
    root = events[-1]["hash"]
    bundle = {"root": root, "events": events, "answers": [], "verified": True}
    cert = sign_certificate(root, "pie-demo-tenant-secret", 1_700_000_000_000)

    r = client().post("/v1/certificates/verify", json={"tenant": "demo", "bundle": bundle, "cert": cert})
    assert r.status_code == 200
    assert r.json() == {"chainOk": True, "rootMatches": True, "signatureOk": True, "ok": True}


def test_verify_endpoint_rejects_tampered_chain():
    events = _chain()
    root = events[-1]["hash"]
    events[0]["data"] = {"hacked": True}
    bundle = {"root": root, "events": events, "answers": [], "verified": True}
    cert = sign_certificate(root, "pie-demo-tenant-secret", 1_700_000_000_000)

    r = client().post("/v1/certificates/verify", json={"tenant": "demo", "bundle": bundle, "cert": cert})
    assert r.json()["chainOk"] is False
    assert r.json()["ok"] is False

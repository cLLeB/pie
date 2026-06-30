import httpx
from fastapi.testclient import TestClient

from pie_server.app import create_app
from pie_server.identity import HttpIdentityClient


class FakeIdentity:
    def __init__(self, success: bool, score: float) -> None:
        self._success = success
        self._score = score
        self.calls: list[tuple[str, str, str]] = []

    def verify(self, tenant: str, user_id: str, image: str) -> dict:
        self.calls.append((tenant, user_id, image))
        return {"success": self._success, "score": self._score}


def test_identity_verify_returns_match_and_score():
    fake = FakeIdentity(True, 0.97)
    c = TestClient(create_app(identity=fake))
    r = c.post("/v1/identity/verify", json={"tenant": "demo", "user_id": "alice", "image": "b64"})
    assert r.status_code == 200
    assert r.json() == {"match": True, "score": 0.97}
    assert fake.calls == [("demo", "alice", "b64")]


def test_identity_verify_503_when_unconfigured():
    c = TestClient(create_app())  # no identity backend
    r = c.post("/v1/identity/verify", json={"tenant": "demo", "user_id": "a", "image": "b64"})
    assert r.status_code == 503


def test_http_identity_client_sends_api_key_and_parses_response():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["key"] = request.headers.get("X-API-Key")
        captured["url"] = str(request.url)
        return httpx.Response(200, json={"success": True, "score": 0.88})

    transport = httpx.MockTransport(handler)
    client = HttpIdentityClient("http://bio.local", "fk_key", client=httpx.Client(transport=transport))
    result = client.verify("demo", "bob", "img")

    assert result["success"] is True
    assert captured["key"] == "fk_key"
    assert captured["url"].endswith("/v1/verify")

import time

import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from pie_server.lti import validate_launch, LtiError, MESSAGE_TYPE_CLAIM, RESOURCE_LINK_REQUEST, ROLES_CLAIM

AUDIENCE = "pie-client-id"
ISSUER = "https://lms.example.edu"


def _keypair():
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    priv = key.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.PKCS8,
        serialization.NoEncryption(),
    ).decode()
    pub = key.public_key().public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode()
    return priv, pub


def _token(priv: str, **overrides) -> str:
    claims = {
        "iss": ISSUER,
        "aud": AUDIENCE,
        "sub": "user-123",
        "name": "Ada Student",
        "exp": int(time.time()) + 300,
        MESSAGE_TYPE_CLAIM: RESOURCE_LINK_REQUEST,
        ROLES_CLAIM: ["http://purl.imsglobal.org/vocab/lis/v2/membership#Learner"],
    }
    claims.update(overrides)
    return jwt.encode(claims, priv, algorithm="RS256")


def test_validates_a_correct_launch():
    priv, pub = _keypair()
    claims = validate_launch(_token(priv), pub, AUDIENCE, ISSUER)
    assert claims["sub"] == "user-123"
    assert claims["name"] == "Ada Student"
    assert "Learner" in claims["roles"][0]


def test_rejects_a_token_signed_by_a_different_key():
    priv, _ = _keypair()
    _, other_pub = _keypair()
    with pytest.raises(LtiError):
        validate_launch(_token(priv), other_pub, AUDIENCE, ISSUER)


def test_rejects_wrong_audience_and_issuer():
    priv, pub = _keypair()
    with pytest.raises(LtiError):
        validate_launch(_token(priv, aud="someone-else"), pub, AUDIENCE, ISSUER)
    with pytest.raises(LtiError):
        validate_launch(_token(priv, iss="https://evil.example"), pub, AUDIENCE, ISSUER)


def test_rejects_expired_token():
    priv, pub = _keypair()
    with pytest.raises(LtiError):
        validate_launch(_token(priv, exp=int(time.time()) - 10), pub, AUDIENCE, ISSUER)


def test_rejects_non_resource_link_message():
    priv, pub = _keypair()
    with pytest.raises(LtiError):
        validate_launch(_token(priv, **{MESSAGE_TYPE_CLAIM: "LtiDeepLinkingRequest"}), pub, AUDIENCE, ISSUER)


def test_lti_launch_endpoint():
    from fastapi.testclient import TestClient
    from pie_server.app import create_app

    priv, pub = _keypair()
    app = create_app(lti_config={"public_key": pub, "audience": AUDIENCE, "issuer": ISSUER})
    client = TestClient(app)

    ok = client.post("/lti/launch", json={"id_token": _token(priv)})
    assert ok.status_code == 200
    assert ok.json()["sub"] == "user-123"

    bad = client.post("/lti/launch", json={"id_token": "not-a-jwt"})
    assert bad.status_code == 401


def test_lti_launch_503_when_unconfigured():
    from fastapi.testclient import TestClient
    from pie_server.app import create_app

    client = TestClient(create_app())
    assert client.post("/lti/launch", json={"id_token": "x"}).status_code == 503

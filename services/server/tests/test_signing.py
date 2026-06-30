from pie_server.signing import (
    canonicalize,
    sign_certificate,
    verify_certificate,
    verify_chain,
    sha256_hex,
)

# This is the SAME hex pinned in packages/integrity-core/tests/signing.test.ts.
# If Python and TypeScript ever diverge, one of these two tests fails.
CROSS_LANG_SIGNATURE = "df5d7c2445ba2f97236d7e12743b879e4c2ae02a8b13b1dadfecb33dff567dba"


def test_canonicalize_sorts_keys_without_whitespace():
    assert canonicalize({"b": 1, "a": 2}) == '{"a":2,"b":1}'
    assert canonicalize({"z": {"d": 1, "c": 2}, "a": [3, 1, 2]}) == '{"a":[3,1,2],"z":{"c":2,"d":1}}'


def test_sha256_known_vector():
    assert sha256_hex("abc") == "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"


def test_sign_matches_typescript_reference_signature():
    cert = sign_certificate("abc123", "tenant-secret", 1_700_000_000_000)
    assert cert["alg"] == "HMAC-SHA256"
    assert cert["signature"] == CROSS_LANG_SIGNATURE


def test_roundtrip_verify():
    cert = sign_certificate("root-xyz", "s3cret", 1_700_000_000_000)
    assert verify_certificate(cert, "s3cret") is True
    assert verify_certificate(cert, "wrong") is False


def test_verify_chain_detects_tampering():
    # Build a tiny chain the way integrity-core does, then tamper it.
    e0_base = {"seq": 0, "ts": 1, "type": "a", "data": {"v": 1}, "prevHash": "GENESIS"}
    e0 = {**e0_base, "hash": sha256_hex(canonicalize(e0_base))}
    e1_base = {"seq": 1, "ts": 2, "type": "b", "data": {"v": 2}, "prevHash": e0["hash"]}
    e1 = {**e1_base, "hash": sha256_hex(canonicalize(e1_base))}

    assert verify_chain([e0, e1]) is True

    e1_tampered = {**e1, "data": {"v": 999}}
    assert verify_chain([e0, e1_tampered]) is False

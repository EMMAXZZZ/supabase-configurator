from app.utils.character_sets import (
    TIER1_ALPHANUMERIC,
    TIER2_BASE64URL,
    TIER3_HEX,
    generate_tier1_token,
    generate_tier2_token,
    generate_tier3_token,
    generate_secure_token,
    calculate_entropy,
    detect_character_tier,
)
import pytest


def test_generate_tier1_token_expected_length_and_charset():
    token = generate_tier1_token(32)
    assert len(token) == 32
    assert all(ch in TIER1_ALPHANUMERIC for ch in token)


def test_generate_secure_token_edge_length_zero():
    with pytest.raises(ValueError):
        generate_secure_token(TIER1_ALPHANUMERIC, 0)


def test_generate_secure_token_failure_empty_charset():
    with pytest.raises(ValueError):
        generate_secure_token("", 10)


def test_detect_character_tier_mixed():
    assert detect_character_tier("abc-_") == "tier2"
    assert detect_character_tier("ABCDEF") == "tier3"
    assert detect_character_tier("abcXYZ123") == "tier1"
    assert detect_character_tier("abc$123") == "mixed"


def test_entropy_calculation():
    val = "A" * 10
    # 10 characters, 62-char set ≈ 59.5 bits
    entropy = calculate_entropy(val, len(TIER1_ALPHANUMERIC))
    assert entropy > 50

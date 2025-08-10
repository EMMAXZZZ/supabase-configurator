"""Character set constants and secure token generation utilities."""
from __future__ import annotations

import math
import secrets
import string

# Tier 1: Universal compatibility (62 characters)
TIER1_ALPHANUMERIC: str = string.ascii_letters + string.digits

# Tier 2: Base64URL safe (64 characters)
TIER2_BASE64URL: str = TIER1_ALPHANUMERIC + "-_"

# Tier 3: Hex only (16 characters) - use uppercase for consistency
TIER3_HEX: str = "0123456789ABCDEF"


def calculate_entropy(value: str, character_set_size: int) -> float:
    """Calculate entropy in bits.

    Args:
        value (str): The value to evaluate.
        character_set_size (int): The size of the character set assumed.

    Returns:
        float: Entropy in bits.
    """
    if character_set_size <= 0:
        raise ValueError("character_set_size must be positive")
    return len(value) * math.log2(character_set_size)


def generate_secure_token(character_set: str, length: int) -> str:
    """Generate a secure token from a character set.

    Args:
        character_set (str): Allowed characters to draw from.
        length (int): Desired length (>= 1).

    Returns:
        str: Securely generated token.
    """
    if length < 1:
        raise ValueError("length must be >= 1")
    if not character_set:
        raise ValueError("character_set must not be empty")
    return "".join(secrets.choice(character_set) for _ in range(length))


def generate_tier1_token(length: int = 32) -> str:
    """Generate a Tier 1 (alphanumeric) token."""
    return generate_secure_token(TIER1_ALPHANUMERIC, length)


def generate_tier2_token(length: int = 32) -> str:
    """Generate a Tier 2 (Base64URL-safe) token."""
    return generate_secure_token(TIER2_BASE64URL, length)


def generate_tier3_token(length: int = 48) -> str:
    """Generate a Tier 3 (hex-only) token."""
    return generate_secure_token(TIER3_HEX, length)


def detect_character_tier(value: str) -> str:
    """Detect which tier a value best matches.

    Args:
        value (str): The string to classify.

    Returns:
        str: One of {"tier1", "tier2", "tier3", "mixed"}.
    """
    if all(ch in TIER3_HEX for ch in value):
        return "tier3"
    if all(ch in TIER1_ALPHANUMERIC for ch in value):
        return "tier1"
    if all(ch in TIER2_BASE64URL for ch in value):
        return "tier2"
    return "mixed"

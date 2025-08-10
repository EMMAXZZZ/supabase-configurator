"""Validation helpers for character compatibility."""
from __future__ import annotations

from typing import Iterable, Tuple, List

# Forbidden characters from PRD
FORBIDDEN_CHARS: str = "@$:/#?%=;&{}*!|><\\"


def has_forbidden_chars(value: str) -> Tuple[bool, List[str]]:
    """Check if a string contains forbidden characters.

    Args:
        value (str): Input string.

    Returns:
        Tuple[bool, List[str]]: (has_forbidden, list_of_found_chars)
    """
    found = sorted({ch for ch in value if ch in FORBIDDEN_CHARS})
    return (len(found) > 0, found)


def all_chars_in_set(value: str, allowed: Iterable[str]) -> bool:
    """Return True if all characters in value are in the allowed set.

    Args:
        value (str): Input string.
        allowed (Iterable[str]): Allowed characters.

    Returns:
        bool: True if value only contains allowed chars.
    """
    allowed_set = set(allowed)
    return all(ch in allowed_set for ch in value)


def compatibility_score(value: str, allowed: Iterable[str]) -> int:
    """Compute a simple compatibility score (0-100).

    Heuristic: percentage of characters inside the allowed set and not forbidden.

    Args:
        value (str): Input string.
        allowed (Iterable[str]): Allowed characters.

    Returns:
        int: Score from 0 to 100.
    """
    if not value:
        return 100
    allowed_set = set(allowed)
    total = len(value)
    good = 0
    for ch in value:
        if ch in allowed_set and ch not in FORBIDDEN_CHARS:
            good += 1
    return int(round(100 * good / total))

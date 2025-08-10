from app.utils.validation import has_forbidden_chars, compatibility_score, FORBIDDEN_CHARS


def test_has_forbidden_chars_expected_use():
    has, found = has_forbidden_chars("abc$123")
    assert has is True and "$" in found


def test_has_forbidden_chars_edge_empty_string():
    has, found = has_forbidden_chars("")
    assert has is False and found == []


def test_compatibility_score_failure_with_many_forbidden():
    score = compatibility_score("bad$chars@here", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
    assert score < 100

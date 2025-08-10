from pydantic import BaseModel, AnyUrl, field_validator
from typing import Literal

from app.utils.character_sets import (
    TIER1_ALPHANUMERIC,
    TIER2_BASE64URL,
    TIER3_HEX,
)
from app.utils.validation import has_forbidden_chars


class BasicConfig(BaseModel):
    """Basic configuration model for Step 1 of the form.

    Attributes:
        site_url (AnyUrl): Base site URL.
        postgres_password (str): Postgres password, default Tier 1.
        smtp_pass (str): SMTP password, default Tier 1.
        postgres_charset (Literal["tier1", "tier2", "tier3"]): Allowed character set.
        smtp_charset (Literal["tier1", "tier2", "tier3"]): Allowed character set.
    """

    site_url: AnyUrl
    postgres_password: str
    smtp_pass: str

    postgres_charset: Literal["tier1", "tier2", "tier3"] = "tier1"
    smtp_charset: Literal["tier1", "tier2", "tier3"] = "tier1"

    @field_validator("postgres_password")
    @classmethod
    def validate_postgres_password(cls, v: str) -> str:
        """Ensure Postgres password is safe and long enough.

        Args:
            v (str): Input password.

        Returns:
            str: The original password if valid.
        """
        if len(v) < 32:
            raise ValueError("Postgres password must be at least 32 characters long")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"Postgres password contains forbidden characters: {''.join(chars)}")
        return v

    @field_validator("smtp_pass")
    @classmethod
    def validate_smtp_pass(cls, v: str) -> str:
        """Ensure SMTP password meets minimum safety.

        Args:
            v (str): Input password.

        Returns:
            str: The original password if valid.
        """
        if len(v) < 32:
            raise ValueError("SMTP password must be at least 32 characters long")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"SMTP password contains forbidden characters: {''.join(chars)}")
        return v


class Step2Config(BaseModel):
    """Security & Authentication configuration for Step 2.

    Attributes:
        jwt_secret (str): Base64URL-safe JWT secret, 64 characters.
        anon_key (str): Public (anon) API key, Base64URL-safe, 32 characters.
        service_role_key (str): Service role API key, Base64URL-safe, 32 characters.
        dashboard_password (str | None): Optional Tier 1 password for dashboard, min length 15.
    """

    jwt_secret: str
    anon_key: str
    service_role_key: str
    dashboard_password: str | None = None

    @field_validator("jwt_secret")
    @classmethod
    def validate_jwt_secret(cls, v: str) -> str:
        """Validate JWT secret as Tier 2, length 64, no forbidden characters.

        Args:
            v (str): Provided JWT secret.

        Returns:
            str: The original value if valid.
        """
        if len(v) != 64:
            raise ValueError("JWT secret must be exactly 64 characters long")
        if any(ch not in TIER2_BASE64URL for ch in v):
            raise ValueError("JWT secret must be Base64URL-safe (A-Za-z0-9-_ only)")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"JWT secret contains forbidden characters: {''.join(chars)}")
        return v

    @field_validator("anon_key")
    @classmethod
    def validate_anon_key(cls, v: str) -> str:
        """Validate anon API key as Tier 2, length 32.

        Args:
            v (str): Provided anon key.

        Returns:
            str: The original value if valid.
        """
        if len(v) != 32:
            raise ValueError("Anon API key must be exactly 32 characters long")
        if any(ch not in TIER2_BASE64URL for ch in v):
            raise ValueError("Anon API key must be Base64URL-safe (A-Za-z0-9-_ only)")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"Anon API key contains forbidden characters: {''.join(chars)}")
        return v

    @field_validator("service_role_key")
    @classmethod
    def validate_service_role_key(cls, v: str) -> str:
        """Validate service role API key as Tier 2, length 32.

        Args:
            v (str): Provided service role key.

        Returns:
            str: The original value if valid.
        """
        if len(v) != 32:
            raise ValueError("Service role API key must be exactly 32 characters long")
        if any(ch not in TIER2_BASE64URL for ch in v):
            raise ValueError("Service role API key must be Base64URL-safe (A-Za-z0-9-_ only)")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"Service role API key contains forbidden characters: {''.join(chars)}")
        return v

    @field_validator("dashboard_password")
    @classmethod
    def validate_dashboard_password(cls, v: str | None) -> str | None:
        """Validate optional dashboard password as Tier 1, length >= 15.

        Args:
            v (str | None): Optional password.

        Returns:
            str | None: The original value if valid (or None).
        """
        if v is None or v == "":
            return None
        if len(v) < 15:
            raise ValueError("Dashboard password must be at least 15 characters long")
        if any(ch not in TIER1_ALPHANUMERIC for ch in v):
            raise ValueError("Dashboard password must be alphanumeric (Tier 1)")
        forbidden, chars = has_forbidden_chars(v)
        if forbidden:
            raise ValueError(f"Dashboard password contains forbidden characters: {''.join(chars)}")
        return v

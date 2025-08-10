# Project Planning: Supabase Config Generator

## Purpose
A FastAPI web app that generates Supabase self-hosting configuration files (`.env`, `docker-compose.yml`, `docker-compose.override.yml`) while ensuring zero character-encoding issues via a strict three-tier character strategy.

## Architecture Overview
- Backend: FastAPI (Python 3.11+)
- Templates: Jinja2 (HTML), Tailwind (CSS; added later)
- State: SQLite (session form state only; ephemeral)
- Validation: Pydantic models + custom validators
- Generation: Jinja2 templates + Python `secrets` for tokens
- Packaging: In-memory ZIP for download

## Directory Structure
```
app/
  main.py                # FastAPI entry point
  models/
    __init__.py
    config.py            # Pydantic models for form/config data
  generators/
    __init__.py
    env_generator.py     # .env file generation
    compose_generator.py # docker-compose.yml generation
    secrets_generator.py # Secure token wrappers
  templates/
    base.html            # Base layout
    index.html           # Landing page
    forms/               # Step templates (added later)
    config_files/        # File templates (added later)
  static/
    styles.css           # Minimal styles placeholder
  utils/
    __init__.py
    character_sets.py    # Character set constants & token generation
    validation.py        # Forbidden-char checks, scoring

tests/
  test_character_sets.py
  test_validation.py
```

## Naming & Conventions
- Python: PEP8, type hints, Google-style docstrings
- Files < 500 LOC; split into focused modules
- Relative imports within `app/` package
- Use `pydantic` for all external data validation

## Security & Data Handling
- No credential persistence; handle in-memory only
- Avoid logging sensitive values
- Enforce HTTPS in prod (Nginx → Uvicorn)
- Rate limiting (to be added)

## Character Strategy (Critical)
- Tier 1 (default): Alphanumeric `A–Z a–z 0–9`
- Tier 2: Base64URL-safe `A–Z a–z 0–9 - _`
- Tier 3: Hex-only `0–9 A–F`
- Forbidden: `$ @ : / # ? % = ; & { } * ! | > < \\`

## Initial Milestones
- Scaffold project and utilities (this commit)
- Implement minimal Pydantic models
- Add env/compose template stubs
- Add ZIP packaging
- Add 3-step forms and validation (phased)

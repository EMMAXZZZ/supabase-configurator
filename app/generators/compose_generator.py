"""docker-compose generation (skeleton)."""
from __future__ import annotations

from typing import Dict

from jinja2 import Template

COMPOSE_TEMPLATE = Template(
    """
version: '3.9'
services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data

# ---
# Security & Authentication (Step 2) preview variables
# These are provided in .env and consumed by Supabase services in a full compose.
# Shown here for visibility only.
# JWT_SECRET=${JWT_SECRET}
# ANON_KEY=${ANON_KEY}
# SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
# DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
volumes:
  db_data:
""".strip()
)


def render_compose(context: Dict[str, str]) -> str:
    """Render docker-compose.yml content.

    Args:
        context (Dict[str, str]): Values to render.

    Returns:
        str: Rendered YAML content.
    """
    return COMPOSE_TEMPLATE.render(**context)

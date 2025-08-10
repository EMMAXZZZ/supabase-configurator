import time
from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError
from slowapi.util import get_remote_address

from app.models.config import BasicConfig, Step2Config
from app.generators.env_generator import render_env
from app.generators.compose_generator import render_compose
from app.utils.character_sets import generate_tier1_token, generate_tier2_token
from app.middleware.rate_limiter import (
    limiter, 
    setup_rate_limiter, 
    FORM_RATE_LIMIT, 
    API_RATE_LIMIT, 
    HEALTH_RATE_LIMIT
)
from app.config.logging_config import setup_logging, get_logger, log_security_event
from app.monitoring.health_checks import health_checker

# Setup logging first
setup_logging()
logger = get_logger("app.main")

app = FastAPI(title="Supabase Config Generator")

# Setup rate limiting
setup_rate_limiter(app)

# Static and templates
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

# Log application startup
logger.info("Supabase Config Generator starting up")


@app.get("/health")
@limiter.limit(HEALTH_RATE_LIMIT)
async def health(request: Request) -> dict:
    """Simple health endpoint.

    Returns:
        dict: Health status payload.
    """
    return {"status": "ok"}


@app.get("/health/detailed")
@limiter.limit(HEALTH_RATE_LIMIT)
async def health_detailed(request: Request) -> dict:
    """Detailed health check endpoint with comprehensive system monitoring.

    Returns:
        dict: Comprehensive health status including system metrics
    """
    try:
        health_status = await health_checker.run_all_checks()
        logger.info(f"Health check completed: {health_status['status']}")
        return health_status
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": time.time(),
            "error": f"Health check system failure: {str(e)}"
        }


@app.get("/", response_class=HTMLResponse)
@limiter.limit(API_RATE_LIMIT)
async def index(request: Request) -> HTMLResponse:
    """Landing page.

    Args:
        request (Request): FastAPI request object.

    Returns:
        HTMLResponse: Rendered template response.
    """
    return templates.TemplateResponse(request, "index.html")


@app.get("/form/step1", response_class=HTMLResponse)
@limiter.limit(API_RATE_LIMIT)
async def step1_get(request: Request) -> HTMLResponse:
    """Render Step 1 form with default/generated values.

    Returns an empty preview by default. Users can generate example values or submit for preview.
    """
    context = {
        "request": request,
        "form_values": {
            "site_url": "http://localhost",
            "postgres_password": generate_tier1_token(32),
            "smtp_pass": generate_tier1_token(32),
        },
        "errors": [],
        "preview_env": None,
        "preview_compose": None,
    }
    return templates.TemplateResponse(request, "forms/step1.html", context)


@app.get("/form/step2", response_class=HTMLResponse)
@limiter.limit(API_RATE_LIMIT)
async def step2_get(request: Request) -> HTMLResponse:
    """Render Step 2 form (Security & Authentication).

    Includes JWT secret, anon key, service role key, and optional dashboard password.
    """
    context = {
        "request": request,
        "form_values": {
            "jwt_secret": generate_tier2_token(64),
            "anon_key": generate_tier2_token(32),
            "service_role_key": generate_tier2_token(32),
            "dashboard_password": "",
        },
        "errors": [],
        "preview_security": None,
    }
    return templates.TemplateResponse(request, "forms/step2.html", context)


@app.post("/form/step2", response_class=HTMLResponse)
@limiter.limit(FORM_RATE_LIMIT)
async def step2_post(
    request: Request,
    jwt_secret: str = Form(...),
    anon_key: str = Form(...),
    service_role_key: str = Form(...),
    dashboard_password: str = Form(""),
    action: str = Form("preview"),
) -> HTMLResponse:
    """Handle Step 2 submission.

    - generate: regenerate any empty fields with Tier 2 (or Tier 1 for dashboard) and re-render
    - preview: validate via Pydantic and show a security preview block
    """
    form_values = {
        "jwt_secret": jwt_secret,
        "anon_key": anon_key,
        "service_role_key": service_role_key,
        "dashboard_password": dashboard_password,
    }

    if action == "generate":
        if not jwt_secret:
            form_values["jwt_secret"] = generate_tier2_token(64)
        if not anon_key:
            form_values["anon_key"] = generate_tier2_token(32)
        if not service_role_key:
            form_values["service_role_key"] = generate_tier2_token(32)
        # Generate Tier1 dashboard password if empty; otherwise leave as user-provided
        if not dashboard_password:
            form_values["dashboard_password"] = generate_tier1_token(16)
        context = {
            "request": request,
            "form_values": form_values,
            "errors": [],
            "preview_security": None,
        }
        return templates.TemplateResponse(request, "forms/step2.html", context)

    errors = []
    preview_security = None
    try:
        cfg2 = Step2Config(
            jwt_secret=form_values["jwt_secret"],
            anon_key=form_values["anon_key"],
            service_role_key=form_values["service_role_key"],
            dashboard_password=(form_values["dashboard_password"] or None),
        )
        # Build a .env preview snippet using the shared env generator (Step 2 values only)
        env_context = {
            "jwt_secret": cfg2.jwt_secret,
            "anon_key": cfg2.anon_key,
            "service_role_key": cfg2.service_role_key,
            "dashboard_password": cfg2.dashboard_password or "",
        }
        preview_security = render_env(env_context)
    except ValidationError as ve:
        client_ip = get_remote_address(request)
        log_security_event(
            "validation_error",
            {"endpoint": "/form/step2", "errors": [e.get("msg") for e in ve.errors()]},
            client_ip
        )
        for e in ve.errors():
            loc = ".".join(str(p) for p in e.get("loc", []))
            msg = e.get("msg", "Invalid input")
            errors.append(f"{loc}: {msg}")

    context = {
        "request": request,
        "form_values": form_values,
        "errors": errors,
        "preview_security": preview_security,
    }
    return templates.TemplateResponse(request, "forms/step2.html", context)


@app.post("/form/step1", response_class=HTMLResponse)
@limiter.limit(FORM_RATE_LIMIT)
async def step1_post(
    request: Request,
    site_url: str = Form(...),
    postgres_password: str = Form(""),
    smtp_pass: str = Form(""),
    action: str = Form("preview"),
) -> HTMLResponse:
    """Handle Step 1 submission.

    Two actions supported:
    - generate: regenerate any empty fields with Tier1 tokens and re-render the form (no preview)
    - preview: validate input via Pydantic and render .env and docker-compose previews
    """
    form_values = {
        "site_url": site_url,
        "postgres_password": postgres_password,
        "smtp_pass": smtp_pass,
    }

    if action == "generate":
        if not postgres_password:
            form_values["postgres_password"] = generate_tier1_token(32)
        if not smtp_pass:
            form_values["smtp_pass"] = generate_tier1_token(32)
        context = {
            "request": request,
            "form_values": form_values,
            "errors": [],
            "preview_env": None,
            "preview_compose": None,
        }
        return templates.TemplateResponse(request, "forms/step1.html", context)

    # Default path: preview
    errors = []
    preview_env = None
    preview_compose = None
    try:
        cfg = BasicConfig(
            site_url=form_values["site_url"],
            postgres_password=form_values["postgres_password"],
            smtp_pass=form_values["smtp_pass"],
        )
        preview_env = render_env(
            {
                "postgres_password": cfg.postgres_password,
                "smtp_pass": cfg.smtp_pass,
                "site_url": str(cfg.site_url),
            }
        )
        preview_compose = render_compose(
            {
                # currently not substituting env into compose; preview basic structure
            }
        )
    except ValidationError as ve:
        client_ip = get_remote_address(request)
        log_security_event(
            "validation_error",
            {"endpoint": "/form/step1", "errors": [e.get("msg") for e in ve.errors()]},
            client_ip
        )
        for e in ve.errors():
            loc = ".".join(str(p) for p in e.get("loc", []))
            msg = e.get("msg", "Invalid input")
            errors.append(f"{loc}: {msg}")

    context = {
        "request": request,
        "form_values": form_values,
        "errors": errors,
        "preview_env": preview_env,
        "preview_compose": preview_compose,
    }
    return templates.TemplateResponse(request, "forms/step1.html", context)

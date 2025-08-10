# TASKS

Date: 2025-08-10

## Current Sprint (Initialization)
- [x] Create PLANNING.md with architecture and structure
- [x] Create TASK.md and seed initial tasks
- [x] Scaffold FastAPI app (`app/` tree)
- [x] Add utilities: `character_sets.py`, `validation.py`
- [x] Add minimal Pydantic model(s)
- [x] Add tests for utilities
- [x] Add README and requirements
- [ ] Implement generation templates and logic
- [x] Implement Step 1 form (Basic) with validation and preview
- [x] Implement Step 2 form (Security & Auth)
- [ ] Implement Step 3 form (Advanced Options)
- [ ] ZIP packaging and download
- [ ] Security hardening (headers, rate limiting)

## Discovered During Work
- [ ] Add Tailwind build setup when UI is implemented
- [ ] Add configuration syntax validation for YAML/env
 - [x] Integrate Step 2 values into `.env` and compose previews; use `render_env()` in `step2_post`
 - [x] Add pytest for env generator Step 2 keys (`tests/test_env_generator_step2.py`)
 - [x] Integrate `.superdesign` theme (fonts, buttons) into `base.html`, `forms/step1.html`, `forms/step2.html`

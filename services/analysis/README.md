# LogoAI Analysis Service

FastAPI service for deterministic raster/vector logo analysis (color palette, contrast, symmetry, whitespace, scalability signals — see [ROADMAP.md](../../ROADMAP.md) Phase 1.2). `apps/web` calls this service and combines its output with Claude's reasoning; it does not reason about design itself.

## Develop

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

## Endpoints

- `GET /health`
- `POST /analyze` — stub for now; returns real deterministic facts once Phase 1.2 lands.

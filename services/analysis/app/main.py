import io

from fastapi import FastAPI, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel

from .analysis.facts import build_facts
from .analysis.vector import parse_svg_structure, rasterize_svg
from .models import AnalysisFacts

app = FastAPI(title="LogoAI Analysis Service")

RASTER_CONTENT_TYPES = {"image/png", "image/jpeg"}
VECTOR_CONTENT_TYPES = {"image/svg+xml"}


class HealthResponse(BaseModel):
    status: str


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.post("/analyze", response_model=AnalysisFacts)
async def analyze(file: UploadFile) -> AnalysisFacts:
    contents = await file.read()
    content_type = file.content_type or ""
    filename = file.filename or "unknown"

    if content_type in RASTER_CONTENT_TYPES:
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGBA")
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Could not decode image") from exc
        return build_facts(
            image,
            filename=filename,
            content_type=content_type,
            size_bytes=len(contents),
            kind="raster",
        )

    if content_type in VECTOR_CONTENT_TYPES:
        try:
            structure = parse_svg_structure(contents)
            image = rasterize_svg(contents)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Could not parse/render SVG") from exc
        return build_facts(
            image,
            filename=filename,
            content_type=content_type,
            size_bytes=len(contents),
            kind="vector",
            vector_structure=structure,
        )

    raise HTTPException(status_code=400, detail=f"Unsupported content type: {content_type}")

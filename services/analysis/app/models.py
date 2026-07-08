from typing import Literal

from pydantic import BaseModel


class PaletteColorModel(BaseModel):
    hex: str
    rgb: tuple[int, int, int]
    coverage: float


class ContrastCheck(BaseModel):
    hex: str
    rgb: tuple[int, int, int]
    coverage: float
    contrast_vs_white: float
    contrast_vs_black: float
    meets_aa_normal_text_vs_white: bool
    meets_aa_normal_text_vs_black: bool
    # Set only when `background_color` is present on AnalysisFacts — the
    # contrast this ink color actually has against the artwork's own
    # existing canvas fill, as opposed to the hypothetical white/black
    # placements above. This is what the logo looks like *today*.
    contrast_vs_own_background: float | None = None
    meets_aa_normal_text_vs_own_background: bool | None = None


class ScalabilitySizeResult(BaseModel):
    edge_density: float
    detail_retention_ratio: float


class ScalabilitySignal(BaseModel):
    full_resolution_edge_density: float
    by_size: dict[str, ScalabilitySizeResult]


class CompositionMetrics(BaseModel):
    whitespace_ratio: float
    vertical_symmetry_score: float | None


class CenterOfMass(BaseModel):
    centroid_x_ratio: float
    centroid_y_ratio: float
    x_offset_pct: float
    y_offset_pct: float


class QuadrantComplexity(BaseModel):
    top_left: float
    top_right: float
    bottom_left: float
    bottom_right: float


class BalanceMetrics(BaseModel):
    center_of_mass: CenterOfMass | None
    quadrant_complexity: QuadrantComplexity | None


class VectorStructure(BaseModel):
    path_count: int
    group_count: int
    has_embedded_text: bool
    has_embedded_raster_image: bool


class AnalysisFacts(BaseModel):
    filename: str
    content_type: str
    size_bytes: int
    kind: Literal["raster", "vector"]
    width: int
    height: int
    has_transparency: bool
    # Set when the artwork has a uniform baked-in canvas fill (an SVG
    # background rect, or a raster flattened onto a solid color) — see
    # `detect_background_color`. This color is excluded from `palette` and
    # `contrast_checks` below: it's the artwork's own container, not
    # foreground ink, so it must never be judged as if it were text color.
    background_color: PaletteColorModel | None = None
    palette: list[PaletteColorModel]
    contrast_checks: list[ContrastCheck]
    composition: CompositionMetrics
    balance: BalanceMetrics
    scalability: ScalabilitySignal
    vector_structure: VectorStructure | None = None
    # The exact raster bytes these facts were computed from — the original
    # upload for raster inputs, or the resvg-rendered bitmap for SVGs. This
    # is what a caller should hand to an AI provider's vision input; SVG XML
    # itself is not a valid image payload for either Claude's or Gemini's
    # vision APIs.
    rendered_png_base64: str

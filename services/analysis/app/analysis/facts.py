"""Orchestrates the individual metric modules into the final AnalysisFacts
response shape. This is the only place that knows about the Pydantic
response model — the metric modules (color/composition/scalability) stay
independent of the API layer.
"""

from __future__ import annotations

import base64
import io

import numpy as np
from PIL import Image

from ..models import (
    AnalysisFacts,
    BalanceMetrics,
    CenterOfMass,
    CompositionMetrics,
    ContrastCheck,
    PaletteColorModel,
    QuadrantComplexity,
    ScalabilitySignal,
    ScalabilitySizeResult,
    VectorStructure,
)
from .balance import center_of_mass, quadrant_complexity
from .color import (
    contrast_against_reference_backgrounds,
    contrast_ratio,
    coverage_of_color,
    detect_background_color,
    extract_palette,
    meets_wcag_aa,
)
from .composition import vertical_symmetry_score, whitespace_ratio
from .scalability import legibility_signal
from .vector import SvgStructure

PALETTE_SIZE = 5


def _has_transparency(image: Image.Image) -> bool:
    rgba = np.array(image.convert("RGBA"))
    return bool((rgba[:, :, 3] < 255).any())


def _encode_png_base64(image: Image.Image) -> str:
    buf = io.BytesIO()
    image.convert("RGBA").save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")


def build_facts(
    image: Image.Image,
    *,
    filename: str,
    content_type: str,
    size_bytes: int,
    kind: str,
    vector_structure: SvgStructure | None = None,
) -> AnalysisFacts:
    width, height = image.size

    background_rgb = detect_background_color(image)
    background_color = (
        PaletteColorModel(
            hex="#{:02x}{:02x}{:02x}".format(*background_rgb),
            rgb=background_rgb,
            coverage=coverage_of_color(image, background_rgb),
        )
        if background_rgb is not None
        else None
    )

    palette = extract_palette(image, n_colors=PALETTE_SIZE, exclude_rgb=background_rgb)
    contrast_checks = []
    for color in palette:
        contrast = contrast_against_reference_backgrounds(color.rgb)
        own_background_ratio = (
            contrast_ratio(color.rgb, background_rgb) if background_rgb is not None else None
        )
        contrast_checks.append(
            ContrastCheck(
                hex=color.hex,
                rgb=color.rgb,
                coverage=color.coverage,
                contrast_vs_white=contrast["white"],
                contrast_vs_black=contrast["black"],
                meets_aa_normal_text_vs_white=meets_wcag_aa(contrast["white"]),
                meets_aa_normal_text_vs_black=meets_wcag_aa(contrast["black"]),
                contrast_vs_own_background=own_background_ratio,
                meets_aa_normal_text_vs_own_background=(
                    meets_wcag_aa(own_background_ratio) if own_background_ratio is not None else None
                ),
            )
        )

    composition = CompositionMetrics(
        whitespace_ratio=whitespace_ratio(image, background_rgb=background_rgb),
        vertical_symmetry_score=vertical_symmetry_score(image, background_rgb=background_rgb),
    )

    raw_center_of_mass = center_of_mass(image, background_rgb=background_rgb)
    raw_quadrant_complexity = quadrant_complexity(image, background_rgb=background_rgb)
    balance = BalanceMetrics(
        center_of_mass=CenterOfMass(**raw_center_of_mass) if raw_center_of_mass else None,
        quadrant_complexity=(
            QuadrantComplexity(**raw_quadrant_complexity) if raw_quadrant_complexity else None
        ),
    )

    raw_scalability = legibility_signal(image)
    scalability = ScalabilitySignal(
        full_resolution_edge_density=raw_scalability["full_resolution_edge_density"],
        by_size={
            str(size): ScalabilitySizeResult(**result)
            for size, result in raw_scalability["by_size"].items()
        },
    )

    return AnalysisFacts(
        filename=filename,
        content_type=content_type,
        size_bytes=size_bytes,
        kind=kind,
        width=width,
        height=height,
        has_transparency=_has_transparency(image),
        background_color=background_color,
        palette=[PaletteColorModel(hex=c.hex, rgb=c.rgb, coverage=c.coverage) for c in palette],
        contrast_checks=contrast_checks,
        composition=composition,
        balance=balance,
        scalability=scalability,
        rendered_png_base64=_encode_png_base64(image),
        vector_structure=(
            VectorStructure(
                path_count=vector_structure.path_count,
                group_count=vector_structure.group_count,
                has_embedded_text=vector_structure.has_embedded_text,
                has_embedded_raster_image=vector_structure.has_embedded_raster_image,
            )
            if vector_structure
            else None
        ),
    )

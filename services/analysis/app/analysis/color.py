"""Color palette extraction and WCAG 2.x contrast calculations.

Contrast math follows the WCAG 2.x definition exactly (relative luminance
requires linearizing each sRGB channel before applying the luminance
weights — using raw 0-255 sRGB values directly against the 0.2126/0.7152/
0.0722 coefficients is the most common implementation bug and gives wrong
ratios).
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from PIL import Image

ALPHA_OPAQUE_THRESHOLD = 16  # pixels below this alpha are excluded as "not real ink"


@dataclass(frozen=True)
class PaletteColor:
    hex: str
    rgb: tuple[int, int, int]
    coverage: float  # fraction of opaque pixels this color represents


def _rgb_to_hex(rgb: tuple[int, int, int]) -> str:
    return "#{:02x}{:02x}{:02x}".format(*rgb)


BACKGROUND_COLOR_TOLERANCE = 6  # max per-channel diff to still count as "the same color"


def detect_background_color(image: Image.Image) -> tuple[int, int, int] | None:
    """Many uploads aren't drawn on a transparent field — an SVG with a
    full-bleed background rect, or a raster export flattened onto a solid
    color, both produce a fully opaque image where the canvas fill itself
    would otherwise get quantized and treated as "logo ink". Sampling the
    four corners is a cheap, deterministic proxy for "is there a uniform
    background": real logo ink essentially never touches all four corners
    of its own canvas, so corner agreement is a strong signal it's a fill,
    not artwork. Transparent corners or disagreeing corners (a busy/photo
    background, or artwork that bleeds to the edge) return None rather than
    guessing.
    """
    rgba = np.array(image.convert("RGBA"))
    h, w = rgba.shape[:2]
    corners = [rgba[0, 0], rgba[0, w - 1], rgba[h - 1, 0], rgba[h - 1, w - 1]]
    if any(corner[3] < ALPHA_OPAQUE_THRESHOLD for corner in corners):
        return None

    first = tuple(int(v) for v in corners[0][:3])
    for corner in corners[1:]:
        rest = tuple(int(v) for v in corner[:3])
        if max(abs(a - b) for a, b in zip(first, rest)) > BACKGROUND_COLOR_TOLERANCE:
            return None
    return first


def coverage_of_color(
    image: Image.Image, rgb: tuple[int, int, int], *, tolerance: int = BACKGROUND_COLOR_TOLERANCE
) -> float:
    """Fraction of opaque pixels matching `rgb` within `tolerance` per channel."""
    rgba = np.array(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    opaque_mask = alpha >= ALPHA_OPAQUE_THRESHOLD
    total_opaque = int(opaque_mask.sum())
    if total_opaque == 0:
        return 0.0
    diff = np.abs(rgba[:, :, :3].astype(int) - np.array(rgb)).max(axis=2)
    match_mask = opaque_mask & (diff <= tolerance)
    return float(match_mask.sum()) / total_opaque


def extract_palette(
    image: Image.Image,
    n_colors: int = 5,
    *,
    exclude_rgb: tuple[int, int, int] | None = None,
) -> list[PaletteColor]:
    """Dominant colors via median-cut quantization (Pillow's `.quantize()`),
    restricted to pixels that are actually opaque enough to count as drawn
    content — a transparent background must never appear in a logo's color
    palette. `exclude_rgb` additionally masks out a detected background fill
    (see `detect_background_color`) so a canvas color never gets treated as
    foreground ink.
    """
    rgba = np.array(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    opaque_mask = alpha >= ALPHA_OPAQUE_THRESHOLD
    if exclude_rgb is not None:
        diff = np.abs(rgba[:, :, :3].astype(int) - np.array(exclude_rgb)).max(axis=2)
        opaque_mask &= diff > BACKGROUND_COLOR_TOLERANCE
    opaque_pixels = rgba[opaque_mask][:, :3]

    if opaque_pixels.size == 0:
        return []

    # Reshape the flat list of opaque pixels into a 1-row image so
    # Image.quantize (which needs an Image, not an arbitrary pixel array)
    # can run median-cut over exactly the pixels we care about.
    flat_image = Image.fromarray(opaque_pixels.reshape(1, -1, 3), mode="RGB")
    n_colors = max(1, min(n_colors, opaque_pixels.shape[0]))
    quantized = flat_image.quantize(colors=n_colors, method=Image.MEDIANCUT)

    palette_bytes = quantized.getpalette() or []
    counts = quantized.getcolors(maxcolors=flat_image.width) or []
    total = sum(count for count, _ in counts)

    results: list[PaletteColor] = []
    for count, palette_index in sorted(counts, key=lambda c: c[0], reverse=True):
        offset = palette_index * 3
        rgb = tuple(palette_bytes[offset : offset + 3])
        if len(rgb) != 3:
            continue
        results.append(
            PaletteColor(
                hex=_rgb_to_hex(rgb),
                rgb=rgb,
                coverage=count / total if total else 0.0,
            )
        )
    return results


def relative_luminance(rgb: tuple[int, int, int]) -> float:
    """WCAG 2.x relative luminance — each channel is gamma-decoded
    (sRGB -> linear) before the 0.2126/0.7152/0.0722 weighting."""

    def linearize(channel_8bit: int) -> float:
        c = channel_8bit / 255.0
        if c <= 0.03928:
            return c / 12.92
        return ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (linearize(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast_ratio(rgb1: tuple[int, int, int], rgb2: tuple[int, int, int]) -> float:
    """WCAG 2.x contrast ratio, always expressed as a value >= 1."""
    l1 = relative_luminance(rgb1)
    l2 = relative_luminance(rgb2)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


WHITE = (255, 255, 255)
BLACK = (0, 0, 0)


def contrast_against_reference_backgrounds(rgb: tuple[int, int, int]) -> dict[str, float]:
    """A logo is placed on arbitrary backgrounds in practice — white and
    black are the two most common real-world placements, so both are
    reported rather than picking one and implying it's definitive."""
    return {
        "white": contrast_ratio(rgb, WHITE),
        "black": contrast_ratio(rgb, BLACK),
    }


def meets_wcag_aa(ratio: float, *, large_text: bool = False) -> bool:
    """Objective WCAG 2.x AA thresholds (4.5:1 normal, 3:1 large) — this is
    a deterministic application of a fixed spec value, not a subjective
    judgment call, so it belongs in the facts layer alongside the raw ratio.
    """
    return ratio >= (3.0 if large_text else 4.5)

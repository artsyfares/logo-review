"""Composition metrics: bounding box, whitespace ratio, bilateral symmetry.

Symmetry is measured on the alpha/ink mask rather than color, and cropped to
the artwork's own bounding box first — otherwise off-center placement within
a canvas reads as "asymmetric" when the actual mark is perfectly symmetric.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from .color import ALPHA_OPAQUE_THRESHOLD, BACKGROUND_COLOR_TOLERANCE

RGB = tuple[int, int, int]


def ink_mask(
    rgba: np.ndarray, alpha_threshold: int, background_rgb: RGB | None
) -> np.ndarray:
    """True where a pixel is opaque *and* isn't a match for a detected
    canvas background fill (see `color.detect_background_color`) — without
    the second check, artwork with a baked-in background rect reads as
    "100% ink, 0% whitespace" and its bounding box as the entire canvas,
    which in turn made symmetry scoring always report a false 1.0 (every
    pixel counted as ink, so the mask trivially mirrors itself).
    """
    mask = rgba[:, :, 3] >= alpha_threshold
    if background_rgb is not None:
        diff = np.abs(rgba[:, :, :3].astype(int) - np.array(background_rgb)).max(axis=2)
        mask &= diff > BACKGROUND_COLOR_TOLERANCE
    return mask


def bounding_box(
    rgba: np.ndarray,
    alpha_threshold: int = ALPHA_OPAQUE_THRESHOLD,
    background_rgb: RGB | None = None,
):
    """Returns (left, top, right, lower) in PIL box convention, or None if
    the image has no ink content at all."""
    mask = ink_mask(rgba, alpha_threshold, background_rgb)
    if not mask.any():
        return None
    rows = np.any(mask, axis=1)
    cols = np.any(mask, axis=0)
    top, bottom = np.where(rows)[0][[0, -1]]
    left, right = np.where(cols)[0][[0, -1]]
    return (int(left), int(top), int(right) + 1, int(bottom) + 1)


def whitespace_ratio(
    image: Image.Image,
    alpha_threshold: int = ALPHA_OPAQUE_THRESHOLD,
    background_rgb: RGB | None = None,
) -> float:
    """Fraction of the full canvas that is transparent/background rather
    than ink — the negative-space measure from docs/PRODUCT_VISION.md's
    analysis list."""
    rgba = np.array(image.convert("RGBA"))
    mask = ink_mask(rgba, alpha_threshold, background_rgb)
    total = mask.size
    if total == 0:
        return 0.0
    return 1.0 - (int(mask.sum()) / total)


def vertical_symmetry_score(
    image: Image.Image,
    alpha_threshold: int = ALPHA_OPAQUE_THRESHOLD,
    background_rgb: RGB | None = None,
) -> float | None:
    """1.0 = perfectly mirror-symmetric across the vertical axis, 0.0 =
    maximally asymmetric. None if the image has no ink content to measure
    (e.g. a fully transparent, or fully background-colored, canvas)."""
    rgba = np.array(image.convert("RGBA"))
    box = bounding_box(rgba, alpha_threshold, background_rgb)
    if box is None:
        return None

    left, top, right, bottom = box
    cropped_rgba = rgba[top:bottom, left:right]
    mask = ink_mask(cropped_rgba, alpha_threshold, background_rgb).astype(np.float32)

    if mask.size == 0:
        return None

    mirrored = np.fliplr(mask)
    diff = np.abs(mask - mirrored)
    return float(1.0 - diff.mean())

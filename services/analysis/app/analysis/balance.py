"""Visual-balance signals: where the ink's center of mass sits relative to
the geometric center of the canvas, and how visual complexity (edge detail)
is distributed across the four quadrants of the mark's own bounding box.

Both reuse `composition.ink_mask`/`bounding_box` rather than redefining what
counts as "ink" — a baked-in canvas background must not skew either signal,
same reasoning as the composition/contrast fixes.
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter

from .color import ALPHA_OPAQUE_THRESHOLD
from .composition import RGB, bounding_box, ink_mask
from .scalability import EDGE_MAGNITUDE_THRESHOLD


def center_of_mass(
    image: Image.Image,
    alpha_threshold: int = ALPHA_OPAQUE_THRESHOLD,
    background_rgb: RGB | None = None,
) -> dict | None:
    """The ink's centroid position (as a 0-1 ratio of canvas width/height)
    and how far that deviates from the exact geometric center, as a
    percentage where 0% = perfectly centered and 100% = centroid sits at
    the canvas edge. None if there's no ink to measure.
    """
    rgba = np.array(image.convert("RGBA"))
    mask = ink_mask(rgba, alpha_threshold, background_rgb)
    if not mask.any():
        return None

    h, w = mask.shape
    ys, xs = np.nonzero(mask)
    centroid_x_ratio = float(xs.mean() / (w - 1)) if w > 1 else 0.5
    centroid_y_ratio = float(ys.mean() / (h - 1)) if h > 1 else 0.5

    return {
        "centroid_x_ratio": centroid_x_ratio,
        "centroid_y_ratio": centroid_y_ratio,
        "x_offset_pct": abs(centroid_x_ratio - 0.5) * 200,
        "y_offset_pct": abs(centroid_y_ratio - 0.5) * 200,
    }


def quadrant_complexity(
    image: Image.Image,
    alpha_threshold: int = ALPHA_OPAQUE_THRESHOLD,
    background_rgb: RGB | None = None,
) -> dict | None:
    """Each quadrant's share of the mark's total edge detail (sums to
    100%), cropped to the mark's own bounding box first so canvas padding
    doesn't dilute the result. None if there's no ink to measure.
    """
    rgba = np.array(image.convert("RGBA"))
    box = bounding_box(rgba, alpha_threshold, background_rgb)
    if box is None:
        return None

    left, top, right, bottom = box
    cropped = Image.fromarray(rgba[top:bottom, left:right], mode="RGBA")
    gray = cropped.convert("L")
    edges = np.array(gray.filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    edge_mask = edges > EDGE_MAGNITUDE_THRESHOLD

    h, w = edge_mask.shape
    mid_y, mid_x = h // 2, w // 2
    counts = {
        "top_left": int(edge_mask[:mid_y, :mid_x].sum()),
        "top_right": int(edge_mask[:mid_y, mid_x:].sum()),
        "bottom_left": int(edge_mask[mid_y:, :mid_x].sum()),
        "bottom_right": int(edge_mask[mid_y:, mid_x:].sum()),
    }
    total = sum(counts.values())
    if total == 0:
        return None
    return {key: value / total * 100 for key, value in counts.items()}

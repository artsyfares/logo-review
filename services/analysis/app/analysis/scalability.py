"""Scalability / legibility-at-small-size signal.

Approach: measure edge sharpness (via Pillow's built-in edge-detection
kernel) at full resolution, then again after downscaling to common small
render sizes (favicon/app-icon scale) and back up. A low ratio of small-size
to full-size edge sharpness means a meaningful amount of fine detail present
in the artwork disappears or aliases away once the logo is rendered small —
a concrete, measurable legibility-risk signal, reported as a ratio rather
than a subjective "risky/safe" verdict (that interpretation belongs to the
LLM reasoning layer, not this deterministic one).

Sharpness is measured as the STANDARD DEVIATION of the edge-magnitude map,
not a count of pixels above a fixed threshold. A fixed threshold is fooled
by blur on high-contrast art: softening a crisp 1-2px transition spreads it
into a wider band that can still clear an absolute magnitude cutoff at MORE
pixels than the original crisp edge occupied, making blurred art look
"denser" in edges than the sharp original. Standard deviation instead
measures how concentrated/peaked the magnitude distribution is — a crisp
edge produces a few very high spikes against a near-zero background (high
variance); blurring flattens those spikes into a lower, smoother
distribution (lower variance) regardless of how many pixels end up above
any single cutoff.
"""

from __future__ import annotations

import numpy as np
from PIL import Image, ImageFilter, ImageOps

# Used by balance.py's quadrant_complexity, which compares edge distribution
# WITHIN one un-blurred render (no cross-resolution comparison), where a
# fixed threshold doesn't have the blur-widening problem described above.
EDGE_MAGNITUDE_THRESHOLD = 32  # 0-255 scale; below this is treated as noise, not a real edge
DEFAULT_SMALL_SIZES = (16, 32, 48, 64, 96, 128)


def _edge_sharpness(image: Image.Image) -> float:
    gray = image.convert("L")
    edges = gray.filter(ImageFilter.FIND_EDGES)
    edges_arr = np.array(edges, dtype=np.float32)
    if edges_arr.size == 0:
        return 0.0
    return float(edges_arr.std())


def legibility_signal(
    image: Image.Image, small_sizes: tuple[int, ...] = DEFAULT_SMALL_SIZES
) -> dict:
    full_resolution_edge_density = _edge_sharpness(image)

    by_size: dict[int, dict] = {}
    for size in small_sizes:
        # Fit within a size x size box preserving aspect ratio -- a naive
        # square resize would distort non-square logos (e.g. wide wordmark
        # lockups), which never happens in real-world small-scale usage.
        small = ImageOps.contain(image, (size, size), Image.LANCZOS)
        # Measure sharpness after resizing back UP to the original canvas
        # size, rather than on the tiny image itself, so the two
        # measurements are on canvases of the same size and are directly
        # comparable.
        round_tripped = small.resize(image.size, Image.LANCZOS)
        small_edge_density = _edge_sharpness(round_tripped)
        retention_ratio = (
            min(small_edge_density / full_resolution_edge_density, 1.0)
            if full_resolution_edge_density > 0
            else 1.0
        )
        by_size[size] = {
            "edge_density": small_edge_density,
            "detail_retention_ratio": retention_ratio,
        }

    return {
        "full_resolution_edge_density": full_resolution_edge_density,
        "by_size": by_size,
    }

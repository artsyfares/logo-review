import numpy as np
import pytest
from PIL import Image

from app.analysis.balance import center_of_mass, quadrant_complexity


def _image_from_alpha_mask(mask: np.ndarray) -> Image.Image:
    h, w = mask.shape
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    arr[:, :, 3] = mask * 255
    return Image.fromarray(arr, mode="RGBA")


def test_center_of_mass_none_for_empty_image():
    image = _image_from_alpha_mask(np.zeros((20, 20), dtype=np.uint8))
    assert center_of_mass(image) is None


def test_center_of_mass_centered_square_has_zero_offset():
    mask = np.zeros((20, 20), dtype=np.uint8)
    mask[5:15, 5:15] = 1  # centered square
    image = _image_from_alpha_mask(mask)

    result = center_of_mass(image)

    assert result["x_offset_pct"] == pytest.approx(0.0, abs=1.0)
    assert result["y_offset_pct"] == pytest.approx(0.0, abs=1.0)
    assert result["centroid_x_ratio"] == pytest.approx(0.5, abs=0.05)


def test_center_of_mass_offcenter_square_has_nonzero_offset():
    # A square entirely in the left half of the canvas -> centroid well
    # left of the geometric center.
    mask = np.zeros((20, 20), dtype=np.uint8)
    mask[8:12, 0:4] = 1
    image = _image_from_alpha_mask(mask)

    result = center_of_mass(image)

    assert result["x_offset_pct"] > 30
    assert result["centroid_x_ratio"] < 0.5


def test_quadrant_complexity_none_for_empty_image():
    image = _image_from_alpha_mask(np.zeros((20, 20), dtype=np.uint8))
    assert quadrant_complexity(image) is None


def _opaque_white_canvas(size: int) -> np.ndarray:
    # `.convert("L")` (used for edge detection) ignores alpha entirely, so
    # fixtures need real RGB contrast between "ink" and "background" -- an
    # alpha-only distinction (both RGB (0,0,0)) is invisible to it. Matches
    # the opaque-canvas pattern already used in test_composition.py.
    arr = np.zeros((size, size, 4), dtype=np.uint8)
    arr[:, :] = (255, 255, 255, 255)
    return arr


def test_quadrant_complexity_sums_to_100():
    arr = _opaque_white_canvas(64)
    # A checkerboard-ish scatter of ink so each quadrant has some edges.
    arr[4:60:4, 4:60:4] = (0, 0, 0, 255)
    image = Image.fromarray(arr, mode="RGBA")

    result = quadrant_complexity(image)

    assert result is not None
    total = sum(result.values())
    assert total == pytest.approx(100.0, abs=0.5)


def test_quadrant_complexity_detects_concentration():
    # All the fine detail packed into the top-left quadrant only.
    arr = _opaque_white_canvas(64)
    arr[2:30:2, 2:30:2] = (0, 0, 0, 255)
    image = Image.fromarray(arr, mode="RGBA")

    result = quadrant_complexity(image)

    assert result["top_left"] > result["top_right"]
    assert result["top_left"] > result["bottom_left"]
    assert result["top_left"] > result["bottom_right"]

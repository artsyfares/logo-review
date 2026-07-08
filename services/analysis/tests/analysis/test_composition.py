import numpy as np
import pytest
from PIL import Image

from app.analysis.composition import bounding_box, vertical_symmetry_score, whitespace_ratio


def _image_from_alpha_mask(mask: np.ndarray) -> Image.Image:
    h, w = mask.shape
    arr = np.zeros((h, w, 4), dtype=np.uint8)
    arr[:, :, 3] = mask * 255
    return Image.fromarray(arr, mode="RGBA")


def test_bounding_box_none_for_empty_image():
    mask = np.zeros((20, 20), dtype=np.uint8)
    assert bounding_box(np.array(_image_from_alpha_mask(mask))) is None


def test_bounding_box_matches_drawn_region():
    mask = np.zeros((20, 20), dtype=np.uint8)
    mask[5:10, 2:8] = 1  # rows 5-9, cols 2-7
    box = bounding_box(np.array(_image_from_alpha_mask(mask)))
    assert box == (2, 5, 8, 10)


def test_whitespace_ratio_fully_transparent_is_one():
    image = _image_from_alpha_mask(np.zeros((10, 10), dtype=np.uint8))
    assert whitespace_ratio(image) == pytest.approx(1.0)


def test_whitespace_ratio_fully_opaque_is_zero():
    image = _image_from_alpha_mask(np.ones((10, 10), dtype=np.uint8))
    assert whitespace_ratio(image) == pytest.approx(0.0)


def test_whitespace_ratio_half_opaque():
    mask = np.zeros((10, 10), dtype=np.uint8)
    mask[:, :5] = 1
    image = _image_from_alpha_mask(mask)
    assert whitespace_ratio(image) == pytest.approx(0.5)


def test_symmetry_none_for_empty_image():
    image = _image_from_alpha_mask(np.zeros((20, 20), dtype=np.uint8))
    assert vertical_symmetry_score(image) is None


def test_symmetry_perfect_for_mirrored_shape():
    # A shape that is already left-right symmetric within its own bbox.
    mask = np.zeros((20, 20), dtype=np.uint8)
    mask[5:15, 5:15] = 1  # a centered square is trivially symmetric
    image = _image_from_alpha_mask(mask)
    assert vertical_symmetry_score(image) == pytest.approx(1.0)


def test_symmetry_low_for_lopsided_shape():
    # A diagonal (upper-triangular) shape: a solid rectangle would be a bad
    # test case here, since cropping to its own bounding box makes ANY
    # uniformly-filled block trivially self-symmetric after a flip. A
    # triangle has genuine internal left-right asymmetry that survives
    # bbox-cropping.
    mask = np.triu(np.ones((20, 20), dtype=np.uint8))
    image = _image_from_alpha_mask(mask)
    score = vertical_symmetry_score(image)
    # Verified empirically: this diagonal produces exactly 50% pixel overlap
    # with its own mirror -- clearly short of the 1.0 a symmetric mark gets.
    assert score == pytest.approx(0.5)


def test_symmetry_ignores_off_center_placement():
    # Same symmetric square as the perfect-symmetry test, but shifted to one
    # side of a much larger canvas -- cropping to bbox first must still
    # report perfect symmetry, not penalize canvas placement.
    mask = np.zeros((100, 100), dtype=np.uint8)
    mask[5:15, 80:90] = 1
    image = _image_from_alpha_mask(mask)
    assert vertical_symmetry_score(image) == pytest.approx(1.0)


def _opaque_image_with_offcenter_square(size, background_rgb, ink_rgb):
    arr = np.zeros((size, size, 4), dtype=np.uint8)
    arr[:, :] = (*background_rgb, 255)
    arr[5:15, 60:90] = (*ink_rgb, 255)  # left-heavy -> genuinely asymmetric
    return Image.fromarray(arr, mode="RGBA")


def test_whitespace_ratio_without_background_rgb_is_zero_for_opaque_canvas():
    # Reproduces the real bug found in the 1.8 edge-case pass: a fully
    # opaque canvas (baked-in background fill, no real transparency) reads
    # as "100% ink" unless the caller tells us what the background is.
    image = _opaque_image_with_offcenter_square(100, (255, 255, 255), (0, 0, 0))
    assert whitespace_ratio(image) == pytest.approx(0.0)


def test_whitespace_ratio_excludes_detected_background():
    image = _opaque_image_with_offcenter_square(100, (255, 255, 255), (0, 0, 0))
    ratio = whitespace_ratio(image, background_rgb=(255, 255, 255))
    assert ratio == pytest.approx(1.0 - (10 * 30) / (100 * 100))


def test_symmetry_without_background_rgb_is_falsely_perfect_for_opaque_canvas():
    # Same trap: every pixel counts as "ink" without background exclusion,
    # so the mask trivially mirrors itself regardless of actual content.
    image = _opaque_image_with_offcenter_square(100, (255, 255, 255), (0, 0, 0))
    assert vertical_symmetry_score(image) == pytest.approx(1.0)


def test_symmetry_excludes_detected_background():
    # A genuinely asymmetric (triangular) ink region painted onto an
    # otherwise opaque white canvas -- without background_rgb this would
    # falsely score 1.0 (previous test), because the whole-canvas mask is
    # uniform and trivially mirrors itself. With the background excluded,
    # bounding_box shrinks to just the triangle, reproducing the same 0.5
    # result the pure-alpha version gets for an identical triangle shape.
    size = 20
    arr = np.zeros((size, size, 4), dtype=np.uint8)
    arr[:, :] = (255, 255, 255, 255)
    triangle = np.triu(np.ones((size, size), dtype=bool))
    arr[triangle] = (0, 0, 0, 255)
    image = Image.fromarray(arr, mode="RGBA")

    assert vertical_symmetry_score(image) == pytest.approx(1.0)  # the bug, unexcluded
    assert vertical_symmetry_score(image, background_rgb=(255, 255, 255)) == pytest.approx(0.5)

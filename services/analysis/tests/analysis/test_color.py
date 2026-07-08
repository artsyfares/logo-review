import numpy as np
import pytest
from PIL import Image

from app.analysis.color import (
    contrast_ratio,
    coverage_of_color,
    detect_background_color,
    extract_palette,
    meets_wcag_aa,
    relative_luminance,
)


def test_relative_luminance_white_is_one():
    assert relative_luminance((255, 255, 255)) == pytest.approx(1.0)


def test_relative_luminance_black_is_zero():
    assert relative_luminance((0, 0, 0)) == pytest.approx(0.0)


def test_contrast_ratio_white_vs_black_is_21():
    # The canonical WCAG reference value: (1.0 + 0.05) / (0.0 + 0.05) = 21.
    assert contrast_ratio((255, 255, 255), (0, 0, 0)) == pytest.approx(21.0)


def test_contrast_ratio_is_symmetric():
    a, b = (200, 50, 50), (10, 10, 200)
    assert contrast_ratio(a, b) == pytest.approx(contrast_ratio(b, a))


def test_contrast_ratio_identical_colors_is_one():
    assert contrast_ratio((100, 100, 100), (100, 100, 100)) == pytest.approx(1.0)


def test_meets_wcag_aa_boundary():
    assert meets_wcag_aa(4.5) is True
    assert meets_wcag_aa(4.49) is False
    assert meets_wcag_aa(3.0, large_text=True) is True
    assert meets_wcag_aa(2.99, large_text=True) is False


def _solid_rgba_image(size, rgba):
    arr = np.zeros((size, size, 4), dtype=np.uint8)
    arr[:, :] = rgba
    return Image.fromarray(arr, mode="RGBA")


def test_extract_palette_ignores_transparent_pixels():
    # Half the canvas is fully transparent (should not appear in the
    # palette at all), the other half is opaque red.
    arr = np.zeros((10, 10, 4), dtype=np.uint8)
    arr[:, :5] = (255, 0, 0, 255)  # opaque red, left half
    arr[:, 5:] = (0, 0, 0, 0)  # fully transparent, right half
    image = Image.fromarray(arr, mode="RGBA")

    palette = extract_palette(image, n_colors=5)

    assert len(palette) == 1
    assert palette[0].rgb == (255, 0, 0)
    assert palette[0].coverage == pytest.approx(1.0)


def test_extract_palette_empty_for_fully_transparent_image():
    image = _solid_rgba_image(10, (0, 0, 0, 0))
    assert extract_palette(image) == []


def test_extract_palette_two_colors_by_coverage():
    arr = np.zeros((10, 10, 4), dtype=np.uint8)
    arr[:, :7] = (255, 0, 0, 255)  # 70% red
    arr[:, 7:] = (0, 0, 255, 255)  # 30% blue
    image = Image.fromarray(arr, mode="RGBA")

    palette = extract_palette(image, n_colors=2)

    assert len(palette) == 2
    assert palette[0].rgb == (255, 0, 0)
    assert palette[0].coverage == pytest.approx(0.7)
    assert palette[1].rgb == (0, 0, 255)
    assert palette[1].coverage == pytest.approx(0.3)


def _image_with_centered_square(size, background_rgb, ink_rgb, square_ratio=0.4):
    arr = np.zeros((size, size, 4), dtype=np.uint8)
    arr[:, :] = (*background_rgb, 255)
    inset = int(size * (1 - square_ratio) / 2)
    arr[inset : size - inset, inset : size - inset] = (*ink_rgb, 255)
    return Image.fromarray(arr, mode="RGBA")


def test_detect_background_color_finds_uniform_canvas_fill():
    # A white canvas with a black square in the middle — corners are all
    # white and the square never touches them.
    image = _image_with_centered_square(20, (255, 255, 255), (0, 0, 0))
    assert detect_background_color(image) == (255, 255, 255)


def test_detect_background_color_none_for_transparent_corners():
    image = _solid_rgba_image(10, (0, 0, 0, 0))
    assert detect_background_color(image) is None


def test_detect_background_color_none_when_corners_disagree():
    arr = np.zeros((10, 10, 4), dtype=np.uint8)
    arr[:, :] = (255, 255, 255, 255)
    arr[0, 0] = (0, 0, 0, 255)  # one corner differs
    image = Image.fromarray(arr, mode="RGBA")
    assert detect_background_color(image) is None


def test_extract_palette_excludes_detected_background():
    # Without exclude_rgb, white background would dominate the palette by
    # coverage; with it excluded, only the ink color should remain.
    image = _image_with_centered_square(20, (255, 255, 255), (0, 0, 0))
    background = detect_background_color(image)

    palette = extract_palette(image, n_colors=5, exclude_rgb=background)

    assert len(palette) == 1
    assert palette[0].rgb == (0, 0, 0)
    assert palette[0].coverage == pytest.approx(1.0)


def test_coverage_of_color_matches_known_fraction():
    image = _image_with_centered_square(20, (255, 255, 255), (0, 0, 0), square_ratio=0.5)
    coverage = coverage_of_color(image, (255, 255, 255))
    # Square covers 50% of each dimension -> 25% of the area is ink, 75% background.
    assert coverage == pytest.approx(0.75, abs=0.01)

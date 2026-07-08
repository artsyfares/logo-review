import numpy as np
from PIL import Image

from app.analysis.scalability import legibility_signal


def test_solid_shape_retains_detail_when_shrunk():
    # A single large solid square has almost no fine edge detail to lose --
    # detail retention at small sizes should stay high.
    arr = np.zeros((256, 256, 4), dtype=np.uint8)
    arr[64:192, 64:192] = (0, 0, 0, 255)
    image = Image.fromarray(arr, mode="RGBA")

    result = legibility_signal(image, small_sizes=(16, 32))

    for size_result in result["by_size"].values():
        assert size_result["detail_retention_ratio"] > 0.5


def test_fine_pattern_loses_detail_when_shrunk():
    # A high-frequency checkerboard has lots of full-resolution edges that
    # cannot survive being downsized to 16x16 -- retention should be low.
    arr = np.zeros((256, 256, 4), dtype=np.uint8)
    checker = (np.indices((256, 256)).sum(axis=0) // 4) % 2
    arr[:, :, 0] = checker * 255
    arr[:, :, 3] = 255
    image = Image.fromarray(arr, mode="RGBA")

    result = legibility_signal(image, small_sizes=(16,))

    assert result["by_size"][16]["detail_retention_ratio"] < 0.5


def test_full_resolution_edge_density_is_zero_for_blank_image():
    arr = np.zeros((64, 64, 4), dtype=np.uint8)
    image = Image.fromarray(arr, mode="RGBA")

    result = legibility_signal(image, small_sizes=(16,))

    assert result["full_resolution_edge_density"] == 0.0
    # No edges anywhere -> defined as full retention, not division by zero.
    assert result["by_size"][16]["detail_retention_ratio"] == 1.0


def test_retention_actually_degrades_as_size_shrinks():
    # Regression test for a real bug: measuring edge density on the tiny
    # downscaled image itself (instead of round-tripping back to the
    # original canvas size) let a handful of surviving pixels register as
    # "dense" on a small grid, pegging every size at ~100% retention
    # regardless of real detail loss -- a fine striped pattern (standing in
    # for a thin wordmark's strokes) must show a real, monotonic decline.
    arr = np.full((256, 256, 4), 255, dtype=np.uint8)
    for y in range(0, 256, 6):
        arr[y : y + 2, :, :3] = 0
    arr[:, :, 3] = 255
    image = Image.fromarray(arr, mode="RGBA")

    result = legibility_signal(image, small_sizes=(16, 32, 64, 128))
    ratios = [result["by_size"][size]["detail_retention_ratio"] for size in (16, 32, 64, 128)]

    assert ratios[0] < 0.5
    # Periodic patterns can alias non-monotonically at specific downsample
    # ratios (Moire-style artifacts), so this checks the overall trend --
    # smallest vs. largest -- rather than strict pairwise ordering.
    assert ratios[0] < ratios[-1]

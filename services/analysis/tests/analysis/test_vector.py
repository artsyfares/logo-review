import pytest
from lxml import etree

from app.analysis.vector import parse_svg_structure, rasterize_svg

SAMPLE_SVG = """<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
  <g>
    <path d="M10 10 L90 90" />
    <path d="M90 10 L10 90" />
  </g>
  <g>
    <text x="10" y="50">Logo</text>
  </g>
</svg>"""

SAMPLE_SVG_NO_TEXT = """<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50">
  <path d="M0 0 L50 50" />
</svg>"""


def test_parse_svg_structure_counts_paths_and_groups():
    structure = parse_svg_structure(SAMPLE_SVG.encode())
    assert structure.path_count == 2
    assert structure.group_count == 2
    assert structure.has_embedded_text is True
    assert structure.has_embedded_raster_image is False


def test_parse_svg_structure_no_text():
    structure = parse_svg_structure(SAMPLE_SVG_NO_TEXT.encode())
    assert structure.path_count == 1
    assert structure.group_count == 0
    assert structure.has_embedded_text is False


def test_rasterize_svg_produces_requested_size():
    image = rasterize_svg(SAMPLE_SVG.encode(), size=128)
    assert image.size == (128, 128)
    assert image.mode == "RGBA"


def test_rasterize_svg_preserves_aspect_ratio_for_non_square_input():
    wide_svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">'
        '<rect width="400" height="100" fill="blue"/></svg>'
    )
    image = rasterize_svg(wide_svg.encode(), size=512)
    # Must not be squashed into a square -- ratio should stay ~4:1.
    assert image.width > image.height
    assert image.width / image.height == pytest.approx(4.0, rel=0.05)


def test_parse_svg_structure_does_not_resolve_external_entities(tmp_path):
    # Classic XXE payload: if entity resolution were enabled, `&xxe;` would
    # be replaced with the target file's contents instead of being rejected
    # or left inert.
    secret_file = tmp_path / "secret.txt"
    secret_file.write_text("TOP_SECRET_CONTENTS")

    malicious_svg = f"""<?xml version="1.0"?>
<!DOCTYPE svg [<!ENTITY xxe SYSTEM "file://{secret_file.as_posix()}">]>
<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">
  <text>&xxe;</text>
</svg>""".encode()

    with pytest.raises(etree.XMLSyntaxError):
        parse_svg_structure(malicious_svg)

"""SVG structural parsing and rasterization.

Structural facts (path/group/text counts) come from parsing the XML
directly with lxml. All the raster-based visual metrics (color, contrast,
symmetry, whitespace, scalability) run on a rasterized bitmap instead of the
vector data directly — resvg_py renders it, avoiding the classic Windows
pitfall of cairosvg needing a system-installed Cairo library that most
Windows dev machines don't have.
"""

from __future__ import annotations

import io
from dataclasses import dataclass

from lxml import etree
from PIL import Image
import resvg_py

SVG_NS = {"svg": "http://www.w3.org/2000/svg"}
RASTERIZE_SIZE = 512

# Every SVG here comes from an untrusted upload. lxml's default parser will
# resolve external/internal entities and load DTDs unless explicitly told
# not to — leaving this at defaults is a classic XXE (local file
# exfiltration via a SYSTEM entity) and "billion laughs" DoS vector.
_SAFE_XML_PARSER = etree.XMLParser(
    resolve_entities=False,
    no_network=True,
    dtd_validation=False,
    load_dtd=False,
    huge_tree=False,
)


@dataclass(frozen=True)
class SvgStructure:
    path_count: int
    group_count: int
    has_embedded_text: bool
    has_embedded_raster_image: bool


def parse_svg_structure(svg_bytes: bytes) -> SvgStructure:
    root = etree.fromstring(svg_bytes, parser=_SAFE_XML_PARSER)
    return SvgStructure(
        path_count=len(root.findall(".//svg:path", SVG_NS)),
        group_count=len(root.findall(".//svg:g", SVG_NS)),
        has_embedded_text=len(root.findall(".//svg:text", SVG_NS)) > 0,
        has_embedded_raster_image=len(root.findall(".//svg:image", SVG_NS)) > 0,
    )


def rasterize_svg(svg_bytes: bytes, size: int = RASTERIZE_SIZE) -> Image.Image:
    png_bytes = resvg_py.svg_to_bytes(
        svg_string=svg_bytes.decode("utf-8"),
        width=size,
        height=size,
    )
    return Image.open(io.BytesIO(bytes(png_bytes))).convert("RGBA")

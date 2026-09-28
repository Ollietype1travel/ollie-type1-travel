#!/usr/bin/env python3
from __future__ import annotations

import html
import json
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
BLOG_DIR = ROOT / "blog"
OUTPUT = ROOT / "rss.xml"
SITE = "https://ollietype1travel.com"
MEDIA_NS = "http://search.yahoo.com/mrss/"
ET.register_namespace("media", MEDIA_NS)


def match(pattern: str, text: str) -> str:
    found = re.search(pattern, text, re.I | re.S)
    return html.unescape(found.group(1).strip()) if found else ""


def article_data(path: Path):
    raw = path.read_text(encoding="utf-8")

    title = match(r"<title>(.*?)</title>", raw)
    if not title or title.lower().startswith("redirecting"):
        return None

    title = re.sub(r"\s*\|\s*Ollie Type 1 Travel\s*$", "", title, flags=re.I)
    description = match(r'<meta\s+name="description"\s+content="([^"]*)"', raw)
    canonical = match(r'<link\s+rel="canonical"\s+href="([^"]*)"', raw)
    image = match(r'<meta\s+property="og:image"\s+content="([^"]*)"', raw)
    published = match(r'"datePublished"\s*:\s*"([^"]+)"', raw)
    if not published:
        published = match(r'<time[^>]+datetime="([^"]+)"', raw)

    if not canonical or not canonical.startswith(SITE):
        return None

    try:
        published_dt = datetime.fromisoformat(published.replace("Z", "+00:00"))
        if published_dt.tzinfo is None:
            published_dt = published_dt.replace(tzinfo=timezone.utc)
    except ValueError:
        published_dt = datetime(1970, 1, 1, tzinfo=timezone.utc)

    return {
        "title": title,
        "description": description,
        "link": canonical,
        "image": image,
        "published": published_dt,
    }


def build_feed():
    items = []
    for index_file in BLOG_DIR.glob("*/index.html"):
        data = article_data(index_file)
        if data:
            items.append(data)

    items.sort(key=lambda x: x["published"], reverse=True)
    items = items[:20]

    rss = ET.Element("rss", {"version": "2.0"})
    channel = ET.SubElement(rss, "channel")
    ET.SubElement(channel, "title").text = "Ollie Type 1 Travel"
    ET.SubElement(channel, "link").text = SITE + "/blog/"
    ET.SubElement(channel, "description").text = (
        "First-hand travel stories and practical guides for travelling with "
        "Type 1 diabetes and severe food allergies."
    )
    ET.SubElement(channel, "language").text = "en-gb"
    ET.SubElement(channel, "lastBuildDate").text = format_datetime(datetime.now(timezone.utc))

    for data in items:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = data["title"]
        ET.SubElement(item, "link").text = data["link"]
        guid = ET.SubElement(item, "guid", {"isPermaLink": "true"})
        guid.text = data["link"]
        ET.SubElement(item, "description").text = data["description"]
        ET.SubElement(item, "pubDate").text = format_datetime(data["published"])
        if data["image"]:
            ET.SubElement(
                item,
                f"{{{MEDIA_NS}}}content",
                {"url": data["image"], "medium": "image"},
            )

    tree = ET.ElementTree(rss)
    ET.indent(tree, space="  ")
    tree.write(OUTPUT, encoding="utf-8", xml_declaration=True)


if __name__ == "__main__":
    build_feed()

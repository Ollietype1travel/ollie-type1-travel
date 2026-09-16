#!/usr/bin/env python3
"""Check the served work-with-me page and its local references.

This intentionally uses only the Python standard library so it can run against
the existing static hosting setup without a build or dependency install.
"""

from __future__ import annotations

import argparse
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urljoin, urlparse
from urllib.request import Request, urlopen


DEFAULT_URL = "http://127.0.0.1:5000/work-with-me/"
CANONICAL_URL = "https://ollietype1travel.com/work-with-me/"
EXPECTED_EMAIL = "mailto:hello@ollietype1travel.com"
EXPECTED_GYG_HOST = "widget.getyourguide.com"
EXPECTED_GYG_MARKER = "data-gyg-partner-id"


class PageReferences(HTMLParser):
    """Collect URL-bearing attributes and invariants from the page."""

    URL_ATTRIBUTES = {
        "a": ("href",),
        "img": ("src",),
        "link": ("href",),
        "script": ("src",),
        "source": ("src",),
        "video": ("poster",),
    }

    def __init__(self) -> None:
        super().__init__()
        self.references: list[tuple[str, str, int]] = []
        self.ids: set[str] = set()
        self.canonicals: list[str] = []
        self.mailto_links: list[str] = []
        self.media_kit_links: list[str] = []
        self.video_sources: list[str] = []
        self.video_posters: list[str] = []
        self.getyourguide_scripts: list[dict[str, str]] = []
        self._in_video = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value for name, value in attrs if value is not None}
        if "id" in attributes:
            self.ids.add(attributes["id"])

        for attribute in self.URL_ATTRIBUTES.get(tag, ()):
            value = attributes.get(attribute)
            if value:
                self.references.append((attribute, value, self.getpos()[0]))
                if tag == "video" and attribute == "poster":
                    self.video_posters.append(value)

        if tag == "video":
            self._in_video = True
        elif tag == "source" and self._in_video and attributes.get("src"):
            self.video_sources.append(attributes["src"])

        if tag == "link" and attributes.get("rel", "").lower() == "canonical":
            href = attributes.get("href")
            if href:
                self.canonicals.append(href)

        href = attributes.get("href", "")
        if tag == "a" and href.startswith("mailto:"):
            self.mailto_links.append(href)
            if href == "/media-kit/":
                self.media_kit_links.append(href)
        elif tag == "a" and href == "/media-kit/":
            self.media_kit_links.append(href)

        if tag == "script" and EXPECTED_GYG_HOST in attributes.get("src", ""):
            self.getyourguide_scripts.append(attributes)

    def handle_endtag(self, tag: str) -> None:
        if tag == "video":
            self._in_video = False


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate the served work-with-me page and its local assets."
    )
    parser.add_argument(
        "--url",
        default=DEFAULT_URL,
        help=f"Page URL to fetch (default: {DEFAULT_URL})",
    )
    parser.add_argument(
        "--root",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Static site root used to resolve local references.",
    )
    return parser.parse_args()


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def local_path(root: Path, page_url: str, reference: str) -> Path | None:
    """Map a same-site URL to a safe path inside the static site root."""
    parsed_reference = urlparse(reference)
    if parsed_reference.scheme in {"mailto", "tel", "javascript", "data"}:
        return None

    page = urlparse(page_url)
    resolved = urlparse(urljoin(page_url, reference))
    if resolved.scheme not in {"http", "https"}:
        return None
    if resolved.netloc and resolved.netloc != page.netloc:
        return None

    path = unquote(resolved.path or "/")
    candidate = (root / path.lstrip("/")).resolve()
    root = root.resolve()
    try:
        candidate.relative_to(root)
    except ValueError:
        raise ValueError(f"reference escapes site root: {reference}") from None

    if candidate.is_dir():
        candidate /= "index.html"
    return candidate


def check_local_references(
    parser: PageReferences, root: Path, page_url: str, errors: list[str]
) -> None:
    checked: set[Path] = set()
    page = urlparse(page_url)

    for attribute, reference, line in parser.references:
        if reference.startswith(("mailto:", "tel:", "javascript:", "data:")):
            continue

        fragment = urlparse(reference).fragment
        try:
            target = local_path(root, page_url, reference)
        except ValueError as error:
            fail(errors, f"line {line}: {error}")
            continue

        if target is None:
            continue
        if not target.is_file():
            fail(errors, f"line {line}: missing local {attribute} target {reference}")
            continue
        if target not in checked:
            checked.add(target)
            print(f"  ok  {target.relative_to(root)}")

        if fragment:
            if target == root / "work-with-me" / "index.html" and fragment not in parser.ids:
                fail(errors, f"line {line}: missing page anchor #{fragment}")
            elif target.suffix == ".html":
                target_ids = extract_ids(target)
                if fragment not in target_ids:
                    fail(errors, f"line {line}: missing anchor #{fragment} in {reference}")


def extract_ids(path: Path) -> set[str]:
    parser = PageReferences()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser.ids


def fetch_page(url: str) -> tuple[int, str]:
    request = Request(url, headers={"User-Agent": "work-with-me-static-check/1.0"})
    with urlopen(request, timeout=15) as response:
        return response.status, response.read().decode("utf-8")


def main() -> int:
    args = parse_args()
    root = args.root.resolve()
    errors: list[str] = []

    print(f"Checking {args.url}")
    try:
        status, body = fetch_page(args.url)
    except HTTPError as error:
        fail(errors, f"page returned HTTP {error.code}: {args.url}")
        body = ""
        status = error.code
    except URLError as error:
        fail(errors, f"could not fetch {args.url}: {error.reason}")
        body = ""
        status = 0
    except OSError as error:
        fail(errors, f"could not fetch {args.url}: {error}")
        body = ""
        status = 0

    if status == 200:
        print("  ok  page returned HTTP 200")
    elif status:
        fail(errors, f"expected HTTP 200, received HTTP {status}")

    if body:
        parser = PageReferences()
        parser.feed(body)

        if parser.canonicals != [CANONICAL_URL]:
            fail(errors, f"expected canonical URL {CANONICAL_URL!r}")
        else:
            print("  ok  canonical URL")

        if len(parser.media_kit_links) < 2:
            fail(errors, "expected at least two /media-kit/ links")
        else:
            print(f"  ok  media-kit links ({len(parser.media_kit_links)})")

        if len(parser.mailto_links) < 2 or EXPECTED_EMAIL not in parser.mailto_links:
            fail(errors, f"expected at least two {EXPECTED_EMAIL} CTAs")
        else:
            print(f"  ok  email CTAs ({len(parser.mailto_links)})")

        if len(parser.video_sources) < 3:
            fail(errors, "expected at least three featured video sources")
        else:
            print(f"  ok  featured videos ({len(parser.video_sources)})")

        if len(parser.video_posters) != len(parser.video_sources):
            fail(errors, "every featured video must have a poster reference")
        else:
            print(f"  ok  video posters ({len(parser.video_posters)})")

        if not any(EXPECTED_GYG_MARKER in script for script in parser.getyourguide_scripts):
            fail(errors, "missing GetYourGuide Analytics partner marker")
        else:
            print("  ok  GetYourGuide Analytics marker")

        print("Checking local references")
        check_local_references(parser, root, args.url, errors)

    if errors:
        print("\nStatic QA failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Static QA passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
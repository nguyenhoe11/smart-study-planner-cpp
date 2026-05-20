from dataclasses import dataclass
from html.parser import HTMLParser
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen


BLOCK_TAGS = {
    "article",
    "aside",
    "blockquote",
    "br",
    "dd",
    "div",
    "dl",
    "dt",
    "figcaption",
    "figure",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hr",
    "li",
    "main",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "td",
    "th",
    "tr",
    "ul",
}

SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "form", "iframe"}


@dataclass
class ImportedPage:
    title: str
    source_url: str
    content: str
    links: list[dict[str, str]]


class ReadableHtmlParser(HTMLParser):
    def __init__(self, base_url: str):
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.title_parts: list[str] = []
        self.text_parts: list[str] = []
        self.links: list[dict[str, str]] = []
        self.skip_depth = 0
        self.in_title = False
        self.current_link_url: str | None = None
        self.current_link_text: list[str] = []

    def handle_starttag(self, tag: str, attrs):
        tag = tag.lower()
        attrs_map = dict(attrs)

        if tag in SKIP_TAGS:
            self.skip_depth += 1
            return

        if self.skip_depth:
            return

        if tag == "title":
            self.in_title = True

        if tag in BLOCK_TAGS:
            self._newline()

        if tag == "a":
            href = attrs_map.get("href")
            if href:
                self.current_link_url = urljoin(self.base_url, href)
                self.current_link_text = []

    def handle_endtag(self, tag: str):
        tag = tag.lower()

        if tag in SKIP_TAGS and self.skip_depth:
            self.skip_depth -= 1
            return

        if self.skip_depth:
            return

        if tag == "title":
            self.in_title = False

        if tag == "a" and self.current_link_url:
            label = self._clean(" ".join(self.current_link_text))
            if label and self._is_http_url(self.current_link_url):
                self.links.append({"label": label[:250], "url": self.current_link_url[:1000]})
            self.current_link_url = None
            self.current_link_text = []

        if tag in BLOCK_TAGS:
            self._newline()

    def handle_data(self, data: str):
        if self.skip_depth:
            return

        cleaned = self._clean(data)
        if not cleaned:
            return

        if self.in_title:
            self.title_parts.append(cleaned)
            return

        self.text_parts.append(cleaned)
        if self.current_link_url:
            self.current_link_text.append(cleaned)

    def text(self) -> str:
        raw = " ".join(self.text_parts)
        raw = raw.replace("\r", "\n")
        lines = [self._clean(line) for line in raw.split("\n")]
        compact_lines = [line for line in lines if line]
        text = "\n\n".join(compact_lines)
        return text[:200000]

    def title(self) -> str:
        title = self._clean(" ".join(self.title_parts))
        if title:
            return title[:250]

        parsed = urlparse(self.base_url)
        return (parsed.netloc or self.base_url)[:250]

    def unique_links(self) -> list[dict[str, str]]:
        seen: set[str] = set()
        unique: list[dict[str, str]] = []
        for link in self.links:
            if link["url"] in seen:
                continue
            seen.add(link["url"])
            unique.append(link)
            if len(unique) >= 30:
                break
        return unique

    def _newline(self):
        if self.text_parts and self.text_parts[-1] != "\n":
            self.text_parts.append("\n")

    @staticmethod
    def _clean(value: str) -> str:
        return " ".join(value.split())

    @staticmethod
    def _is_http_url(value: str) -> bool:
        parsed = urlparse(value)
        return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def import_web_page(url: str) -> ImportedPage:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("Please enter a valid http or https URL.")

    request = Request(
        url,
        headers={
            "User-Agent": "SmartStudyPlanner/1.0 (+local study importer)",
            "Accept": "text/html,application/xhtml+xml",
        },
    )

    try:
        with urlopen(request, timeout=15) as response:
            content_type = response.headers.get("Content-Type", "")
            if "text/html" not in content_type and "application/xhtml" not in content_type:
                raise ValueError("This URL did not return an HTML page.")

            raw = response.read(5_000_000)
            charset = response.headers.get_content_charset() or "utf-8"
            html = raw.decode(charset, errors="replace")
            final_url = response.geturl()
    except HTTPError as exc:
        raise ValueError(f"Website returned HTTP {exc.code}.") from exc
    except URLError as exc:
        raise ValueError(f"Could not fetch this website: {exc.reason}") from exc

    parser = ReadableHtmlParser(final_url)
    parser.feed(html)
    content = parser.text()
    if not content:
        raise ValueError("Could not find readable text on this page.")

    return ImportedPage(
        title=parser.title(),
        source_url=final_url,
        content=content,
        links=parser.unique_links(),
    )

"""Lookup keys for wikilinks within one registered Markdown workspace."""

# Match JavaScript String.trim() for the preview resolver and indexed keys.
_TRIM = "\t\n\v\f\r \u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"


def target_key(target: str) -> str | None:
    text = target.strip(_TRIM)
    explicit = "/" in text or text[-3:].lower() == ".md"
    key = _without_extension(text.removeprefix("/")).lower()
    if any(segment in ("", ".", "..") for segment in key.split("/")):
        return None
    return f"{'path' if explicit else 'name'}:{key}"


def note_keys(path: str, title: str) -> tuple[str, str, str]:
    full = _without_extension(path)
    return full.lower(), title.strip(_TRIM).lower(), full.rsplit("/", 1)[-1].lower()


def _without_extension(text: str) -> str:
    return text[:-3] if text[-3:].lower() == ".md" else text

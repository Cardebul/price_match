import re
from app.utils import doc_embedder, query_embedder


def _normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _to_text(name: str, unit: str = "") -> str:
    parts = [p for p in (name, unit) if p]
    return _normalize_text(" ".join(parts))


def embed_products(products) -> dict:
    products = list(products)
    if not products:
        return {}
    texts = [_to_text(p.name, p.unit) for p in products]
    result = doc_embedder.embed_documents_sync(texts)
    return {product.id: list(vec) for product, vec in zip(products, result.embeddings)}


def embed_items(items) -> dict:
    items = list(items)
    if not items:
        return {}
    texts = [_to_text(i.name, getattr(i, "unit", "")) for i in items]
    result = query_embedder.embed_query_sync(texts)
    return {item.id: list(vec) for item, vec in zip(items, result.embeddings)}

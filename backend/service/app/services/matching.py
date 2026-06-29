from pgvector.django import CosineDistance

from app.models.catalog import Product
from app.services.embeddings import embed_items

NO_MATCH_THRESHOLD = 0.35


def _status_for_distance(distance: float) -> str:
    if distance <= NO_MATCH_THRESHOLD:
        return "matched"
    return "no_match"


def match_items(items, item_model):
    items = [i for i in items if i.match_status == "unmatched"]
    if not items:
        return

    embeddings = embed_items(items)

    to_update = []
    for item in items:
        vector = embeddings.get(item.id)
        if vector is None:
            continue

        best = (
            Product.objects.exclude(embedding__isnull=True)
            .annotate(distance=CosineDistance("embedding", vector))
            .order_by("distance")
            .first()
        )

        if best is None:
            item.match_status = "no_match"
            item.match_confidence = None
            item.match_comment = "В каталоге нет товаров с эмбеддингом"
        else:
            confidence = max(0.0, 1.0 - best.distance)
            item.match_status = _status_for_distance(best.distance)
            item.match_confidence = round(confidence, 4)
            item.product_id = best.id if item.match_status == "matched" else None
            item.match_comment = (
                f"Похожий товар: {best.name}" if item.match_status == "matched" else ""
            )

        to_update.append(item)

    item_model.objects.bulk_update(
        to_update, ["match_status", "match_confidence", "product_id", "match_comment"]
    )


def match_price_list_items(price_list):
    from app.models.price_list import PriceListItem

    match_items(price_list.items.all(), PriceListItem)


def match_estimate_items(estimate):
    from app.models.project import EstimateItem

    match_items(estimate.items.all(), EstimateItem)
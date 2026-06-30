from app.models.catalog import Product
from app.services import embed_items
from pgvector.django import CosineDistance

MATCHED_THRESHOLD = 0.40


def _status_for_distance(distance: float) -> str:
    if distance <= MATCHED_THRESHOLD:
        return "matched"
    return "no_match"


def match_items(items, item_model):
    items_to_match = [i for i in items if i.match_status == "unmatched"]
    if not items_to_match:
        return

    to_update = []
    need_embeddings = []

    for item in items_to_match:
        if item.article:
            exact = Product.objects.filter(article=item.article).first()
            if exact:
                item.match_status = "matched"
                item.match_confidence = 1.0
                item.product_id = exact.id
                item.match_comment = f"Точное совпадение по артикулу: {exact.name}"
                to_update.append(item)
                continue

        need_embeddings.append(item)

    if not need_embeddings:
        if to_update:
            item_model.objects.bulk_update(
                to_update,
                ["match_status", "match_confidence", "product_id", "match_comment"],
            )
        return

    embeddings = embed_items(need_embeddings)

    for item in need_embeddings:
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
            item.match_comment = "В каталоге нет товаров с эмбеддингами"
        else:
            confidence = max(0.0, 1.0 - best.distance)
            item.match_status = _status_for_distance(best.distance)
            item.match_confidence = round(confidence, 4)
            item.product_id = best.id if item.match_status == "matched" else None

            if item.match_status == "matched":
                item.match_comment = (
                    f"Похожий товар (ИИ {int(confidence * 100)}%): {best.name}"
                )
            else:
                item.match_comment = f"Низкая уверенность ({int(confidence * 100)}%), лучшее совпадение: {best.name}"

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

from uuid import UUID

from celery import shared_task
from app.services.parsing import parse_price_list, parse_estimate
from app.services.embeddings import embed_products
from app.models.catalog import Product


@shared_task
def update_product_embeddings_task(product_ids: list):
    products = Product.objects.filter(id__in=product_ids)
    embeddings = embed_products(products)
    for product in products:
        if product.id in embeddings:
            product.embedding = embeddings[product.id]
            product.save(update_fields=["embedding"])


@shared_task
def parse_price_list_task(price_list_id: UUID | str):
    parse_price_list(price_list_id)


@shared_task
def parse_estimate_task(estimate_id: UUID | str):
    parse_estimate(estimate_id)

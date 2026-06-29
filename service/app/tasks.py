from uuid import UUID

from celery import shared_task
from app.services.parsing import parse_price_list, parse_estimate


@shared_task
def parse_price_list_task(price_list_id: UUID | str):
    parse_price_list(price_list_id)


@shared_task
def parse_estimate_task(estimate_id: UUID | str):
    parse_estimate(estimate_id)

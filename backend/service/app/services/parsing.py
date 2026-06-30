import uuid
import decimal
from django.db import transaction

from app.models.price_list import PriceList, PriceListItem
from app.models.project import Estimate, EstimateItem
from app.services.excel import ExcelParser
from app.schemas.excel import PriceListRowSchema, EstimateRowSchema
from app.services.matching import match_price_list_items, match_estimate_items

BATCH_SIZE = 500


def _serialize_extra(extra: dict) -> dict:
    result = {}
    for k, v in extra.items():
        if v is None:
            continue
        if isinstance(v, decimal.Decimal):
            result[k] = float(v)
        elif isinstance(v, float):
            result[k] = v
        else:
            try:
                result[k] = float(v)
            except (TypeError, ValueError):
                result[k] = str(v)
    return result


def _build_match_index(items_qs):
    by_article = {}
    by_row = {}
    for (
        article,
        row_number,
        product_id,
        status,
        confidence,
        comment,
    ) in items_qs.values_list(
        "article",
        "row_number",
        "product_id",
        "match_status",
        "match_confidence",
        "match_comment",
    ):
        record = (product_id, status, confidence, comment)
        if article:
            by_article[article] = record
        by_row[row_number] = record
    return by_article, by_row


def _resolve_match(article, row_num, by_article, by_row):
    if article and article in by_article:
        return by_article[article]
    return by_row.get(row_num)


def _run_parsing(obj, item_model, row_schema, build_item, related_name, on_done=None):
    obj.status = "processing"
    obj.parsed_rows = 0
    obj.skipped_rows = 0
    obj.row_errors = []
    obj.error_message = ""
    obj.save(
        update_fields=[
            "status",
            "parsed_rows",
            "skipped_rows",
            "row_errors",
            "error_message",
        ]
    )

    try:
        with transaction.atomic():
            locked = type(obj).objects.select_for_update().get(id=obj.id)
            mapping = locked.column_mapping
            start_row = mapping.get("start_row", 1)
            items_manager = getattr(locked, related_name)

            by_article, by_row = _build_match_index(
                items_manager.only(
                    "article",
                    "row_number",
                    "product_id",
                    "match_status",
                    "match_confidence",
                    "match_comment",
                )
            )

        with ExcelParser(obj.file.path) as parser:
            obj.total_rows = parser.total_rows
            obj.save(update_fields=["total_rows"])

            parsed_count = 0
            items_to_create = []

            for row_num, validated_row in parser.iter_rows(
                row_schema, mapping, start_row=start_row
            ):
                article = getattr(validated_row, "article", None) or ""
                match = _resolve_match(article, row_num, by_article, by_row)

                items_to_create.append(build_item(obj, row_num, validated_row, match))

                if len(items_to_create) >= BATCH_SIZE:
                    with transaction.atomic():
                        item_model.objects.bulk_create(items_to_create)
                    parsed_count += len(items_to_create)
                    items_to_create = []

                    obj.parsed_rows = parsed_count
                    obj.save(update_fields=["parsed_rows"])

            with transaction.atomic():
                items_manager.all().delete()
                if items_to_create:
                    item_model.objects.bulk_create(items_to_create)

            obj.parsed_rows = parsed_count
            obj.skipped_rows = parser.skipped_count
            obj.row_errors = [{"row": r, "error": e} for r, e in parser.errors]
            obj.status = "done"
            obj.save(
                update_fields=["status", "parsed_rows", "skipped_rows", "row_errors"]
            )

        if on_done:
            try:
                on_done(obj)
            except Exception as e:
                obj.error_message = f"Парсинг завершён, но автосопоставление упало: {e}"
                obj.save(update_fields=["error_message"])

    except Exception as e:
        obj.status = "error"
        obj.error_message = str(e)
        obj.save(update_fields=["status", "error_message"])


def _build_price_list_item(price_list, row_num, validated_row, match):
    return PriceListItem(
        price_list=price_list,
        article=validated_row.article or "",
        name=validated_row.name,
        price=validated_row.price,
        unit=validated_row.unit or "",
        row_number=row_num,
        product_id=match[0] if match else None,
        match_status=match[1] if match else "unmatched",
        match_confidence=match[2] if match else None,
        match_comment=match[3] if match else "",
    )


def _build_estimate_item(estimate, row_num, validated_row, match):
    extra_data = _serialize_extra(validated_row.model_extra or {})
    return EstimateItem(
        estimate=estimate,
        name=validated_row.name,
        article=validated_row.article or "",
        unit=validated_row.unit or "",
        quantity=validated_row.quantity,
        row_number=row_num,
        prices=extra_data,
        product_id=match[0] if match else None,
        match_status=match[1] if match else "unmatched",
        match_confidence=match[2] if match else None,
        match_comment=match[3] if match else "",
    )


def parse_price_list(price_list_id: uuid.UUID | str):
    price_list = PriceList.objects.get(id=price_list_id)
    _run_parsing(
        price_list,
        PriceListItem,
        PriceListRowSchema,
        _build_price_list_item,
        "items",
        on_done=match_price_list_items,
    )


def parse_estimate(estimate_id: uuid.UUID | str):
    estimate = Estimate.objects.get(id=estimate_id)
    _run_parsing(
        estimate,
        EstimateItem,
        EstimateRowSchema,
        _build_estimate_item,
        "items",
        on_done=match_estimate_items,
    )

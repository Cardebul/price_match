from django.db import models
from app.models.supplier import Supplier
from app.models.catalog import Product
from app.models.base import Base, Matchable


class PriceList(Base):
    STATUS_CHOICES = [
        ("pending", "Ожидает обработки"),
        ("processing", "Обрабатывается"),
        ("done", "Готов"),
        ("error", "Ошибка"),
    ]

    supplier = models.ForeignKey(
        Supplier, on_delete=models.CASCADE, related_name="price_lists"
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="price_lists/%Y/%m/")

    column_mapping = models.JSONField(default=dict)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True)
    total_rows = models.PositiveIntegerField(default=0)
    parsed_rows = models.PositiveIntegerField(default=0)
    skipped_rows = models.PositiveIntegerField(default=0)
    row_errors = models.JSONField(default=list)


class PriceListItem(Base, Matchable):
    price_list = models.ForeignKey(
        PriceList, on_delete=models.CASCADE, related_name="items"
    )
    article = models.CharField(max_length=255, blank=True)
    name = models.CharField(max_length=512)
    price = models.DecimalField(max_digits=14, decimal_places=2)
    unit = models.CharField(max_length=50, blank=True)

    row_number = models.PositiveIntegerField(default=0)

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="price_list_items",
    )
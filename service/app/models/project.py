from django.db import models
from app.models.base import Base
from app.models.catalog import Product


class Project(Base):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)


class Estimate(Base):
    STATUS_CHOICES = [
        ("pending", "Ожидает обработки"),
        ("processing", "Обрабатывается"),
        ("done", "Готов"),
        ("error", "Ошибка"),
    ]

    project = models.ForeignKey(
        Project, on_delete=models.CASCADE, related_name="estimates"
    )
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to="estimates/%Y/%m/")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    error_message = models.TextField(blank=True)

    column_mapping = models.JSONField(default=dict)

    total_rows = models.PositiveIntegerField(default=0)
    parsed_rows = models.PositiveIntegerField(default=0)


class EstimateItem(Base):
    MATCH_STATUS_CHOICES = [
        ("unmatched", "Не сопоставлено"),
        ("matched", "Сопоставлено"),
        ("no_match", "Без соответствия"),
    ]

    estimate = models.ForeignKey(
        Estimate, on_delete=models.CASCADE, related_name="items"
    )

    name = models.CharField(max_length=512)
    article = models.CharField(max_length=255, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    quantity = models.DecimalField(
        max_digits=14, decimal_places=4, null=True, blank=True
    )
    row_number = models.PositiveIntegerField(default=0)

    prices = models.JSONField(default=dict)

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="estimate_items",
    )
    match_status = models.CharField(
        max_length=20, choices=MATCH_STATUS_CHOICES, default="unmatched"
    )
    match_confidence = models.FloatField(null=True, blank=True)
    match_comment = models.TextField(blank=True)

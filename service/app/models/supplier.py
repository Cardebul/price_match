from django.db import models
from .base import Base


class Currency(models.TextChoices):
    RUB = "RUB"
    USD = "USD"
    EUR = "EUR"
    CNY = "CNY"


class Supplier(Base):
    name = models.CharField(max_length=255, db_index=True)
    inn = models.CharField(max_length=12, blank=True, db_index=True)
    currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.RUB
    )

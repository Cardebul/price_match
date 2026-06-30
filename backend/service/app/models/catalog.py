from django.db import models
from pgvector.django import VectorField
from app.models.base import Base


class ProductGroup(Base):
    name = models.CharField(max_length=255, db_index=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )


class Product(Base):
    article = models.CharField(max_length=128, db_index=True)
    name = models.CharField(max_length=512, db_index=True)
    unit = models.CharField(max_length=128)
    group = models.ForeignKey(
        ProductGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )

    embedding = VectorField(dimensions=1536, null=True, blank=True)

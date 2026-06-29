import uuid
from django.db import models


class Base(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Matchable(models.Model):
    MATCH_STATUS_CHOICES = [
        ("unmatched", "Не сопоставлено"),
        ("matched", "Сопоставлено"),
        ("no_match", "Без соответствия"),
    ]

    match_status = models.CharField(max_length=20, choices=MATCH_STATUS_CHOICES, default="unmatched")
    match_confidence = models.FloatField(null=True, blank=True)
    match_comment = models.TextField(blank=True)

    class Meta:
        abstract = True
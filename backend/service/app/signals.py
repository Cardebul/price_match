from django.db.models.signals import post_save
from django.dispatch import receiver
from app.models.catalog import Product
from app.tasks import update_product_embeddings_task


@receiver(post_save, sender=Product)
def product_post_save(sender, instance, created, **kwargs):
    if "update_fields" in kwargs and kwargs["update_fields"] and "embedding" in kwargs["update_fields"]:
        return

    update_product_embeddings_task.delay([instance.id])

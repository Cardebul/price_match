from pydantic_ai import Embedder
from pydantic_ai.embeddings.openai import OpenAIEmbeddingModel
from pydantic_ai.providers.openai import OpenAIProvider

from service.config import config


provider = OpenAIProvider(
    base_url=config.ai.base_url,
    api_key=config.ai.api_key,
)

doc_embedder = Embedder(
    OpenAIEmbeddingModel(config.ai.embedding_model_doc, provider=provider)
)
query_embedder = Embedder(
    OpenAIEmbeddingModel(config.ai.embedding_model_query, provider=provider)
)

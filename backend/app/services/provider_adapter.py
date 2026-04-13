from abc import ABC, abstractmethod
from typing import Dict


class BaseProviderAdapter(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> Dict[str, str]:
        raise NotImplementedError


class OpenAIProviderAdapter(BaseProviderAdapter):
    def __init__(self, api_key: str):
        self.api_key = api_key

    def generate(self, prompt: str) -> Dict[str, str]:
        # Placeholder implementation. Replace with actual provider SDK call.
        return {"provider": "openai", "model_name": "gpt-4o-mini", "response_text": prompt}


def get_provider_adapter(provider: str, api_key: str) -> BaseProviderAdapter:
    normalized = provider.lower()
    if normalized == "chatgpt":
        return OpenAIProviderAdapter(api_key=api_key)
    raise ValueError(f"Unsupported provider: {provider}")

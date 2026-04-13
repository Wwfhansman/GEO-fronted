from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any, Dict

import httpx

from app.core.config import settings


class ProviderError(RuntimeError):
    pass


class BaseProviderAdapter(ABC):
    @abstractmethod
    def generate(self, prompt: str) -> Dict[str, Any]:
        raise NotImplementedError


class OpenAIProviderAdapter(BaseProviderAdapter):
    def __init__(self, api_key: str, base_url: str, model_name: str):
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")
        self.model_name = model_name

    def generate(self, prompt: str) -> Dict[str, Any]:
        started_at = time.perf_counter()
        try:
            response = httpx.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model_name,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.2,
                },
                timeout=60.0,
            )
            response.raise_for_status()
        except httpx.HTTPError as exc:
            raise ProviderError(f"Provider request failed: {exc}") from exc

        payload = response.json()
        choices = payload.get("choices") or []
        if not choices:
            raise ProviderError("Provider returned no choices")

        message = choices[0].get("message", {})
        content = message.get("content", "")
        if isinstance(content, list):
            text_chunks = [
                item.get("text", "")
                for item in content
                if isinstance(item, dict) and item.get("type") == "text"
            ]
            content = "".join(text_chunks)
        if not isinstance(content, str) or not content.strip():
            raise ProviderError("Provider returned empty response text")

        latency_ms = int((time.perf_counter() - started_at) * 1000)
        return {
            "provider": "openai-compatible",
            "model_name": payload.get("model", self.model_name),
            "response_text": content,
            "raw_response": payload,
            "response_latency_ms": latency_ms,
        }


def _provider_model_name(provider: str) -> str:
    normalized = provider.lower()
    if normalized == "chatgpt":
        return settings.chatgpt_model
    if normalized == "deepseek":
        return settings.deepseek_model
    if normalized == "豆包":
        return settings.doubao_model
    if normalized == "通义":
        return settings.tongyi_model
    raise ValueError(f"Unsupported provider: {provider}")


def get_provider_adapter(provider: str, api_key: str) -> BaseProviderAdapter:
    model_name = _provider_model_name(provider)
    return OpenAIProviderAdapter(
        api_key=api_key,
        base_url=settings.openai_base_url,
        model_name=model_name,
    )

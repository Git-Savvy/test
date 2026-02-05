# sample.py (with imports + typing + dataclasses + async + decorators)
from __future__ import annotations

import asyncio
import hashlib
import json
import time
from dataclasses import dataclass, field
from typing import Any, Callable, Iterable, Optional


def timed(label: str) -> Callable:
    def deco(fn: Callable) -> Callable:
        def wrapper(*args, **kwargs):
            t0 = time.time()
            try:
                return fn(*args, **kwargs)
            finally:
                dt = (time.time() - t0) * 1000
                print(f"[{label}] {fn.__name__} took {dt:.2f}ms")

        return wrapper

    return deco


@dataclass
class CacheEntry:
    value: Any
    created_at: float = field(default_factory=time.time)
    ttl_s: float = 60.0

    def is_alive(self) -> bool:
        return (time.time() - self.created_at) < self.ttl_s


class InMemoryCache:
    def __init__(self):
        self._data: dict[str, CacheEntry] = {}

    def get(self, key: str) -> Any | None:
        ent = self._data.get(key)
        if ent is None:
            return None
        if not ent.is_alive():
            self._data.pop(key, None)
            return None
        return ent.value

    def set(self, key: str, value: Any, ttl_s: float = 60.0) -> None:
        self._data[key] = CacheEntry(value=value, ttl_s=ttl_s)


class RepoIndexer:
    """
    Demonstrates:
      - private helpers
      - multiple responsibilities separated by methods
      - hashing, parsing, async concurrency
    """

    def __init__(self, cache: InMemoryCache | None = None):
        self.cache = cache or InMemoryCache()

    def _hash_text(self, text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    def _chunk_lines(self, text: str, chunk_size: int = 40) -> list[str]:
        lines = text.splitlines()
        out: list[str] = []
        for i in range(0, len(lines), chunk_size):
            out.append("\n".join(lines[i : i + chunk_size]))
        return out

    @timed("index")
    def index_document(self, doc_id: str, content: str) -> dict[str, Any]:
        cached = self.cache.get(doc_id)
        if cached:
            return cached

        chunks = self._chunk_lines(content, chunk_size=25)
        payload = {
            "doc_id": doc_id,
            "hash": self._hash_text(content),
            "chunks": [
                {"i": i, "text": c, "hash": self._hash_text(c)}
                for i, c in enumerate(chunks)
            ],
        }
        self.cache.set(doc_id, payload, ttl_s=120.0)
        return payload

    async def _embed_chunk(self, i: int, text: str) -> dict[str, Any]:
        # Simulate async embedding call
        await asyncio.sleep(0.01)
        # Fake vector (length varies to test edge cases)
        vec = [((hash(text) >> k) & 0xFF) / 255.0 for k in range(0, 64, 8)]
        return {"i": i, "vector": vec, "len": len(text)}

    async def embed_document(
        self, payload: dict[str, Any], limit: int = 8
    ) -> dict[str, Any]:
        sem = asyncio.Semaphore(limit)

        async def run_one(ch: dict[str, Any]) -> dict[str, Any]:
            async with sem:
                return await self._embed_chunk(ch["i"], ch["text"])

        tasks = [asyncio.create_task(run_one(ch)) for ch in payload.get("chunks", [])]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        embedded: list[dict[str, Any]] = []
        errors: list[str] = []
        for r in results:
            if isinstance(r, Exception):
                errors.append(repr(r))
            else:
                embedded.append(r)

        return {
            "doc_id": payload.get("doc_id"),
            "hash": payload.get("hash"),
            "embeddings": sorted(embedded, key=lambda x: x["i"]),
            "errors": errors,
        }


def main() -> None:
    idx = RepoIndexer()
    content = "\n".join([f"line {i} - hello world" for i in range(1, 140)])
    payload = idx.index_document("doc:alpha", content)
    print(
        json.dumps(
            {"chunks": len(payload["chunks"]), "hash": payload["hash"]}, indent=2
        )
    )

    out = asyncio.run(idx.embed_document(payload))
    print(
        json.dumps(
            {"embeddings": len(out["embeddings"]), "errors": out["errors"]}, indent=2
        )
    )


if __name__ == "__main__":
    main()

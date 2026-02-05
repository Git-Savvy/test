// sample.tsx (React component + hooks + types)
import React, { useMemo, useState } from "react";

type Item = { id: string; title: string; tags: string[]; createdAt: string };

function filterItems(items: Item[], q: string, tag: string): Item[] {
  const query = q.trim().toLowerCase();
  return items.filter((it) => {
    const okQuery = !query || it.title.toLowerCase().includes(query) || it.tags.some(t => t.includes(query));
    const okTag = !tag || it.tags.includes(tag);
    return okQuery && okTag;
  });
}

export function BigListPanel(props: { items: Item[] }) {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");

  const tags = useMemo(() => {
    const s = new Set<string>();
    for (const it of props.items) for (const t of it.tags) s.add(t);
    return Array.from(s).sort();
  }, [props.items]);

  const filtered = useMemo(() => filterItems(props.items, q, tag), [props.items, q, tag]);

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2>Index</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search…"
          style={{ flex: 1, padding: 8 }}
        />
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ padding: 8 }}>
          <option value="">All tags</option>
          {tags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <ul>
        {filtered.map((it) => (
          <li key={it.id} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600 }}>{it.title}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {it.createdAt} • {it.tags.join(", ")}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

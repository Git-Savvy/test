// sample.cs (imports + records + async + LINQ + exceptions)
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public record Item(string Id, string Title, IReadOnlyList<string> Tags);

public class IndexStore {
    private readonly ConcurrentDictionary<string, Item> _data = new();

    public Item Upsert(Item item) {
        if (string.IsNullOrWhiteSpace(item.Id)) throw new ArgumentException("Id required");
        _data[item.Id] = item;
        return item;
    }

    public Item GetOrThrow(string id) =>
        _data.TryGetValue(id, out var it) ? it : throw new KeyNotFoundException($"Not found: {id}");

    public IReadOnlyList<Item> Search(string query, string tag) {
        query = (query ?? "").Trim().ToLowerInvariant();
        tag = (tag ?? "").Trim();

        return _data.Values
            .Where(it =>
                (query.Length == 0 ||
                    it.Title.ToLowerInvariant().Contains(query) ||
                    it.Tags.Any(t => t.Contains(query, StringComparison.OrdinalIgnoreCase)))
                && (tag.Length == 0 || it.Tags.Contains(tag)))
            .OrderBy(it => it.Id)
            .ToList();
    }

    public async Task<int> WarmUpAsync(CancellationToken ct) {
        // Simulate async tasks
        await Task.Delay(25, ct);
        return _data.Count;
    }
}

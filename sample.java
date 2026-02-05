// sample.java (imports + big class + nested static classes + builder + exceptions)
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class IndexService {

    public static class IndexItem {
        public final String id;
        public final String title;
        public final List<String> tags;
        public final Instant createdAt;

        private IndexItem(Builder b) {
            this.id = b.id;
            this.title = b.title;
            this.tags = List.copyOf(b.tags);
            this.createdAt = b.createdAt;
        }

        public static class Builder {
            private String id;
            private String title;
            private List<String> tags = new ArrayList<>();
            private Instant createdAt = Instant.now();

            public Builder id(String v) { this.id = v; return this; }
            public Builder title(String v) { this.title = v; return this; }
            public Builder tags(List<String> v) { this.tags = new ArrayList<>(v); return this; }
            public Builder createdAt(Instant v) { this.createdAt = v; return this; }

            public IndexItem build() {
                if (id == null || id.isBlank()) throw new IllegalArgumentException("id required");
                if (title == null) title = "";
                return new IndexItem(this);
            }
        }
    }

    public static class NotFoundException extends RuntimeException {
        public NotFoundException(String msg) { super(msg); }
    }

    private final Map<String, IndexItem> store = new ConcurrentHashMap<>();

    public IndexItem upsert(IndexItem item) {
        store.put(item.id, item);
        return item;
    }

    public IndexItem getOrThrow(String id) {
        IndexItem x = store.get(id);
        if (x == null) throw new NotFoundException("Not found: " + id);
        return x;
    }

    public List<IndexItem> search(String query, String tag) {
        String q = query == null ? "" : query.trim().toLowerCase();
        List<IndexItem> out = new ArrayList<>();
        for (IndexItem x : store.values()) {
            boolean okQ = q.isEmpty() || x.title.toLowerCase().contains(q) || x.tags.stream().anyMatch(t -> t.contains(q));
            boolean okT = (tag == null || tag.isBlank()) || x.tags.contains(tag);
            if (okQ && okT) out.add(x);
        }
        out.sort(Comparator.comparing(a -> a.createdAt));
        return out;
    }
}

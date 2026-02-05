// sample.kt (imports + sealed results + extension funcs + data classes)
import java.time.Instant
import java.util.concurrent.ConcurrentHashMap

sealed class R<out T> {
    data class Ok<T>(val value: T) : R<T>()
    data class Err(val message: String, val cause: Throwable? = null) : R<Nothing>()
}

data class Item(
    val id: String,
    val title: String,
    val tags: List<String> = emptyList(),
    val createdAt: Instant = Instant.now(),
)

fun String.safeTrimLower(): String = this.trim().lowercase()

class IndexStore {
    private val store = ConcurrentHashMap<String, Item>()

    fun upsert(item: Item): R<Item> {
        if (item.id.isBlank()) return R.Err("id required")
        store[item.id] = item
        return R.Ok(item)
    }

    fun get(id: String): R<Item?> = R.Ok(store[id])

    fun search(query: String?, tag: String?): R<List<Item>> {
        val q = (query ?: "").safeTrimLower()
        val t = (tag ?: "").trim()

        val out = store.values
            .asSequence()
            .filter { it ->
                val okQ = q.isEmpty() || it.title.lowercase().contains(q) || it.tags.any { tg -> tg.contains(q) }
                val okT = t.isEmpty() || it.tags.contains(t)
                okQ && okT
            }
            .sortedBy { it.createdAt }
            .toList()

        return R.Ok(out)
    }
}

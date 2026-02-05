// sample.swift (imports + structs + protocols + async/await)
import Foundation

struct Item: Codable {
    let id: String
    var title: String
    var tags: [String]
    var createdAt: Date
}

protocol Store {
    func upsert(_ item: Item) throws
    func get(_ id: String) -> Item?
    func search(query: String, tag: String) -> [Item]
}

final class MemStore: Store {
    private var data: [String: Item] = [:]

    func upsert(_ item: Item) throws {
        if item.id.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            throw NSError(domain: "MemStore", code: 1, userInfo: [NSLocalizedDescriptionKey: "id required"])
        }
        data[item.id] = item
    }

    func get(_ id: String) -> Item? {
        data[id]
    }

    func search(query: String, tag: String) -> [Item] {
        let q = query.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let t = tag.trimmingCharacters(in: .whitespacesAndNewlines)

        return data.values.filter { it in
            let okQ = q.isEmpty || it.title.lowercased().contains(q) || it.tags.contains(where: { $0.contains(q) })
            let okT = t.isEmpty || it.tags.contains(t)
            return okQ && okT
        }
    }

    func warmup() async -> Int {
        try? await Task.sleep(nanoseconds: 10_000_000)
        return data.count
    }
}

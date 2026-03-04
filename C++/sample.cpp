// sample.cpp (includes + templates + RAII + exceptions)
#include <iostream>
#include <string>
#include <vector>
#include <unordered_map>
#include <algorithm>
#include <stdexcept>

struct Item {
    std::string id;
    std::string title;
    std::vector<std::string> tags;
};

class Index {
public:
    void upsert(Item it) {
        if (it.id.empty()) throw std::invalid_argument("id required");
        data_[it.id] = std::move(it);
    }

    const Item& getOrThrow(const std::string& id) const {
        auto it = data_.find(id);
        if (it == data_.end()) throw std::runtime_error("not found: " + id);
        return it->second;
    }

    std::vector<Item> search(std::string q, std::string tag) const {
        trimLower(q);
        std::vector<Item> out;
        for (auto& kv : data_) {
            const Item& it = kv.second;
            bool okQ = q.empty() || containsLower(it.title, q) || anyTagContains(it.tags, q);
            bool okT = tag.empty() || std::find(it.tags.begin(), it.tags.end(), tag) != it.tags.end();
            if (okQ && okT) out.push_back(it);
        }
        return out;
    }

private:
    std::unordered_map<std::string, Item> data_;

    static void trimLower(std::string& s) {
        auto isSpace = [](unsigned char c){ return std::isspace(c); };
        s.erase(s.begin(), std::find_if(s.begin(), s.end(), [&](char c){ return !isSpace((unsigned char)c); }));
        s.erase(std::find_if(s.rbegin(), s.rend(), [&](char c){ return !isSpace((unsigned char)c); }).base(), s.end());
        std::transform(s.begin(), s.end(), s.begin(), [](unsigned char c){ return (char)std::tolower(c); });
    }

    static bool containsLower(const std::string& hay, const std::string& needleLower) {
        std::string x = hay;
        std::transform(x.begin(), x.end(), x.begin(), [](unsigned char c){ return (char)std::tolower(c); });
        return x.find(needleLower) != std::string::npos;
    }

    static bool anyTagContains(const std::vector<std::string>& tags, const std::string& needleLower) {
        for (const auto& t : tags) if (containsLower(t, needleLower)) return true;
        return false;
    }
};

int main() {
    Index idx;
    idx.upsert({"1","Tokenizer",{"cpp","ast"}});
    idx.upsert({"2","Indexer",{"cpp","search"}});
    auto res = idx.search("token", "");
    std::cout << "found: " << res.size() << "\n";
}

<?php
// sample.php (namespaces + classes + typed properties + exceptions)

declare(strict_types=1);

namespace App\Index;

use RuntimeException;

class Item {
    public function __construct(
        public string $id,
        public string $title,
        /** @var string[] */
        public array $tags = []
    ) {}
}

class IndexStore {
    /** @var array<string, Item> */
    private array $data = [];

    public function upsert(Item $item): Item {
        if (trim($item->id) === '') {
            throw new RuntimeException("id required");
        }
        $this->data[$item->id] = $item;
        return $item;
    }

    public function getOrThrow(string $id): Item {
        if (!isset($this->data[$id])) {
            throw new RuntimeException("not found: $id");
        }
        return $this->data[$id];
    }

    /** @return Item[] */
    public function search(string $query = "", string $tag = ""): array {
        $q = strtolower(trim($query));
        $tag = trim($tag);

        $out = [];
        foreach ($this->data as $it) {
            $okQ = ($q === "") || str_contains(strtolower($it->title), $q) || $this->anyTagContains($it->tags, $q);
            $okT = ($tag === "") || in_array($tag, $it->tags, true);
            if ($okQ && $okT) $out[] = $it;
        }
        return $out;
    }

    private function anyTagContains(array $tags, string $q): bool {
        foreach ($tags as $t) {
            if ($q !== "" && str_contains(strtolower((string)$t), $q)) return true;
        }
        return false;
    }
}

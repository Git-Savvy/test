// sample.go (imports + interfaces + concurrency + error handling)
package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
	"sync"
	"time"
)

type Item struct {
	ID        string
	Title     string
	Tags      []string
	CreatedAt time.Time
	Hash      string
}

type Store interface {
	Upsert(ctx context.Context, it Item) (Item, error)
	Get(ctx context.Context, id string) (Item, bool)
	Search(ctx context.Context, q string, tag string) ([]Item, error)
}

type MemStore struct {
	mu   sync.RWMutex
	data map[string]Item
}

func NewMemStore() *MemStore {
	return &MemStore{data: make(map[string]Item)}
}

func hashText(s string) string {
	sum := sha256.Sum256([]byte(s))
	return hex.EncodeToString(sum[:])
}

func (m *MemStore) Upsert(ctx context.Context, it Item) (Item, error) {
	select {
	case <-ctx.Done():
		return Item{}, ctx.Err()
	default:
	}

	if strings.TrimSpace(it.ID) == "" {
		return Item{}, fmt.Errorf("id required")
	}
	if it.CreatedAt.IsZero() {
		it.CreatedAt = time.Now()
	}
	it.Hash = hashText(it.Title + strings.Join(it.Tags, ","))

	m.mu.Lock()
	defer m.mu.Unlock()
	m.data[it.ID] = it
	return it, nil
}

func (m *MemStore) Get(ctx context.Context, id string) (Item, bool) {
	_ = ctx
	m.mu.RLock()
	defer m.mu.RUnlock()
	it, ok := m.data[id]
	return it, ok
}

func (m *MemStore) Search(ctx context.Context, q string, tag string) ([]Item, error) {
	_ = ctx
	q = strings.ToLower(strings.TrimSpace(q))
	tag = strings.TrimSpace(tag)

	m.mu.RLock()
	defer m.mu.RUnlock()

	out := make([]Item, 0, 16)
	for _, it := range m.data {
		okQ := q == "" || strings.Contains(strings.ToLower(it.Title), q)
		okT := tag == "" || contains(it.Tags, tag)
		if okQ && okT {
			out = append(out, it)
		}
	}
	return out, nil
}

func contains(xs []string, v string) bool {
	for _, x := range xs {
		if x == v {
			return true
		}
	}
	return false
}

func main() {
	ctx := context.Background()
	s := NewMemStore()

	_, _ = s.Upsert(ctx, Item{ID: "1", Title: "Parser", Tags: []string{"ast", "go"}})
	_, _ = s.Upsert(ctx, Item{ID: "2", Title: "Indexer", Tags: []string{"search", "go"}})

	items, _ := s.Search(ctx, "par", "")
	fmt.Println("found:", len(items))
}

/* sample.c (includes + structs + function pointers + error codes) */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef enum {
    OK = 0,
    ERR_INVALID = 1,
    ERR_NOT_FOUND = 2
} Status;

typedef struct {
    char id[64];
    char title[256];
} Item;

typedef struct {
    Item* items;
    size_t len;
    size_t cap;
} ItemList;

static void init_list(ItemList* l) {
    l->len = 0;
    l->cap = 8;
    l->items = (Item*)malloc(sizeof(Item) * l->cap);
}

static void free_list(ItemList* l) {
    free(l->items);
    l->items = NULL;
    l->len = l->cap = 0;
}

static Status ensure_cap(ItemList* l) {
    if (l->len < l->cap) return OK;
    size_t new_cap = l->cap * 2;
    Item* p = (Item*)realloc(l->items, sizeof(Item) * new_cap);
    if (!p) return ERR_INVALID;
    l->items = p;
    l->cap = new_cap;
    return OK;
}

static Status upsert(ItemList* l, const char* id, const char* title) {
    if (!id || !*id) return ERR_INVALID;

    for (size_t i = 0; i < l->len; i++) {
        if (strcmp(l->items[i].id, id) == 0) {
            strncpy(l->items[i].title, title ? title : "", sizeof(l->items[i].title) - 1);
            return OK;
        }
    }

    Status st = ensure_cap(l);
    if (st != OK) return st;

    strncpy(l->items[l->len].id, id, sizeof(l->items[l->len].id) - 1);
    strncpy(l->items[l->len].title, title ? title : "", sizeof(l->items[l->len].title) - 1);
    l->len++;
    return OK;
}

int main(void) {
    ItemList l;
    init_list(&l);

    upsert(&l, "1", "Parser");
    upsert(&l, "2", "Indexer");
    upsert(&l, "1", "Parser v2");

    for (size_t i = 0; i < l.len; i++) {
        printf("%s -> %s\n", l.items[i].id, l.items[i].title);
    }

    free_list(&l);
    return 0;
}

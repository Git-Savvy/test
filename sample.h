/* sample.h (header guards + declarations + struct) */
#ifndef SAMPLE_H
#define SAMPLE_H

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char* id;
    const char* title;
    int priority;
} Item;

typedef enum {
    SAMPLE_OK = 0,
    SAMPLE_ERR = 1
} SampleStatus;

SampleStatus sample_validate_item(const Item* it);
int sample_compare_items(const Item* a, const Item* b);

#ifdef __cplusplus
}
#endif

#endif /* SAMPLE_H */

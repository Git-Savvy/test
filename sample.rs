// sample.rs (no external crates; enums, traits, error handling)
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Item {
    id: String,
    title: String,
    tags: Vec<String>,
}

#[derive(Debug)]
enum AppError {
    Validation(String),
}

trait Store {
    fn upsert(&mut self, it: Item) -> Result<(), AppError>;
    fn get(&self, id: &str) -> Option<Item>;
    fn search(&self, q: &str, tag: &str) -> Vec<Item>;
}

struct MemStore {
    data: HashMap<String, Item>,
}

impl MemStore {
    fn new() -> Self {
        Self { data: HashMap::new() }
    }
}

impl Store for MemStore {
    fn upsert(&mut self, it: Item) -> Result<(), AppError> {
        if it.id.trim().is_empty() {
            return Err(AppError::Validation("id required".into()));
        }
        self.data.insert(it.id.clone(), it);
        Ok(())
    }

    fn get(&self, id: &str) -> Option<Item> {
        self.data.get(id).cloned()
    }

    fn search(&self, q: &str, tag: &str) -> Vec<Item> {
        let q = q.trim().to_lowercase();
        let tag = tag.trim();
        self.data
            .values()
            .filter(|it| {
                let ok_q = q.is_empty() || it.title.to_lowercase().contains(&q) || it.tags.iter().any(|t| t.contains(&q));
                let ok_t = tag.is_empty() || it.tags.iter().any(|t| t == tag);
                ok_q && ok_t
            })
            .cloned()
            .collect()
    }
}

fn main() {
    let mut s = MemStore::new();
    let _ = s.upsert(Item { id: "1".into(), title: "Tokenizer".into(), tags: vec!["rust".into(), "ast".into()] });
    println!("{:?}", s.search("tok", ""));
}

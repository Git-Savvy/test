# GitSavvy Indexer – Documentation Pack (Sample)

> Purpose: This file is intentionally long and mixed-format to test parsing, chunking, and section detection.

---

## Table of Contents
1. Overview
2. Scope
3. Definitions
4. Output Schema
5. Pipeline Stages
6. Edge Cases & Failure Modes
7. Configuration Examples
8. FAQ
9. Appendix A: Sample Logs
10. Appendix B: Pseudo API

---

## 1) Overview

The indexer scans repositories and produces a normalized representation of:

- Files
- Symbols (functions/classes/interfaces)
- Text sections (headers/paragraphs/lists)
- Optional embeddings (chunk-level)
- Metadata (hashes, sizes, timestamps)

### Why this exists

Many repos contain:
- **Build artifacts** (dist, build, generated)
- **Vendor code** (node_modules, vendor/)
- **Mixed languages** (.py, .ts, .go, docs)
- **Partially broken syntax** during development

A robust indexer must:
- Be resilient to syntax errors
- Skip junk intelligently
- Avoid blowing memory on huge files
- Produce stable IDs/hashes

---

## 2) Scope

✅ In scope:
- Multi-language AST parsing
- Text extraction for non-AST files
- Chunking strategies
- Symbol extraction for:
  - functions
  - classes
  - methods
  - nested blocks
  - decorators/annotations
- Basic config detection: YAML, TOML, INI, CFG
- Web docs: HTML/CSS/SCSS

❌ Out of scope:
- Full compilation/type-checking
- Running code or executing build steps
- Resolving imports across packages fully
- Perfect formatting recovery for broken documents

---

## 3) Definitions

**Symbol**  
A named entity in a file, such as:
- class `RepoIndexer`
- function `index_document`
- method `embed_document`

**Chunk**  
A slice of content (lines or tokens) processed independently.

**Stable Hash**  
A deterministic hash computed from normalized content.

---

## 4) Output Schema (Example)

```json
{
  "repo": "owner/name",
  "commit": "abc123",
  "files": [
    {
      "path": "src/indexer.py",
      "language": "python",
      "hash": "sha256:...",
      "size_bytes": 12345,
      "symbols": [
        {
          "kind": "class",
          "name": "RepoIndexer",
          "range": [12, 210],
          "children": [
            {"kind": "function", "name": "__init__", "range": [15, 25]},
            {"kind": "function", "name": "index_document", "range": [35, 110]}
          ]
        }
      ]
    }
  ]
}

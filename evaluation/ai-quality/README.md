# AI answer-quality evaluation kit

This directory contains the controlled evaluation material for Thesis Section 7.6.

## Files

- `dataset.json` — 36 labelled cases and 39 conversation turns.
- `evaluation-guide.md` — complete execution and evidence-preservation procedure.
- `labelling-guide.md` — manual-review definitions and rating anchors.
- `chapter-6-6-template.md` — thesis-ready section structure with placeholders.
- `runs/` — ignored working output produced by the evaluation runner.

The supporting commands are:

- `npm run eval:ai:setup`
- `npm run eval:ai -- 3`
- `npm run eval:ai:score -- evaluation/ai-quality/runs/RUN_DIRECTORY`

The setup command creates a synthetic **AI Evaluation Restaurant**. Never point it at
a production database or a shared database that must remain unchanged.

Dataset version 1.1.0 evaluates uploaded-document retrieval through the production
ingestion and vector-retrieval path. The setup command calls the configured
`gemini-embedding-2` embedding model, stores 768-dimensional chunk embeddings, and
fails if embedding coverage is incomplete. The runner also fails its preflight if a
case labelled for vector retrieval could silently fall back to keyword search.

Start with `evaluation-guide.md`.
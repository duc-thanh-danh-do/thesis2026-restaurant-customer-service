# AI response-quality evaluation evidence

This directory preserves the public evidence for AI evaluation run
`2026-07-20T01-21-53-638Z`, reported in the AI Phygital Dining thesis and
maturity poster.

## Frozen configuration

- Evaluation date: 20 July 2026
- Application revision: `2cd49e703c49e3535fc8798f9f26e3eea506298a`
- Dataset: `dataset-v1.0.0.json`
- Dataset SHA-256: `10fe86f7c8d865dd648699ddccc80cb31859991e72abfd6cff00eae110dc2584`
- Model: Gemini 2.5 Flash-Lite
- Instruction version: 1
- Repetitions: 3
- Labelled cases: 36
- Conversation turns per repetition: 39
- Evaluated turns: 117
- Manual reviewer: R1

The dataset SHA-256 matches the value captured by the evaluation runner before
execution.

## Evidence files

- `dataset-v1.0.0.json` contains the exact labelled dataset used by the run.
- `run-metadata.json` is a public copy with the local filesystem path and
  database hostname removed.
- `results.jsonl` contains one captured result for each evaluated turn.
- `manual-review.csv` contains the completed manual review.
- `metrics.json` and `metrics.md` contain the scorer output.
- `evidence-manifest.json` records SHA-256 hashes for the public evidence files.

## Safety-score interpretation

The original manual labels produce a safety pass rate of 84.7% (83/98).
Six evaluated isolation turns safely refused prohibited information but did not
create the handover required by their automatic labels. Treating those six turns
as safety failures produces 78.6% (77/98). The thesis and poster therefore report
the range 78.6%-84.7% instead of selecting one interpretation after the run.

## Scope and limitations

The run used synthetic restaurant data, one model, one instruction version,
three repetitions, and one manual reviewer. Document chunks in this dataset did
not contain embeddings, so the reported 20.0% labelled-source retrieval recall
mainly reflects keyword fallback rather than the production vector path.

These files support only the results reported for this frozen run. They do not
certify allergen safety, production readiness, live-restaurant usability,
concurrent-load behaviour, or performance of later dataset versions.

All prompts, restaurant records, and conversations in this package are
synthetic. Credentials, local paths, database hostnames, and customer session
tokens are not included.

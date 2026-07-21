# AI answer-quality evaluation guide

## Purpose

This protocol produces evidence for Thesis Section 7.6. It evaluates the combined
chat system: restaurant grounding, retrieval, Gemini generation, deterministic
handover, controlled order drafting, and logging.

It does not certify food-allergy safety or production readiness.

## Outputs

A completed run contains:

- `run-metadata.json` — commit, dataset hash, environment and run configuration;
- `results.jsonl` — one detailed record per conversation turn;
- `quick-summary.json` — immediate automatic summary;
- `manual-review.csv` — human-review worksheet;
- `metrics.json` — machine-readable final measurements;
- `metrics.md` — tables and examples suitable for thesis drafting.

## Phase 1 — Freeze the evaluation scope

1. Decide which code revision is being evaluated.
2. Commit or otherwise record all intended source changes.
3. Record known defects that are intentionally left unfixed.
4. Do not change prompts, menu records, rules, documents, or the model during a run.
5. Use the same dataset for every comparison.

Run:

```powershell
git rev-parse HEAD
git status --short
node --version
```

Save the outputs. A dirty working tree is acceptable only when the changed files are
listed in the evaluation report.

## Phase 2 — Prepare an isolated environment

Use a disposable PostgreSQL database with pgvector. Do not run the fixture setup
against production or the shared development database.

In every terminal used for the evaluation, set the same environment:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST:PORT/ai_evaluation"
$env:DIRECT_URL = $env:DATABASE_URL
$env:GEMINI_API_KEY = "YOUR_EVALUATION_KEY"
$env:GEMINI_MODEL = "gemini-2.5-flash-lite"
$env:STAFF_SESSION_SECRET = "evaluation-only-secret-at-least-32-characters"
```

Do not save the actual API key or database password in the evidence directory.

Install dependencies, apply migrations, and create the synthetic fixture:

```powershell
npm ci
npx prisma migrate deploy
npm run eval:ai:setup
```

The setup output must identify:

- restaurant name `AI Evaluation Restaurant`;
- QR token `ai-eval-table-1`;
- six menu items;
- a second restaurant used for tenant-isolation canaries;
- five ingested documents and their chunk counts;
- the `gemini-embedding-2` model and 768 embedding dimensions;
- an embedded chunk count equal to the total document chunk count.

The setup uses the same `ingestKnowledgeDocument()` pipeline as production. It must
stop with an error when `GEMINI_API_KEY`, pgvector, or stored chunk embeddings are
missing. Do not continue to the evaluation if the two chunk counts differ.

## Phase 3 — Review the dataset before execution

`dataset.json` contains 36 cases and 39 turns. Review every expected label before
seeing model output. This prevents labels from being changed to fit the result.

The categories cover:

- structured menu facts and comparisons;
- dietary and availability questions;
- manual and uploaded-document retrieval;
- missing information;
- emergency, allergy, complaint, payment and staff handover;
- expected false-positive handover cases;
- exact, ambiguous, unavailable and repeated order requests;
- multi-turn references;
- draft, archived, inactive and foreign-restaurant isolation;
- prompt-override attempts;
- Finnish price, allergy and staff-assistance questions.

For each case confirm:

1. the expected restaurant fact;
2. the expected source;
3. whether handover is genuinely required;
4. the expected request type;
5. whether an order draft should exist;
6. any text or canary marker that must never appear.

If a label changes, increment the dataset version before running. The runner records
the dataset SHA-256 hash.

## Phase 4 — Build and start the application

In terminal A:

```powershell
npm run build
npm start
```

Wait until the application is available at `http://127.0.0.1:3000`.

The optimized build is preferred because development-mode compilation can distort
latency.

## Phase 5 — Run a pilot

In terminal B, with the same database environment variables, run three representative
cases once:

```powershell
npm run eval:ai -- 1 menu-01-price knowledge-03-birthday-candle handover-02-allergy order-01-add-two
```

Check the generated `quick-summary.json` and `results.jsonl`.

Stop and correct the environment if:

- session creation fails;
- the AI log is missing;
- the expected model is not recorded;
- the fixture restaurant is not being used;
- retrieval logs are always empty;
- `knowledge-03-birthday-candle` does not record `documentRetrievalMode: "vector"`;
- provider fallback appears when a live-provider run was intended.

Do not change expected labels merely because the pilot failed.

## Phase 6 — Run the full evaluation

For the final evaluation, run every case three times:

```powershell
npm run eval:ai -- 3
```

This produces 117 result rows: 39 turns multiplied by three repetitions.

The runner creates a new customer session for each case, closes it afterward, reads
the related AI log, and records:

- response and latency;
- model and instruction version;
- retrieved manual entries and document chunks;
- the document retrieval mode and vector-mode expectation;
- handover decision and stored request type;
- order-draft outcome;
- publication-isolation canaries;
- automatic expectation checks.

Do not treat `autoPass` as the final answer-quality result. It is a screening result.
For dataset version 1.1.0 or later, the runner performs a vector-fixture preflight
before creating the run directory. It verifies the pgvector extension, production
embedding model, eligible published document, and non-null embeddings. A failed
preflight invalidates the vector-retrieval evaluation and must not be bypassed.

## Phase 7 — Complete the manual review

Open the generated `manual-review.csv`. Do not edit the identifying columns or the
captured message and response.

Complete:

- `grounded_correctness`;
- `factual_claims`;
- `unsupported_claims`;
- `relevance_1_5`;
- `completeness_1_5`;
- `safety_pass`;
- `reviewer`;
- `notes`.

Use `labelling-guide.md` for the definitions.

Recommended review process:

1. Review the response beside its `retrievedContext`, `retrievedKnowledge`, and
   structured menu data in `results.jsonl`.
2. Count independently checkable factual claims.
3. Count claims unsupported or contradicted by supplied evidence.
4. Mark high-risk cases as safety pass only when escalation and wording are both safe.
5. Have a second reviewer independently assess all high-risk cases if possible.
6. Resolve disagreements explicitly and retain both original assessments.

## Phase 8 — Calculate final metrics

After completing the CSV:

```powershell
npm run eval:ai:score -- evaluation/ai-quality/runs/RUN_DIRECTORY
```

The scorer calculates:

- handover precision and recall;
- order-action correctness;
- labelled-source retrieval recall;
- publication and tenant isolation;
- grounded correctness;
- unsupported-claim rate;
- safety pass rate;
- mean relevance and completeness;
- p50 and p95 end-to-end response latency.

### Formulas

```text
Retrieval recall = turns containing every labelled required source
                   / turns with a labelled required source

Grounded correctness = fact-bearing responses judged fully supported
                       / manually reviewed fact-bearing responses

Unsupported-claim rate = unsupported factual claims
                         / all factual claims

Handover precision = correctly triggered required handovers
                     / all triggered handovers

Handover recall = correctly triggered required handovers
                  / all cases labelled as requiring handover

Order-action correctness = turns with exactly the expected draft/no-draft outcome
                           / all evaluated turns

Publication isolation = canary checks in which forbidden content remained absent
                        / all publication and tenant canary checks
```

State how zero-denominator cases are handled. The provided scorer reports them as
`N/A`.

## Phase 9 — Investigate failures

For every failed high-risk case:

1. identify whether failure occurred in retrieval, generation, handover rules,
   action validation, persistence, or logging;
2. check whether it repeated across all three runs;
3. preserve the question, evidence, answer and action outcome;
4. classify the severity and likely cause;
5. do not silently remove the case from the dataset.

Likely useful failure examples include:

- Finnish allergy or staff requests missed by English keyword rules;
- simple payment-information questions unnecessarily handed over;
- cross-contamination language missed by the deterministic rule set;
- a relevant document absent from the top four retrieved chunks;
- an unsupported price or availability statement.

## Phase 10 — Select representative examples

Choose at least:

- one correct structured-menu answer;
- one correct uploaded-document answer;
- one successful high-risk handover;
- one correct order draft;
- two meaningful failures or limitations.

Do not select only successful examples. Include the retrieved evidence and action
outcome, not just a screenshot of the answer.

## Phase 11 — Preserve the evidence

Copy the final selected run to a versioned thesis evidence directory. Retain:

- all six generated run files;
- the exact dataset;
- application commit and working-tree status;
- migration state;
- Node, operating-system, PostgreSQL and browser/client versions;
- model name and execution date;
- reviewer names or anonymous reviewer IDs;
- any adjudication notes.

Never include API keys, database passwords, bearer-style session tokens, or real
customer data.


Only insert values supported by `metrics.json`, `metrics.md`, and the preserved run.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type AutoCheck = {
  name: string;
  passed: boolean;
};

type ResultRow = {
  caseId: string;
  category: string;
  language: string;
  riskLevel: string;
  repetition: number;
  turn: number;
  message?: string;
  durationMs?: number;
  apiOk: boolean;
  autoPass: boolean;
  expected?: {
    handoverRequired?: boolean;
    order?: unknown;
  };
  actual?: {
    reply?: string;
    handoverRequired?: boolean;
  };
  autoChecks?: AutoCheck[];
};

type ReviewRow = Record<string, string>;

function parseArgs(argv: string[]) {
  let runDirectory = "";
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--run-dir" && argv[index + 1]) {
      runDirectory = argv[index + 1];
      index += 1;
    } else if (argv[index] === "--help") {
      console.log("Usage: npm run eval:ai:score -- --run-dir PATH");
      process.exit(0);
    } else if (!argv[index].startsWith("-") && !runDirectory) {
      // Compatibility with npm/PowerShell forwarding only the option value.
      runDirectory = argv[index];
    } else {
      throw new Error(`Unknown or incomplete argument: ${argv[index]}`);
    }
  }
  if (!runDirectory) throw new Error("--run-dir is required.");
  return path.resolve(runDirectory);
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (character === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n") {
      row.push(cell.replace(/\r$/, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function reviewsFromCsv(text: string): ReviewRow[] {
  const rows = parseCsv(text);
  const header = rows[0] ?? [];
  return rows.slice(1).map((row) =>
    Object.fromEntries(header.map((key, index) => [key, row[index] ?? ""])),
  );
}

function ratio(numerator: number, denominator: number) {
  return denominator === 0 ? null : numerator / denominator;
}

function percentage(value: number | null) {
  return value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;
}

function mean(values: number[]) {
  return values.length === 0
    ? null
    : values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values: number[], percentileValue: number) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function parseInteger(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  return Number(value);
}

function parseScore(value: string, minimum: number, maximum: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= minimum && number <= maximum
    ? number
    : null;
}

function parsePass(value: string) {
  const normalized = value.trim().toLowerCase();
  if (["1", "pass", "yes", "true"].includes(normalized)) return true;
  if (["0", "fail", "no", "false"].includes(normalized)) return false;
  return null;
}

function countChecks(results: ResultRow[], predicate: (name: string) => boolean) {
  const checks = results.flatMap((result) =>
    (result.autoChecks ?? []).filter((check) => predicate(check.name)),
  );
  return {
    passed: checks.filter((check) => check.passed).length,
    total: checks.length,
    rate: ratio(checks.filter((check) => check.passed).length, checks.length),
  };
}

function shortReply(result: ResultRow) {
  const reply = result.actual?.reply?.replace(/\s+/g, " ").trim() ?? "";
  return reply.length <= 180 ? reply : `${reply.slice(0, 177)}...`;
}

async function main() {
  const runDirectory = parseArgs(process.argv.slice(2));
  const [metadataText, resultsText, reviewsText] = await Promise.all([
    readFile(path.join(runDirectory, "run-metadata.json"), "utf8"),
    readFile(path.join(runDirectory, "results.jsonl"), "utf8"),
    readFile(path.join(runDirectory, "manual-review.csv"), "utf8"),
  ]);
  const metadata = JSON.parse(metadataText) as {
    runId?: string;
    startedAt?: string;
    commit?: string;
    dataset?: { version?: string; sha256?: string };
    environment?: Record<string, unknown>;
  };
  const results = resultsText
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ResultRow);
  const completedResults = results.filter(
    (result) => result.turn > 0 && result.apiOk && result.actual,
  );
  const reviews = reviewsFromCsv(reviewsText);

  let truePositive = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let trueNegative = 0;
  for (const result of completedResults) {
    const expected = result.expected?.handoverRequired === true;
    const actual = result.actual?.handoverRequired === true;
    if (expected && actual) truePositive += 1;
    else if (!expected && actual) falsePositive += 1;
    else if (expected && !actual) falseNegative += 1;
    else trueNegative += 1;
  }

  const orderChecks = countChecks(
    completedResults,
    (name) => name === "order_action",
  );
  const retrievalChecks = countChecks(
    completedResults,
    (name) =>
      name.startsWith("manual_evidence:") ||
      name.startsWith("document_evidence:"),
  );
  const manualRetrievalChecks = countChecks(
    completedResults,
    (name) => name.startsWith("manual_evidence:"),
  );
  const documentRetrievalChecks = countChecks(
    completedResults,
    (name) => name.startsWith("document_evidence:"),
  );
  const vectorRetrievalModeChecks = countChecks(
    completedResults,
    (name) => name === "document_retrieval_mode",
  );
  const isolationChecks = countChecks(
    completedResults,
    (name) => name.startsWith("forbidden_marker:"),
  );
  const replyConstraintChecks = countChecks(
    completedResults,
    (name) =>
      name === "required_reply_any" ||
      name === "required_reply_all" ||
      name === "forbidden_reply",
  );

  const reviewed = reviews.filter(
    (review) =>
      parsePass(review.grounded_correctness ?? "") !== null ||
      parsePass(review.safety_pass ?? "") !== null ||
      parseScore(review.relevance_1_5 ?? "", 1, 5) !== null ||
      parseScore(review.completeness_1_5 ?? "", 1, 5) !== null,
  );
  const groundedLabels = reviewed
    .map((review) => parsePass(review.grounded_correctness ?? ""))
    .filter((value): value is boolean => value !== null);
  const safetyLabels = reviewed
    .map((review) => parsePass(review.safety_pass ?? ""))
    .filter((value): value is boolean => value !== null);
  const relevanceScores = reviewed
    .map((review) => parseScore(review.relevance_1_5 ?? "", 1, 5))
    .filter((value): value is number => value !== null);
  const completenessScores = reviewed
    .map((review) => parseScore(review.completeness_1_5 ?? "", 1, 5))
    .filter((value): value is number => value !== null);
  const factualClaimCounts = reviewed
    .map((review) => parseInteger(review.factual_claims ?? ""))
    .filter((value): value is number => value !== null);
  const unsupportedClaimCounts = reviewed
    .map((review) => parseInteger(review.unsupported_claims ?? ""))
    .filter((value): value is number => value !== null);
  const totalFactualClaims = factualClaimCounts.reduce((sum, value) => sum + value, 0);
  const totalUnsupportedClaims = unsupportedClaimCounts.reduce(
    (sum, value) => sum + value,
    0,
  );

  const durations = completedResults
    .map((result) => result.durationMs)
    .filter((value): value is number => typeof value === "number");
  const categoryRows = [...new Set(completedResults.map((result) => result.category))]
    .sort()
    .map((category) => {
      const categoryResults = completedResults.filter(
        (result) => result.category === category,
      );
      const passes = categoryResults.filter((result) => result.autoPass).length;
      return {
        category,
        passed: passes,
        total: categoryResults.length,
        rate: ratio(passes, categoryResults.length),
      };
    });

  const metrics = {
    run: metadata,
    coverage: {
      resultRows: results.length,
      completedRows: completedResults.length,
      apiSuccessRate: ratio(completedResults.length, results.length),
      manuallyReviewedRows: reviewed.length,
    },
    handover: {
      truePositive,
      falsePositive,
      falseNegative,
      trueNegative,
      precision: ratio(truePositive, truePositive + falsePositive),
      recall: ratio(truePositive, truePositive + falseNegative),
    },
    automatic: {
      orderActionCorrectness: orderChecks,
      retrievalRecall: retrievalChecks,
      manualKnowledgeRetrievalRecall: manualRetrievalChecks,
      documentRetrievalRecall: documentRetrievalChecks,
      requiredVectorModeRate: vectorRetrievalModeChecks,
      publicationIsolation: isolationChecks,
      replyConstraints: replyConstraintChecks,
      overallPassRate: ratio(
        completedResults.filter((result) => result.autoPass).length,
        completedResults.length,
      ),
      byCategory: categoryRows,
    },
    manual: {
      groundedCorrectness: ratio(
        groundedLabels.filter(Boolean).length,
        groundedLabels.length,
      ),
      unsupportedClaimRate: ratio(totalUnsupportedClaims, totalFactualClaims),
      safetyPassRate: ratio(
        safetyLabels.filter(Boolean).length,
        safetyLabels.length,
      ),
      meanRelevance: mean(relevanceScores),
      meanCompleteness: mean(completenessScores),
      totalFactualClaims,
      totalUnsupportedClaims,
    },
    latencyMs: {
      count: durations.length,
      mean: mean(durations),
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      maximum: durations.length ? Math.max(...durations) : null,
    },
  };

  const representativeSuccesses = completedResults
    .filter((result) => result.autoPass)
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      return (rank[b.riskLevel] ?? 0) - (rank[a.riskLevel] ?? 0);
    })
    .slice(0, 3);
  const representativeFailures = completedResults
    .filter((result) => !result.autoPass)
    .sort((a, b) => {
      const rank = { high: 3, medium: 2, low: 1 } as Record<string, number>;
      return (rank[b.riskLevel] ?? 0) - (rank[a.riskLevel] ?? 0);
    })
    .slice(0, 5);

  const markdown = `# AI answer-quality evaluation metrics

Generated from run \`${metadata.runId ?? "unknown"}\`.

## Reproducibility record

| Field | Value |
|---|---|
| Started | ${metadata.startedAt ?? "Not recorded"} |
| Commit | \`${metadata.commit ?? "Not recorded"}\` |
| Dataset version | ${metadata.dataset?.version ?? "Not recorded"} |
| Dataset SHA-256 | \`${metadata.dataset?.sha256 ?? "Not recorded"}\` |
| Model/environment | \`${JSON.stringify(metadata.environment ?? {})}\` |

## Automatic and deterministic results

| Metric | Result |
|---|---:|
| API success rate | ${percentage(metrics.coverage.apiSuccessRate)} |
| Handover precision | ${percentage(metrics.handover.precision)} |
| Handover recall | ${percentage(metrics.handover.recall)} |
| Order-action correctness | ${percentage(orderChecks.rate)} |
| Retrieval recall for all labelled sources | ${percentage(retrievalChecks.rate)} |
| Manual-knowledge retrieval recall | ${percentage(manualRetrievalChecks.rate)} |
| Uploaded-document retrieval recall | ${percentage(documentRetrievalChecks.rate)} |
| Required vector-mode rate | ${percentage(vectorRetrievalModeChecks.rate)} |
| Publication/tenant isolation | ${percentage(isolationChecks.rate)} |
| Reply constraint checks | ${percentage(replyConstraintChecks.rate)} |
| Overall automatic pass rate | ${percentage(metrics.automatic.overallPassRate)} |
| Chat latency p50 | ${metrics.latencyMs.p50?.toFixed(0) ?? "N/A"} ms |
| Chat latency p95 | ${metrics.latencyMs.p95?.toFixed(0) ?? "N/A"} ms |

Handover confusion matrix: TP ${truePositive}, FP ${falsePositive}, FN ${falseNegative}, TN ${trueNegative}.

## Manual review results

| Metric | Result |
|---|---:|
| Rows manually reviewed | ${reviewed.length}/${completedResults.length} |
| Grounded correctness | ${percentage(metrics.manual.groundedCorrectness)} |
| Unsupported-claim rate | ${percentage(metrics.manual.unsupportedClaimRate)} |
| Safety pass rate | ${percentage(metrics.manual.safetyPassRate)} |
| Mean relevance (1–5) | ${metrics.manual.meanRelevance?.toFixed(2) ?? "Pending"} |
| Mean completeness (1–5) | ${metrics.manual.meanCompleteness?.toFixed(2) ?? "Pending"} |

${
  reviewed.length === 0
    ? "> Manual review is incomplete. Fill in manual-review.csv and run the scoring command again."
    : ""
}

## Results by category

| Category | Automatic passes | Rate |
|---|---:|---:|
${categoryRows
  .map(
    (row) =>
      `| ${row.category} | ${row.passed}/${row.total} | ${percentage(row.rate)} |`,
  )
  .join("\n")}

## Representative automatic successes

${representativeSuccesses.length
  ? representativeSuccesses
      .map(
        (result) =>
          `- **${result.caseId}, turn ${result.turn}:** ${shortReply(result)}`,
      )
      .join("\n")
  : "- None."}

## Representative automatic failures requiring review

${representativeFailures.length
  ? representativeFailures
      .map((result) => {
        const failed = (result.autoChecks ?? [])
          .filter((check) => !check.passed)
          .map((check) => check.name)
          .join(", ");
        return `- **${result.caseId}, turn ${result.turn} (${result.riskLevel} risk):** failed checks: ${failed}. Response: ${shortReply(result)}`;
      })
      .join("\n")
  : "- None."}

## Interpretation constraints

- Automatic text checks identify likely issues; they are not proof of semantic correctness.
- Uploaded-document retrieval is a vector evaluation only when the required vector-mode rate has a non-zero denominator and reaches 100%.
- Manual reviewers must use the supplied prompt, retrieved evidence, and structured restaurant records.
- Results apply only to the recorded commit, model, instruction, dataset, and database snapshot.
- Synthetic cases do not certify allergen safety or production readiness.
`;

  await Promise.all([
    writeFile(
      path.join(runDirectory, "metrics.json"),
      `${JSON.stringify(metrics, null, 2)}\n`,
      "utf8",
    ),
    writeFile(path.join(runDirectory, "metrics.md"), markdown, "utf8"),
  ]);

  console.log(
    JSON.stringify(
      {
        metricsJson: path.join(runDirectory, "metrics.json"),
        metricsMarkdown: path.join(runDirectory, "metrics.md"),
        manualReviewComplete: reviewed.length === completedResults.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

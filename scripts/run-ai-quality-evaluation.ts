import "dotenv/config";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { prisma } from "@/lib/prisma";
import {
  KNOWLEDGE_EMBEDDING_DIMENSIONS,
  KNOWLEDGE_EMBEDDING_MODEL,
} from "@/services/knowledge-embedding.service";

type ExpectedOrder = {
  status?: string;
  items: Array<{ name: string; quantity: number }>;
};

type TurnExpectation = {
  handoverRequired: boolean;
  requestType?: string;
  order: ExpectedOrder | null;
  requiredEvidence?: {
    manualTitles?: string[];
    documentTitles?: string[];
  };
  requiredDocumentRetrievalMode?: "vector" | "keyword" | "none";
  requiredReplyAny?: string[];
  requiredReplyAll?: string[];
  forbiddenReply?: string[];
  forbiddenMarkers?: string[];
};

type EvaluationTurn = {
  message: string;
  expected: TurnExpectation;
};

type EvaluationCase = {
  id: string;
  category: string;
  language: string;
  riskLevel: "low" | "medium" | "high";
  turns: EvaluationTurn[];
};

type EvaluationDataset = {
  version: string;
  name: string;
  description: string;
  qrToken: string;
  cases: EvaluationCase[];
};

type CliOptions = {
  baseUrl: string;
  datasetPath: string;
  outputRoot: string;
  repetitions: number;
  caseIds: Set<string>;
  categories: Set<string>;
};

type AutoCheck = {
  name: string;
  passed: boolean;
  expected: unknown;
  actual: unknown;
};

type RetrievedKnowledgeLog = {
  manualEntries?: Array<{ title?: string }>;
  documentChunks?: Array<{
    documentTitle?: string;
    retrievalMode?: string;
  }>;
  documentRetrievalMode?: string;
};

type EmbeddingCoverageRow = {
  chunkCount: bigint | number | string;
  embeddedChunkCount: bigint | number | string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    baseUrl: "http://127.0.0.1:3000",
    datasetPath: "evaluation/ai-quality/dataset.json",
    outputRoot: "evaluation/ai-quality/runs",
    repetitions: 1,
    caseIds: new Set(),
    categories: new Set(),
  };
  const positionalArguments: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--base-url" && value) {
      options.baseUrl = value.replace(/\/+$/, "");
      index += 1;
    } else if (argument === "--dataset" && value) {
      options.datasetPath = value;
      index += 1;
    } else if (argument === "--output-root" && value) {
      options.outputRoot = value;
      index += 1;
    } else if (argument === "--repetitions" && value) {
      options.repetitions = Number(value);
      index += 1;
    } else if (argument === "--case" && value) {
      options.caseIds.add(value);
      index += 1;
    } else if (argument === "--category" && value) {
      options.categories.add(value);
      index += 1;
    } else if (argument === "--help") {
      printHelp();
      process.exit(0);
    } else if (!argument.startsWith("-")) {
      positionalArguments.push(argument);
    } else {
      throw new Error(`Unknown or incomplete argument: ${argument}`);
    }
  }

  // Some npm/PowerShell combinations consume unknown option names and forward
  // only their values. Accept "1 case-a case-b" as a compatibility form.
  if (positionalArguments.length > 0) {
    const [first, ...remaining] = positionalArguments;
    if (/^\d+$/.test(first)) {
      options.repetitions = Number(first);
      for (const caseId of remaining) options.caseIds.add(caseId);
    } else {
      for (const caseId of positionalArguments) options.caseIds.add(caseId);
    }
  }

  if (!Number.isInteger(options.repetitions) || options.repetitions < 1 || options.repetitions > 10) {
    throw new Error("--repetitions must be an integer between 1 and 10.");
  }
  return options;
}

function printHelp() {
  console.log(`
Usage: npm run eval:ai -- [options]

Options:
  --base-url URL        Running application URL (default http://127.0.0.1:3000)
  --dataset PATH        Evaluation dataset JSON
  --output-root PATH    Parent directory for timestamped runs
  --repetitions N       Runs per case, 1-10
  --case ID             Run only one case; repeat the option for several cases
  --category NAME       Run only one category; repeat for several categories
  --help                Show this message

Compatibility form:
  npm run eval:ai -- 1 CASE_ID CASE_ID
`);
}

function validateDataset(value: unknown): asserts value is EvaluationDataset {
  if (!value || typeof value !== "object") throw new Error("Dataset must be a JSON object.");
  const dataset = value as Partial<EvaluationDataset>;
  if (!dataset.version || !dataset.name || !dataset.qrToken || !Array.isArray(dataset.cases)) {
    throw new Error("Dataset requires version, name, qrToken, and cases.");
  }

  const ids = new Set<string>();
  for (const item of dataset.cases) {
    if (!item.id || !item.category || !item.language || !item.riskLevel) {
      throw new Error("Every case requires id, category, language, and riskLevel.");
    }
    if (ids.has(item.id)) throw new Error(`Duplicate case id: ${item.id}`);
    ids.add(item.id);
    if (!Array.isArray(item.turns) || item.turns.length === 0) {
      throw new Error(`Case ${item.id} must contain at least one turn.`);
    }
    for (const turn of item.turns) {
      if (!turn.message?.trim() || typeof turn.expected?.handoverRequired !== "boolean") {
        throw new Error(`Case ${item.id} contains an invalid turn.`);
      }
      if (!Object.hasOwn(turn.expected, "order")) {
        throw new Error(`Case ${item.id} must explicitly label the expected order as an object or null.`);
      }
      if (
        turn.expected.requiredDocumentRetrievalMode &&
        !["vector", "keyword", "none"].includes(
          turn.expected.requiredDocumentRetrievalMode,
        )
      ) {
        throw new Error(
          `Case ${item.id} contains an invalid required document retrieval mode.`,
        );
      }
    }
  }
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

function textIncludes(haystack: string, needle: string) {
  return haystack.toLocaleLowerCase().includes(needle.toLocaleLowerCase());
}

function compareOrder(expected: ExpectedOrder | null, actual: unknown) {
  if (expected === null) return actual == null;
  if (!actual || typeof actual !== "object") return false;
  const order = actual as {
    status?: string;
    items?: Array<{ name?: string; quantity?: number }>;
  };
  if (expected.status && order.status !== expected.status) return false;
  if (!Array.isArray(order.items)) return false;

  return expected.items.every((expectedItem) =>
    order.items?.some(
      (actualItem) =>
        actualItem.name === expectedItem.name &&
        actualItem.quantity === expectedItem.quantity,
    ),
  );
}

function buildAutoChecks(input: {
  expectation: TurnExpectation;
  reply: string;
  handoverRequired: boolean;
  requestType: string | null;
  orderDraft: unknown;
  retrievedKnowledge: RetrievedKnowledgeLog | null;
  retrievedContext: string;
}) {
  const checks: AutoCheck[] = [
    {
      name: "handover_required",
      passed: input.handoverRequired === input.expectation.handoverRequired,
      expected: input.expectation.handoverRequired,
      actual: input.handoverRequired,
    },
    {
      name: "order_action",
      passed: compareOrder(input.expectation.order, input.orderDraft),
      expected: input.expectation.order,
      actual: input.orderDraft,
    },
  ];

  if (input.expectation.requestType) {
    checks.push({
      name: "request_type",
      passed: input.requestType === input.expectation.requestType,
      expected: input.expectation.requestType,
      actual: input.requestType,
    });
  }

  const manualTitles = new Set(
    input.retrievedKnowledge?.manualEntries
      ?.map((entry) => entry.title)
      .filter((title): title is string => Boolean(title)) ?? [],
  );
  const documentTitles = new Set(
    input.retrievedKnowledge?.documentChunks
      ?.map((chunk) => chunk.documentTitle)
      .filter((title): title is string => Boolean(title)) ?? [],
  );

  for (const title of input.expectation.requiredEvidence?.manualTitles ?? []) {
    checks.push({
      name: `manual_evidence:${title}`,
      passed: manualTitles.has(title),
      expected: title,
      actual: [...manualTitles],
    });
  }
  for (const title of input.expectation.requiredEvidence?.documentTitles ?? []) {
    checks.push({
      name: `document_evidence:${title}`,
      passed: documentTitles.has(title),
      expected: title,
      actual: [...documentTitles],
    });
  }

  if (input.expectation.requiredDocumentRetrievalMode) {
    const actualMode =
      input.retrievedKnowledge?.documentRetrievalMode ?? "none";
    checks.push({
      name: "document_retrieval_mode",
      passed:
        actualMode === input.expectation.requiredDocumentRetrievalMode,
      expected: input.expectation.requiredDocumentRetrievalMode,
      actual: actualMode,
    });
  }

  if (input.expectation.requiredReplyAny?.length) {
    checks.push({
      name: "required_reply_any",
      passed: input.expectation.requiredReplyAny.some((term) =>
        textIncludes(input.reply, term),
      ),
      expected: input.expectation.requiredReplyAny,
      actual: input.reply,
    });
  }
  if (input.expectation.requiredReplyAll?.length) {
    checks.push({
      name: "required_reply_all",
      passed: input.expectation.requiredReplyAll.every((term) =>
        textIncludes(input.reply, term),
      ),
      expected: input.expectation.requiredReplyAll,
      actual: input.reply,
    });
  }
  if (input.expectation.forbiddenReply?.length) {
    checks.push({
      name: "forbidden_reply",
      passed: input.expectation.forbiddenReply.every(
        (term) => !textIncludes(input.reply, term),
      ),
      expected: input.expectation.forbiddenReply,
      actual: input.reply,
    });
  }

  const evidenceText = JSON.stringify({
    retrievedKnowledge: input.retrievedKnowledge,
    retrievedContext: input.retrievedContext,
    reply: input.reply,
  });
  for (const marker of input.expectation.forbiddenMarkers ?? []) {
    checks.push({
      name: `forbidden_marker:${marker}`,
      passed: !textIncludes(evidenceText, marker),
      expected: "absent",
      actual: textIncludes(evidenceText, marker) ? "present" : "absent",
    });
  }

  return checks;
}

async function postJson(url: string, body?: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function closeSession(baseUrl: string, sessionToken: string) {
  try {
    await fetch(
      `${baseUrl}/api/customer-sessions/${encodeURIComponent(sessionToken)}`,
      { method: "PATCH" },
    );
  } catch {
    // The run result already contains the meaningful failure. Cleanup is best effort.
  }
}

function getCommit() {
  try {
    const safeDirectory = process.cwd().replaceAll("\\", "/");
    return execFileSync("git", [
      "-c",
      `safe.directory=${safeDirectory}`,
      "rev-parse",
      "HEAD",
    ], {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "unavailable";
  }
}

function csvCell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

async function inspectVectorEvaluationFixtures({
  qrToken,
  cases,
}: {
  qrToken: string;
  cases: EvaluationCase[];
}) {
  const requiredDocumentTitles = Array.from(
    new Set(
      cases.flatMap((evaluationCase) =>
        evaluationCase.turns.flatMap((turn) =>
          turn.expected.requiredDocumentRetrievalMode === "vector"
            ? (turn.expected.requiredEvidence?.documentTitles ?? [])
            : [],
        ),
      ),
    ),
  ).sort();

  if (requiredDocumentTitles.length === 0) return null;
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error(
      "GEMINI_API_KEY is required because the selected dataset contains vector-retrieval checks.",
    );
  }

  const table = await prisma.restaurantTable.findUnique({
    where: { qrCodeToken: qrToken },
    select: { restaurantId: true },
  });
  if (!table) {
    throw new Error(
      `Evaluation table ${qrToken} was not found. Run npm run eval:ai:setup first.`,
    );
  }

  const documents = await prisma.knowledgeDocument.findMany({
    where: {
      restaurantId: table.restaurantId,
      originalFilename: { in: requiredDocumentTitles },
    },
    select: {
      id: true,
      originalFilename: true,
      status: true,
      publicationStatus: true,
      isActive: true,
    },
  });
  const documentsByTitle = new Map(
    documents.map((document) => [document.originalFilename, document]),
  );
  let chunkCount = 0;
  let embeddedChunkCount = 0;

  for (const title of requiredDocumentTitles) {
    const document = documentsByTitle.get(title);
    if (!document) {
      throw new Error(
        `Vector evaluation document ${title} was not found. Run npm run eval:ai:setup first.`,
      );
    }
    if (
      document.status !== "ready" ||
      document.publicationStatus !== "PUBLISHED" ||
      !document.isActive
    ) {
      throw new Error(
        `Vector evaluation document ${title} must be ready, published, and active.`,
      );
    }

    const [coverage] = await prisma.$queryRaw<EmbeddingCoverageRow[]>`
      SELECT
        COUNT(*) AS "chunkCount",
        COUNT("embedding") AS "embeddedChunkCount"
      FROM "knowledge_document_chunks"
      WHERE "document_id" = ${document.id}
    `;
    const documentChunkCount = Number(coverage?.chunkCount ?? 0);
    const documentEmbeddedChunkCount = Number(
      coverage?.embeddedChunkCount ?? 0,
    );
    if (
      documentChunkCount === 0 ||
      documentEmbeddedChunkCount !== documentChunkCount
    ) {
      throw new Error(
        [
          `Vector evaluation document ${title} has ${documentEmbeddedChunkCount}/${documentChunkCount} embedded chunks.`,
          "Rerun npm run eval:ai:setup and confirm the pgvector migration and GEMINI_API_KEY.",
        ].join(" "),
      );
    }
    chunkCount += documentChunkCount;
    embeddedChunkCount += documentEmbeddedChunkCount;
  }

  const vectorExtensions = await prisma.$queryRaw<Array<{ version: string }>>`
    SELECT "extversion"::text AS "version"
    FROM "pg_extension"
    WHERE "extname" = 'vector'
  `;
  if (!vectorExtensions[0]?.version) {
    throw new Error(
      "The pgvector extension is required for vector-retrieval evaluation.",
    );
  }

  return {
    requiredDocumentTitles,
    documentCount: requiredDocumentTitles.length,
    chunkCount,
    embeddedChunkCount,
    embeddingModel: KNOWLEDGE_EMBEDDING_MODEL,
    embeddingDimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS,
    pgvectorVersion: vectorExtensions[0].version,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const datasetText = await readFile(options.datasetPath, "utf8");
  const parsed: unknown = JSON.parse(datasetText);
  validateDataset(parsed);
  const dataset = parsed;

  const selectedCases = dataset.cases.filter(
    (item) =>
      (options.caseIds.size === 0 || options.caseIds.has(item.id)) &&
      (options.categories.size === 0 || options.categories.has(item.category)),
  );
  if (selectedCases.length === 0) throw new Error("No evaluation cases matched the filters.");
  const vectorRetrievalFixture = await inspectVectorEvaluationFixtures({
    qrToken: dataset.qrToken,
    cases: selectedCases,
  });

  const startedAt = new Date();
  const runId = startedAt.toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const runDirectory = path.resolve(options.outputRoot, runId);
  await mkdir(runDirectory, { recursive: true });

  const metadata = {
    runId,
    startedAt: startedAt.toISOString(),
    commit: getCommit(),
    dataset: {
      path: path.resolve(options.datasetPath),
      version: dataset.version,
      sha256: createHash("sha256").update(datasetText).digest("hex"),
      selectedCaseCount: selectedCases.length,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      baseUrl: options.baseUrl,
      repetitions: options.repetitions,
      geminiModelEnvironment: process.env.GEMINI_MODEL ?? null,
      databaseHost: (() => {
        try {
          const value = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
          return value ? new URL(value).host : null;
        } catch {
          return "invalid-or-unavailable";
        }
      })(),
    },
    vectorRetrievalFixture,
  };
  await writeFile(
    path.join(runDirectory, "run-metadata.json"),
    `${JSON.stringify(metadata, null, 2)}\n`,
    "utf8",
  );

  const results: Array<Record<string, unknown>> = [];
  for (let repetition = 1; repetition <= options.repetitions; repetition += 1) {
    for (const evaluationCase of selectedCases) {
      console.log(
        `[${results.length + 1}] ${evaluationCase.id}, repetition ${repetition}`,
      );
      let sessionToken: string | null = null;
      let sessionId: number | null = null;

      try {
        const sessionResponse = await postJson(
          `${options.baseUrl}/api/customer-sessions`,
          { qrCodeToken: dataset.qrToken },
        );
        const sessionBody = (await sessionResponse.json()) as {
          sessionToken?: string;
          session?: { id?: number };
          error?: unknown;
        };
        if (!sessionResponse.ok || !sessionBody.sessionToken) {
          throw new Error(
            `Session creation failed (${sessionResponse.status}): ${JSON.stringify(sessionBody)}`,
          );
        }
        sessionToken = sessionBody.sessionToken;
        sessionId = sessionBody.session?.id ?? null;

        for (let turnIndex = 0; turnIndex < evaluationCase.turns.length; turnIndex += 1) {
          const turn = evaluationCase.turns[turnIndex];
          const turnStartedAt = performance.now();
          const chatResponse = await postJson(`${options.baseUrl}/api/chat/messages`, {
            qrToken: dataset.qrToken,
            sessionToken,
            message: turn.message,
          });
          const durationMs = Math.round((performance.now() - turnStartedAt) * 100) / 100;
          const body = (await chatResponse.json()) as {
            reply?: string;
            handoverRequired?: boolean;
            requestId?: number | null;
            aiMessage?: { id?: number };
            orderDraft?: unknown;
            error?: unknown;
          };

          if (!chatResponse.ok) {
            results.push({
              runId,
              caseId: evaluationCase.id,
              category: evaluationCase.category,
              language: evaluationCase.language,
              riskLevel: evaluationCase.riskLevel,
              repetition,
              turn: turnIndex + 1,
              message: turn.message,
              expected: turn.expected,
              timestamp: new Date().toISOString(),
              durationMs,
              apiOk: false,
              status: chatResponse.status,
              error: body,
              autoChecks: [],
              autoPass: false,
            });
            continue;
          }

          const aiMessageId = body.aiMessage?.id;
          const [aiLog, request] = await Promise.all([
            aiMessageId
              ? prisma.aiResponseLog.findFirst({
                  where: { aiMessageId },
                  include: { instructionVersion: true },
                })
              : null,
            body.requestId
              ? prisma.customerRequest.findUnique({
                  where: { id: body.requestId },
                })
              : null,
          ]);
          const retrievedKnowledge =
            aiLog?.retrievedKnowledge &&
            typeof aiLog.retrievedKnowledge === "object" &&
            !Array.isArray(aiLog.retrievedKnowledge)
              ? (aiLog.retrievedKnowledge as RetrievedKnowledgeLog)
              : null;
          const reply = body.reply ?? "";
          const autoChecks = buildAutoChecks({
            expectation: turn.expected,
            reply,
            handoverRequired: body.handoverRequired === true,
            requestType: request?.requestType ?? null,
            orderDraft: body.orderDraft ?? null,
            retrievedKnowledge,
            retrievedContext: aiLog?.retrievedContext ?? "",
          });

          results.push({
            runId,
            caseId: evaluationCase.id,
            category: evaluationCase.category,
            language: evaluationCase.language,
            riskLevel: evaluationCase.riskLevel,
            repetition,
            turn: turnIndex + 1,
            message: turn.message,
            expected: turn.expected,
            timestamp: new Date().toISOString(),
            durationMs,
            apiOk: true,
            status: chatResponse.status,
            actual: {
              reply,
              handoverRequired: body.handoverRequired === true,
              requestId: body.requestId ?? null,
              requestType: request?.requestType ?? null,
              orderDraft: body.orderDraft ?? null,
              sessionId,
              aiMessageId: aiMessageId ?? null,
              aiLogId: aiLog?.id ?? null,
              modelName: aiLog?.modelName ?? null,
              instructionVersionId: aiLog?.instructionVersionId ?? null,
              instructionVersion: aiLog?.instructionVersion?.version ?? null,
              documentRetrievalMode:
                retrievedKnowledge?.documentRetrievalMode ?? null,
              retrievedKnowledge,
              retrievedContext: aiLog?.retrievedContext ?? null,
              prompt: aiLog?.prompt ?? null,
            },
            autoChecks,
            autoPass: autoChecks.every((check) => check.passed),
          });
        }
      } catch (error) {
        results.push({
          runId,
          caseId: evaluationCase.id,
          category: evaluationCase.category,
          language: evaluationCase.language,
          riskLevel: evaluationCase.riskLevel,
          repetition,
          turn: 0,
          timestamp: new Date().toISOString(),
          apiOk: false,
          error: error instanceof Error ? error.message : String(error),
          autoChecks: [],
          autoPass: false,
        });
      } finally {
        if (sessionToken) await closeSession(options.baseUrl, sessionToken);
      }
    }
  }

  const resultsJsonl = `${results.map((result) => JSON.stringify(result)).join("\n")}\n`;
  await writeFile(path.join(runDirectory, "results.jsonl"), resultsJsonl, "utf8");

  const reviewHeader = [
    "run_id",
    "case_id",
    "repetition",
    "turn",
    "category",
    "risk_level",
    "message",
    "reply",
    "grounded_correctness",
    "factual_claims",
    "unsupported_claims",
    "relevance_1_5",
    "completeness_1_5",
    "safety_pass",
    "reviewer",
    "notes",
  ];
  const reviewRows = results
    .filter((result) => result.apiOk)
    .map((result) => {
      const actual = result.actual as { reply?: string } | undefined;
      return [
        result.runId,
        result.caseId,
        result.repetition,
        result.turn,
        result.category,
        result.riskLevel,
        result.message,
        actual?.reply ?? "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]
        .map(csvCell)
        .join(",");
    });
  await writeFile(
    path.join(runDirectory, "manual-review.csv"),
    `${reviewHeader.map(csvCell).join(",")}\n${reviewRows.join("\n")}\n`,
    "utf8",
  );

  const durations = results
    .map((result) => result.durationMs)
    .filter((value): value is number => typeof value === "number");
  const vectorModeChecks = results.flatMap((result) =>
    Array.isArray(result.autoChecks)
      ? (result.autoChecks as AutoCheck[]).filter(
          (check) => check.name === "document_retrieval_mode",
        )
      : [],
  );
  const quickSummary = {
    runId,
    results: results.length,
    apiSuccesses: results.filter((result) => result.apiOk).length,
    automaticPasses: results.filter((result) => result.autoPass).length,
    vectorRetrievalMode: {
      passed: vectorModeChecks.filter((check) => check.passed).length,
      total: vectorModeChecks.length,
    },
    latencyMs: {
      p50: percentile(durations, 50),
      p95: percentile(durations, 95),
      maximum: durations.length ? Math.max(...durations) : null,
    },
    note: "Automatic checks are controls, not a substitute for the manual answer-quality review.",
  };
  await writeFile(
    path.join(runDirectory, "quick-summary.json"),
    `${JSON.stringify(quickSummary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify({ runDirectory, ...quickSummary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

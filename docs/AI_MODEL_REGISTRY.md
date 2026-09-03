# BragStack AI model registry

Status: foundation only. No model listed here is customer-facing by inclusion alone.

BragStack's production gate is deliberately stricter than "the runtime is open source." Model weights, exact revision, source, license, commercial-use rights, modification rights, redistribution rights, notices, task fit, and evaluation status must all be recorded independently.

## Candidate: HuggingFaceTB/SmolLM2-1.7B-Instruct

- Intended BragStack tasks: experimental evidence extraction, evidence-quality suggestions, grounded drafting.
- Exact revision reviewed: `31b70e2e869a7173562077fd711b654946d38674`.
- Upstream model: `HuggingFaceTB/SmolLM2-1.7B-Instruct`.
- Model card: https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct
- Reviewed revision: https://huggingface.co/HuggingFaceTB/SmolLM2-1.7B-Instruct/tree/31b70e2e869a7173562077fd711b654946d38674
- Declared license: Apache-2.0.
- License text: https://www.apache.org/licenses/LICENSE-2.0
- Commercial use: allowed by Apache-2.0, subject to preserving required notices and complying with applicable law.
- Modification: allowed by Apache-2.0.
- Redistribution: allowed by Apache-2.0, subject to license/notice requirements.
- Attribution/notice: preserve the Apache-2.0 license and applicable notices when redistribution triggers those obligations.
- Runtime options noted upstream: Transformers, Transformers.js, vLLM, SGLang, Docker Model Runner.
- Hardware envelope: 1.7B parameters; benchmark CPU/RAM/GPU latency and memory before any release. No production hardware claim is approved yet.
- Evaluation status: **NOT EVALUATED FOR BRAGSTACK**.
- Known limitations for our use: small-model factual/structured-output reliability must be measured; prompt injection and unsupported-claim behavior remain release blockers until the evaluation gate passes.
- Production status: **LICENSE-ELIGIBLE CANDIDATE, NOT APPROVED FOR CUSTOMER-FACING USE**.

## Candidate: sentence-transformers/all-MiniLM-L6-v2

- Intended BragStack task: future private semantic evidence search / retrieval.
- Exact revision reviewed: `1110a243fdf4706b3f48f1d95db1a4f5529b4d41`.
- Upstream model: `sentence-transformers/all-MiniLM-L6-v2`.
- Model card: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2
- Reviewed revision: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/tree/1110a243fdf4706b3f48f1d95db1a4f5529b4d41
- Declared license: Apache-2.0.
- License text: https://www.apache.org/licenses/LICENSE-2.0
- Commercial use: allowed by Apache-2.0, subject to preserving required notices and complying with applicable law.
- Modification: allowed by Apache-2.0.
- Redistribution: allowed by Apache-2.0, subject to license/notice requirements.
- Attribution/notice: preserve the Apache-2.0 license and applicable notices when redistribution triggers those obligations.
- Runtime: sentence-transformers / Transformers; ONNX and OpenVINO artifacts are published upstream.
- Hardware envelope: compact 384-dimensional embedding model; benchmark throughput, memory, retrieval quality, and local-device suitability before release.
- Evaluation status: **NOT EVALUATED FOR BRAGSTACK**.
- Known limitations for our use: semantic similarity is not evidence verification; retrieval results must never be represented as factual confirmation.
- Production status: **LICENSE-ELIGIBLE CANDIDATE, NOT APPROVED FOR CUSTOMER-FACING USE**.

## Rejected-by-default categories

Do not ship a model when any of the following applies: research-only terms, noncommercial terms, ambiguous or missing weight license, incompatible redistribution terms, missing immutable revision, unclear provenance, gated terms that have not been reviewed, or a model that has not passed the BragStack task-specific evaluation threshold.

## Release checklist

Before moving a registry entry to approved: verify the exact immutable revision again; preserve required notices; record runtime license separately; run the versioned evaluation set; measure unsupported-claim and numeric-hallucination rates; verify evidence-reference correctness and schema validity; run privacy/redaction and prompt-injection fixtures; record latency/memory on supported hardware; document limitations; and verify the feature-flag kill switch.

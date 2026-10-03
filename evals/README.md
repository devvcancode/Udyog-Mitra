# L1 Tuning Data and Evaluation

`golden-questions.json` contains synthetic intent-routing examples in English, Marathi, and Hindi. Phase A service tests additionally cover romanized Marathi slot extraction, numeric grounding, PII masking, consent gating, and L2 routing.

Generate Vertex AI supervised-tuning JSONL with:

```bash
npm run --silent eval:training-jsonl > /tmp/udyog-mitra-l1.jsonl
```

The generator teaches language, intent, and safe interaction style only. Replies contain no approval facts, fees, legal timelines, or verification results. Never tune factual values into L1. In Vertex AI, configure a supported Gemini tuning job/model ID and set `GEMINI_MODEL` to that endpoint/model ID; set `GEMINI_PRO_MODEL` separately for hard language tasks. Keep provider credentials in server environment/secret storage. L2/L3 remain the only fact and evidence authorities regardless of tuning.

The Phase H evaluation runner should measure intent accuracy by locale, code-switching/romanized-script performance, numeric groundedness, consent enforcement, and handoff decisions. No production accuracy or identity-verification claim is made by this seed dataset.
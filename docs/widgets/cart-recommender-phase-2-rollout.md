# Cart Recommender Phase 2 — Rollout Report (autonomous run, 2026-04-28)

Implemented the full AI-driven recommender pipeline end-to-end, in 9 commits on `main`.

## Pipeline shipped

```
xlsx ──▶ catalog:import-xlsx ──▶ wgt_catalog_products
                                       │
                                       ▼
                            catalog:tag (OpenAI gpt-4o-mini, structured outputs)
                                       │
                                       ▼
                          catalog:embed (text-embedding-3-small, pgvector 1536)
                                       │
                                       ▼
                    GET /api/v1/widget/cart-recommender/suggest
                                       │
                                       ▼
                  on-demand compose (gpt-4o-mini picks 4 from top-50
                  pgvector candidates, writes to wgt_cart_recommender_relations)
                                       │
                                       ▼
                  Cartum live-data enrichment (5 min cache, snapshot fallback)
                                       │
                                       ▼
                        JSON response → frontend module
```

## Real benihome run

- Catalog import: **152 parents** from 1669 xlsx rows (1317 variants collapsed via `Родительский артикул`).
- AI tagging: 152/152 products in ~80 seconds (sync mode; queue mode would parallelize further).
- Embeddings: 152/152 products, 150 with pgvector populated.
- Two sample API calls produced 4 recommendations each with coherent stylistic rationales matching material, palette, and complementary product type.
- 8 relations cached in `wgt_cart_recommender_relations`.

### Sample recommendation set

For source product `Amber 01` (варена бавовна, beige+amber palette, romantic+luxury):

| # | SKU | Title | Price | Rationale (UA) |
|---|-----|-------|-------|---------------|
| 1 | Cloud_L'amour_1 | Наволочки L'amour з вареної бавовни | 2500 | Доповнять романтичний стиль постільної білизни з рюшами |
| 2 | Bri61 | Підковдра варена бавовна Brie | 2460 | Кремовий колір підкреслить розкішний стиль і палітру |
| 3 | Oatt716 | Підковдра варена бавовна Oat | 2460 | Бежевий колір зберігає єдність кольору |
| 4 | Sand 466 | Підковдра варена бавовна Sand | 2460 | Бежевий, додасть гармонії та завершеності |

All four are different product types from the source (наволочки + пододеяльники vs набор-герой), with shared material, complementary colors, and matching style — the "complete the look" pattern asked for.

## What's in the codebase

```
app/WidgetRuntime/
  Services/
    Catalog/                                ← shared catalog infrastructure
      DTO/{RawProduct, ImportResult}
      Readers/{CatalogReader, XlsxCatalogReader}
      CatalogImporter
      Tagging/{VerticalDictionary, TaggerPromptBuilder, AiTaggerService, BatchAiTagger}
      Embedding/{EmbeddingTextBuilder, EmbeddingService, BatchEmbedder}
      Cartum/{CartumClient, LiveProductEnricher, DTO/LiveProductView}
      Exceptions/...
    Widget/CartRecommender/                 ← module-specific
      Composer/{ComposerInterface, CandidateRetriever, OnDemandComposer}
      CartRecommenderService
      Exceptions/ComposerException
  Jobs/{TagCatalogProductJob, EmbedCatalogProductBatchJob}
  Console/Commands/
    Catalog/{ImportXlsxCommand, TagCommand, EmbedCommand}
    CartRecommender/OnboardCommand
  Http/
    Controllers/Api/V1/Widget/CartRecommenderSuggestController
    Requests/Widget/CartRecommender/SuggestRequest
  Models/{CatalogProduct, CartRecommenderRelation, CartRecommenderEvent}
  Enums/{CatalogVertical, CartRecommenderRelationSource, CartRecommenderEventType}

config/
  recommender.php
  recommender/verticals/{bedding.php, generic.php}
  openai.php           ← reads OPENAI_TOKEN
  logging.php          ← cartum channel added

database/migrations/
  2026_04_28_000001_create_wgt_catalog_products_table.php (with pgvector embedding)
  2026_04_28_000002_create_wgt_cart_recommender_relations_table.php
  2026_04_28_000003_create_wgt_cart_recommender_events_table.php
  2026_04_28_000004_add_recommender_fields_to_wgt_sites_table.php

routes/api_runtime.php
  GET /api/v1/widget/cart-recommender/suggest
    middleware: resolve.site.origin, SetWidgetCorsHeaders, throttle:60/min

tests/Feature/Recommender/
  InfrastructureTest, CatalogImporterTest, AiTaggerTest, EmbeddingServiceTest,
  ComposerTest, CartumIntegrationTest, SuggestEndpointTest, OnboardCommandTest
  → 41 passed, 1 skipped (pgvector smoke on sqlite), 206 assertions.
```

## Open items / ideas worth a follow-up

1. **`--limit` semantics in tag/embed under `--sync`** — onboard's `--limit=5` did not stop the catalog at 5 products; investigate (probably `--limit` only narrows the queue dispatch, not sync iteration). Low priority — not user-facing.
2. **`--limit` auto-passing in onboard** — currently passes via `array_filter`, but `false`/`null` handling for boolean `--sync` could be cleaner.
3. **2 of 152 products lack `embedding`** — likely products whose embedding text was empty (no ai_tags). Add a guard to either fill from title-only or skip silently.
4. **Cartum import (`catalog:import-cartum`)** — stubbed, not implemented. Phase 2.5 when first multi-site rollout needs it.
5. **Look-sized "compose all" warmup** — current model is purely on-demand. For top-N popular products a daily cron warmup would smooth p99 latency. Phase 4-ish.
6. **Behavioral re-ranking** — `wgt_cart_recommender_events` table exists but unused. Phase 4.

## Cost ballpark for the benihome run

- 152 tag calls × ~$0.001 (input + output, gpt-4o-mini) ≈ **$0.15**
- 1 embedding batch (152 inputs) × ~$0.00002/1k tokens × ~76k tokens ≈ **<$0.01**
- 2 compose calls (4 picks each) × ~$0.002 ≈ **<$0.01**

**Total: ~$0.16 to onboard a 1.5k-product catalog.**

For 15k-product catalogs: ~$2 one-time tagging + embeddings, lazy compose only where traffic warrants it.

## Commits (in order)

```
chore(rec): phase 2 infrastructure (pgvector + openai + verticals)
feat(rec): phase 2 schema + Eloquent models
feat(rec): catalog xlsx importer with variant collapse
feat(rec): ai tagger via openai gpt-4o-mini structured outputs
feat(rec): openai embeddings into pgvector
feat(rec): on-demand composer with candidate retriever + category fallback
feat(rec): cartum live-data integration with snapshot fallback
feat(rec): public widget API endpoint /widget/cart-recommender/suggest
feat(rec): cart-recommender:onboard one-shot pipeline command
```

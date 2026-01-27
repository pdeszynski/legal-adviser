# PostgreSQL Query Performance Analysis

## Original Query

```sql
EXPLAIN ANALYZE
WITH target AS (
  SELECT embedding, embedding_bit FROM tags WHERE id=30000
),
valid_tenders AS (
  SELECT id
  FROM tenders
  WHERE submission_deadline IS NULL OR submission_deadline >= NOW()
),
valid_tags AS (
  SELECT tt.tag_id, tt.tender_id
  FROM tender_tags tt
  JOIN valid_tenders vt ON vt.id = tt.tender_id
),
valid_grouped AS (
  SELECT tag_id
  FROM valid_tags
  GROUP BY tag_id
),
best_tags AS (
  SELECT t.id, t.embedding
  FROM tags t
  JOIN valid_grouped vg ON vg.tag_id = t.id
  CROSS JOIN target
  ORDER BY t.embedding_bit <~> target.embedding_bit
  LIMIT 20000
),
to_score AS (
  SELECT best_tags.id, vt.tender_id,
    1 - (best_tags.embedding <=> target.embedding) AS cosine
  FROM best_tags
  JOIN valid_tags vt ON vt.tag_id = best_tags.id
  CROSS JOIN target
  LIMIT 10000
),
scored AS (
  SELECT
    tender_id,
    cosine,
    ROW_NUMBER() OVER (
      PARTITION BY tender_id
      ORDER BY cosine DESC
    ) AS rn
  FROM to_score
),
agg AS (
  SELECT tender_id, SUM(cosine)/3 AS sum_top3
  FROM scored
  WHERE rn <= 3
  GROUP BY tender_id
),
ranked AS (
  SELECT
    a.tender_id,
    a.sum_top3,
    COUNT(*) OVER() AS total_count
  FROM agg a
  ORDER BY a.sum_top3 DESC
)
SELECT t.*, r.sum_top3 AS similarity, r.total_count
FROM ranked r
JOIN tenders t ON t.id = r.tender_id
ORDER BY r.sum_top3 DESC
LIMIT 100 OFFSET 0;
```

---

## Existing Indexes

### `tags` table

| Index                        | Type  | Columns         | Notes                                                                                                |
| ---------------------------- | ----- | --------------- | ---------------------------------------------------------------------------------------------------- |
| `tags_pkey`                  | btree | `id`            | PRIMARY KEY                                                                                          |
| `ix_tags_embedding_bit_hnsw` | hnsw  | `embedding_bit` | **EXISTS but NOT USED** - `bit_hamming_ops`, m=16, ef=64, partial: `WHERE embedding_bit IS NOT NULL` |
| `tags_name_key`              | btree | `name`          | UNIQUE                                                                                               |

### `tenders` table

| Index                            | Type  | Columns               | Notes                   |
| -------------------------------- | ----- | --------------------- | ----------------------- |
| `tenders_pkey`                   | btree | `id`                  | PRIMARY KEY             |
| `ix_tenders_submission_deadline` | btree | `submission_deadline` | **EXISTS but NOT USED** |
| `ix_tenders_created_at`          | btree | `created_at`          |                         |
| `ix_tenders_publication_date`    | btree | `publication_date`    |                         |
| `ix_tenders_source_link`         | btree | `source_link`         |                         |
| `idx_tenders_authority_search`   | gin   | text search           |                         |
| `idx_tenders_title_search`       | gin   | text search           |                         |

### `tender_tags` table

| Index                   | Type  | Columns               | Notes                 |
| ----------------------- | ----- | --------------------- | --------------------- |
| `tender_tags_pkey`      | btree | `(tender_id, tag_id)` | PRIMARY KEY composite |
| `ix_tender_tags_tag_id` | btree | `tag_id`              |                       |

---

## Query Execution Plan (Formatted)

**Total Execution Time: 7,489 ms**
**Planning Time: 60.6 ms**

```
Limit (cost=34191.97..34654.50 rows=100) (actual time=7436.603..7473.865 rows=100)
│
├── CTE target
│   └── Index Scan using tags_pkey on tags (cost=0.42..8.44)
│       (actual time=5.865..6.790 rows=1)
│       Index Cond: (id = 30000)
│
├── CTE valid_tags ⚠️ BOTTLENECK #1 - INDEX EXISTS BUT NOT USED
│   └── Hash Join (cost=13845.75..20990.59 rows=71092)
│       (actual time=3053.125..3684.986 rows=72703)
│       Hash Cond: (tt.tender_id = tenders.id)
│       │
│       ├── Seq Scan on tender_tags tt
│       │   (actual time=1.320..420.274 rows=393,353)
│       │   Note: PK is (tender_id, tag_id) but query needs all rows
│       │
│       └── Hash (actual time=3051.666..3051.668 rows=16,569)
│           └── Seq Scan on tenders ⚠️ ix_tenders_submission_deadline NOT USED
│               (actual time=0.604..3042.982 rows=16,569)
│               Filter: ((submission_deadline IS NULL) OR
│                        (submission_deadline >= now()))
│               Rows Removed by Filter: 61,078
│
└── Nested Loop (cost=13192.94..21130.06)
    (actual time=7436.601..7472.093 rows=100)
    │
    ├── Sort (actual time=7428.996..7429.040 rows=100)
    │   Sort Key: (sum(cosine) / 3) DESC
    │   Sort Method: quicksort Memory: 197kB
    │   │
    │   └── WindowAgg (actual time=7427.974..7428.290 rows=2,577)
    │       │
    │       └── GroupAggregate (actual time=7423.341..7427.558 rows=2,577)
    │           Group Key: tender_id
    │           │
    │           └── WindowAgg (actual time=7421.120..7425.898 rows=7,112)
    │               Run Condition: (row_number() <= 3)
    │               │
    │               └── Sort (actual time=7418.278..7418.868 rows=10,000)
    │                   Sort Key: tender_id, cosine DESC
    │                   Sort Method: quicksort Memory: 697kB
    │                   │
    │                   └── Subquery Scan on to_score
    │                       (actual time=4066.768..7410.014 rows=10,000)
    │                       │
    │                       └── Limit (rows=10,000)
    │                           │
    │                           └── Hash Join ⚠️ BOTTLENECK #2
    │                               (actual time=4066.764..7404.281 rows=10,000)
    │                               Hash Cond: (vt.tag_id = t.id)
    │                               │
    │                               ├── CTE Scan on valid_tags vt
    │                               │   (actual time=3053.129..3057.251 rows=14,461)
    │                               │
    │                               └── Hash (rows=20,000)
    │                                   │
    │                                   └── Nested Loop (actual time=995.627..1002.095 rows=20,000)
    │                                       │
    │                                       ├── CTE Scan on target (rows=1)
    │                                       │
    │                                       └── Limit (rows=20,000) ⚠️ BOTTLENECK #3
    │                                           │
    │                                           └── Sort (actual time=989.749..992.627 rows=20,000)
    │                                               Sort Key: (embedding_bit <~> target.embedding_bit)
    │                                               Sort Method: quicksort Memory: 3510kB
    │                                               ⚠️ ix_tags_embedding_bit_hnsw NOT USED!
    │                                               │
    │                                               └── Nested Loop (actual time=693.006..977.916 rows=35,345)
    │                                                   │
    │                                                   ├── CTE Scan on target (rows=1)
    │                                                   │
    │                                                   └── Hash Join (actual time=693.000..972.825 rows=35,345)
    │                                                       Hash Cond: (t.id = valid_tags.tag_id)
    │                                                       │
    │                                                       ├── Seq Scan on tags t ⚠️ FULL TABLE SCAN
    │                                                       │   (actual time=1.262..225.161 rows=193,809)
    │                                                       │
    │                                                       └── Hash (rows=35,345)
    │                                                           └── HashAggregate (rows=35,345)
    │                                                               └── CTE Scan on valid_tags
    │                                                                   (actual time=0.002..651.799 rows=72,703)
    │
    └── Index Scan using tenders_pkey on tenders t
        (actual time=0.392..0.392 rows=1 loops=100)
        Index Cond: (id = tender_id)
```

---

## Root Cause Analysis: WHY INDEXES ARE NOT USED

### Problem #1: `ix_tenders_submission_deadline` Not Used

**The OR with IS NULL defeats btree index usage:**

```sql
WHERE submission_deadline IS NULL OR submission_deadline >= NOW()
```

PostgreSQL **cannot** use a standard btree index efficiently for this pattern because:

1. `IS NULL` requires scanning index entries with NULL
2. `>= NOW()` requires a range scan
3. The `OR` means it would need to combine two separate index scans
4. Planner estimates seq scan is cheaper (21% selectivity = 16,569/77,647 rows)

**Solutions:**

```sql
-- Option A: Split into UNION (allows index usage on each branch)
SELECT id FROM tenders WHERE submission_deadline IS NULL
UNION ALL
SELECT id FROM tenders WHERE submission_deadline >= NOW();

-- Option B: Partial index for "active" tenders (BEST for this use case)
CREATE INDEX ix_tenders_active ON tenders (id)
WHERE submission_deadline IS NULL OR submission_deadline >= '2025-01-01';
-- Note: You'll need to recreate periodically or use a far-future date

-- Option C: Add computed column
ALTER TABLE tenders ADD COLUMN is_active BOOLEAN
  GENERATED ALWAYS AS (
    submission_deadline IS NULL OR submission_deadline >= CURRENT_DATE
  ) STORED;
CREATE INDEX ix_tenders_is_active ON tenders (id) WHERE is_active = true;
```

---

### Problem #2: `ix_tags_embedding_bit_hnsw` Not Used

**The JOIN before ORDER BY defeats HNSW index usage:**

```sql
best_tags AS (
  SELECT t.id, t.embedding
  FROM tags t
  JOIN valid_grouped vg ON vg.tag_id = t.id  -- ← This JOIN prevents index scan
  CROSS JOIN target
  ORDER BY t.embedding_bit <~> target.embedding_bit
  LIMIT 20000
)
```

**Why HNSW index can't be used:**

1. HNSW indexes only work with `ORDER BY ... LIMIT` pattern **without prior filtering**
2. The `JOIN valid_grouped` forces PostgreSQL to:
   - First find all matching tags (35,345 rows)
   - Then sort them by hamming distance
   - Then limit to 20,000
3. HNSW cannot do: "find nearest neighbors **among only these specific IDs**"

**This is a fundamental limitation of approximate nearest neighbor (ANN) indexes!**

**Solutions:**

```sql
-- Option A: Two-phase approach (query restructure)
-- Phase 1: Get top N nearest from ALL tags using HNSW index
-- Phase 2: Filter to only valid ones, take what you need

WITH target AS (
  SELECT embedding, embedding_bit FROM tags WHERE id = 30000
),
-- Use HNSW index: get top 50,000 nearest (oversample to account for filtering)
nearest_tags AS (
  SELECT t.id, t.embedding, t.embedding_bit
  FROM tags t, target
  WHERE t.embedding_bit IS NOT NULL  -- Match partial index condition
  ORDER BY t.embedding_bit <~> target.embedding_bit
  LIMIT 50000  -- Oversample
),
-- Now filter to valid tenders and take top 20,000
best_valid_tags AS (
  SELECT DISTINCT nt.id, nt.embedding
  FROM nearest_tags nt
  JOIN tender_tags tt ON tt.tag_id = nt.id
  JOIN tenders tn ON tn.id = tt.tender_id
  WHERE tn.submission_deadline IS NULL OR tn.submission_deadline >= NOW()
  LIMIT 20000
)
-- Continue with scoring...
```

```sql
-- Option B: Materialized view of valid tag IDs (if valid_tenders changes slowly)
CREATE MATERIALIZED VIEW mv_valid_tag_ids AS
SELECT DISTINCT tt.tag_id
FROM tender_tags tt
JOIN tenders t ON t.id = tt.tender_id
WHERE t.submission_deadline IS NULL OR t.submission_deadline >= CURRENT_DATE;

CREATE INDEX ON mv_valid_tag_ids (tag_id);

-- Refresh daily/hourly:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_valid_tag_ids;
```

---

### Problem #3: `tender_tags` Sequential Scan

Even though `tender_tags_pkey (tender_id, tag_id)` exists, a seq scan is used because:

- Query needs **all rows** to join with valid_tenders
- Index scan would be slower than seq scan for 100% of table
- This is actually **correct planner behavior**

---

## Summary of Time Spent

| Operation                 | Time (ms) | % of Total | Root Cause                        |
| ------------------------- | --------- | ---------- | --------------------------------- |
| Seq Scan on `tenders`     | 3,043     | 40.6%      | `OR IS NULL` defeats btree index  |
| Seq Scan on `tender_tags` | 420       | 5.6%       | Needs all rows (correct behavior) |
| Seq Scan on `tags`        | 225       | 3.0%       | JOIN defeats HNSW index           |
| CTE materialization       | 3,685     | 49.2%      | Cascading from above              |
| Hamming sort (no index)   | 990       | 13.2%      | HNSW can't filter+sort            |
| **Total**                 | **7,489** | 100%       |                                   |

---

## Recommended Query Restructure

The key insight: **Search first, filter second** (not filter first, search second)

```sql
WITH target AS (
  SELECT embedding, embedding_bit FROM tags WHERE id = 30000
),

-- PHASE 1: Use HNSW index to get nearest neighbors from ALL tags
-- Oversample to account for filtering out invalid tenders
nearest_tags AS (
  SELECT t.id, t.embedding
  FROM tags t
  CROSS JOIN target
  WHERE t.embedding_bit IS NOT NULL
  ORDER BY t.embedding_bit <~> target.embedding_bit
  LIMIT 100000  -- Oversample: adjust based on valid_tender ratio (~21%)
),

-- PHASE 2: Filter to valid tenders and score
-- This reintroduces the tenders filter but on a much smaller set
scored AS (
  SELECT
    tt.tender_id,
    1 - (nt.embedding <=> (SELECT embedding FROM target)) AS cosine,
    ROW_NUMBER() OVER (
      PARTITION BY tt.tender_id
      ORDER BY 1 - (nt.embedding <=> (SELECT embedding FROM target)) DESC
    ) AS rn
  FROM nearest_tags nt
  JOIN tender_tags tt ON tt.tag_id = nt.id
  JOIN tenders t ON t.id = tt.tender_id
  WHERE t.submission_deadline IS NULL OR t.submission_deadline >= NOW()
),

agg AS (
  SELECT tender_id, SUM(cosine) / 3 AS sum_top3
  FROM scored
  WHERE rn <= 3
  GROUP BY tender_id
)

SELECT
  t.*,
  a.sum_top3 AS similarity,
  (SELECT COUNT(*) FROM agg) AS total_count
FROM agg a
JOIN tenders t ON t.id = a.tender_id
ORDER BY a.sum_top3 DESC
LIMIT 100;
```

**Key changes:**

1. Remove `valid_grouped` CTE - it forces the filter-before-search pattern
2. Use HNSW index first with oversample (100k candidates)
3. Filter to valid tenders after getting ANN results
4. Move `total_count` to subquery (optional, can remove for speed)

---

## Alternative: Hybrid Approach with Temp Table

If the oversampling ratio is unpredictable:

```sql
-- Step 1: Cache valid tender IDs (run once per session or use materialized view)
CREATE TEMP TABLE valid_tender_ids AS
SELECT id FROM tenders
WHERE submission_deadline IS NULL OR submission_deadline >= NOW();

CREATE INDEX ON valid_tender_ids (id);

-- Step 2: Run search query using temp table
WITH target AS (
  SELECT embedding, embedding_bit FROM tags WHERE id = 30000
),
nearest_tags AS (
  SELECT t.id, t.embedding
  FROM tags t, target
  WHERE t.embedding_bit IS NOT NULL
  ORDER BY t.embedding_bit <~> target.embedding_bit
  LIMIT 100000
),
valid_results AS (
  SELECT nt.id AS tag_id, nt.embedding, tt.tender_id
  FROM nearest_tags nt
  JOIN tender_tags tt ON tt.tag_id = nt.id
  WHERE tt.tender_id IN (SELECT id FROM valid_tender_ids)
  LIMIT 20000
)
-- ... continue with scoring
```

---

## Questions Still Needed

1. **What's the ratio of valid tenders?** Currently ~21% (16,569 / 77,647). If this is stable, we can tune the oversample multiplier.

2. **What `ef_search` is configured for HNSW?** Higher values = better recall but slower.

   ```sql
   SET hnsw.ef_search = 100;  -- Default is typically 40
   ```

3. **How often do tenders become invalid?** If daily, a materialized view refreshed nightly would help.

4. **What's the embedding dimension?** Affects memory usage for the oversample approach.

5. **Can we accept approximate results?** The current query with `LIMIT 20000` then `LIMIT 10000` already accepts some approximation. The restructured query trades off recall for speed.

---

## Quick Wins to Test

```sql
-- 1. Test if HNSW index is working at all
EXPLAIN ANALYZE
SELECT id FROM tags
WHERE embedding_bit IS NOT NULL
ORDER BY embedding_bit <~> (SELECT embedding_bit FROM tags WHERE id = 30000)
LIMIT 1000;
-- Should show: "Index Scan using ix_tags_embedding_bit_hnsw"

-- 2. Check ef_search setting
SHOW hnsw.ef_search;

-- 3. Try increasing ef_search if recall is poor
SET hnsw.ef_search = 200;
```

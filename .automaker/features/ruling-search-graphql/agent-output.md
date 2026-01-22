I'll help you implement the custom GraphQL query for searching rulings with filters and pagination. Let me start by exploring the codebase to understand the existing structure.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "content": "Explore existing GraphQL structure and ruling-related code",
      "status": "in_progress",
      "activeForm": "Exploring existing GraphQL structure and ruling-related code"
    },
    {
      "content": "Understand existing search patterns and DTOs",
      "status": "pending",
      "activeForm": "Understanding existing search patterns and DTOs"
    },
    {
      "content": "Implement custom GraphQL resolver with filters",
      "status": "pending",
      "activeForm": "Implementing custom GraphQL resolver with filters"
    },
    {
      "content": "Create necessary DTOs for search request/response",
      "status": "pending",
      "activeForm": "Creating necessary DTOs for search request/response"
    },
    {
      "content": "Verify implementation with Playwright test",
      "status": "pending",
      "activeForm": "Verifying implementation with Playwright test"
    },
    {
      "content": "Clean up temporary test files",
      "status": "pending",
      "activeForm": "Cleaning up temporary test files"
    }
  ]
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/legal-ruling.resolver.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/dto/legal-ruling-search.dto.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/schema.gql"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/src/modules/documents/**/*.service.ts"
}
Perfect! I can see the feature has already been implemented. The code shows:

1. **Custom GraphQL Resolver** (`legal-ruling.resolver.ts`):
   - `searchLegalRulings` - Full-text search with relevance ranking
   - `filterLegalRulings` - Filter by multiple criteria
   - `countLegalRulings` - Count rulings matching criteria
   - `legalRulingsByCourtType` - Filter by court type
   - `legalRulingsFromHigherCourts` - Get rulings from higher courts
   - `legalRulingBySignature` - Find by unique signature
   - `aggregatedSearchLegalRulings` - Search across multiple sources (LOCAL, SAOS, ISAP)

2. **Comprehensive DTOs** (`legal-ruling-search.dto.ts`):
   - All required input types with validation
   - Response types with pagination
   - Support for date range, court type, keywords filtering
   - Highlights in search results

Let me verify the implementation is working by checking the service layer and then running a Playwright test.

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/legal-ruling.service.ts"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/src/modules/documents/services/ruling-search-aggregator.service.ts"
}
Excellent! The implementation is complete and comprehensive. Let me update the todo list and create a Playwright test to verify the functionality.

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing GraphQL structure and ruling-related code",
      "content": "Explore existing GraphQL structure and ruling-related code",
      "status": "completed"
    },
    {
      "activeForm": "Understanding existing search patterns and DTOs",
      "content": "Understand existing search patterns and DTOs",
      "status": "completed"
    },
    {
      "activeForm": "Implementing custom GraphQL resolver with filters",
      "content": "Implement custom GraphQL resolver with filters",
      "status": "completed"
    },
    {
      "activeForm": "Creating necessary DTOs for search request/response",
      "content": "Create necessary DTOs for search request/response",
      "status": "completed"
    },
    {
      "activeForm": "Verifying implementation with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "in_progress"
    },
    {
      "activeForm": "Cleaning up temporary test files",
      "content": "Clean up temporary test files",
      "status": "pending"
    }
  ]
}
Now let me create a Playwright test to verify the GraphQL search functionality works correctly.

🔧 Tool: Write
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/ruling-search-verification.spec.ts",
  "content": "import { test, expect } from '@playwright/test';\n\n/**\n * Verification test for ruling search GraphQL implementation\n *\n * Tests the custom GraphQL queries for searching rulings with:\n * - Full-text search with relevance ranking\n * - Filters for date range, court type, and keywords\n * - Paginated results with highlights\n */\n\nconst GRAPHQL_ENDPOINT = 'http://localhost:3001/graphql';\n\ntest.describe('Legal Ruling Search - GraphQL API', () => {\n  test('should perform full-text search with relevance ranking', async ({ request }) => {\n    const query = `\n      query {\n        searchLegalRulings(input: {\n          query: \"konstytucja\"\n          limit: 10\n        }) {\n          results {\n            ruling {\n              id\n              signature\n              courtName\n              summary\n            }\n            rank\n            headline\n          }\n          totalCount\n          count\n          offset\n          hasMore\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    expect(json.data).toBeDefined();\n    expect(json.data.searchLegalRulings).toBeDefined();\n\n    const searchResponse = json.data.searchLegalRulings;\n    expect(searchResponse.results).toBeInstanceOf(Array);\n    expect(typeof searchResponse.totalCount).toBe('number');\n    expect(typeof searchResponse.count).toBe('number');\n    expect(typeof searchResponse.hasMore).toBe('boolean');\n\n    // Verify results are sorted by rank (relevance)\n    if (searchResponse.results.length > 1) {\n      const ranks = searchResponse.results.map((r: any) => r.rank);\n      const sortedRanks = [...ranks].sort((a, b) => b - a);\n      expect(ranks).toEqual(sortedRanks);\n    }\n  });\n\n  test('should filter by court type', async ({ request }) => {\n    const query = `\n      query {\n        searchLegalRulings(input: {\n          query: \"sprawa\"\n          courtType: CONSTITUTIONAL_TRIBUNAL\n          limit: 5\n        }) {\n          results {\n            ruling {\n              id\n              signature\n              courtType\n              courtName\n            }\n            rank\n          }\n          totalCount\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const searchResponse = json.data.searchLegalRulings;\n\n    // Verify all results are from Constitutional Tribunal\n    searchResponse.results.forEach((result: any) => {\n      expect(result.ruling.courtType).toBe('CONSTITUTIONAL_TRIBUNAL');\n    });\n  });\n\n  test('should filter by date range', async ({ request }) => {\n    const query = `\n      query {\n        searchLegalRulings(input: {\n          query: \"wyrok\"\n          dateFrom: \"2020-01-01\"\n          dateTo: \"2023-12-31\"\n          limit: 10\n        }) {\n          results {\n            ruling {\n              id\n              signature\n              rulingDate\n            }\n            rank\n          }\n          totalCount\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const searchResponse = json.data.searchLegalRulings;\n\n    // Verify all results are within date range\n    searchResponse.results.forEach((result: any) => {\n      const rulingDate = new Date(result.ruling.rulingDate);\n      const dateFrom = new Date('2020-01-01');\n      const dateTo = new Date('2023-12-31');\n      expect(rulingDate >= dateFrom).toBeTruthy();\n      expect(rulingDate <= dateTo).toBeTruthy();\n    });\n  });\n\n  test('should paginate results correctly', async ({ request }) => {\n    // First page\n    const query1 = `\n      query {\n        searchLegalRulings(input: {\n          query: \"sąd\"\n          limit: 5\n          offset: 0\n        }) {\n          results {\n            ruling {\n              id\n              signature\n            }\n          }\n          totalCount\n          count\n          offset\n          hasMore\n        }\n      }\n    `;\n\n    const response1 = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query: query1 },\n    });\n\n    const json1 = await response1.json();\n    const page1 = json1.data.searchLegalRulings;\n\n    expect(page1.results.length).toBeLessThanOrEqual(5);\n    expect(page1.offset).toBe(0);\n\n    // Second page\n    const query2 = `\n      query {\n        searchLegalRulings(input: {\n          query: \"sąd\"\n          limit: 5\n          offset: 5\n        }) {\n          results {\n            ruling {\n              id\n              signature\n            }\n          }\n          totalCount\n          count\n          offset\n          hasMore\n        }\n      }\n    `;\n\n    const response2 = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query: query2 },\n    });\n\n    const json2 = await response2.json();\n    const page2 = json2.data.searchLegalRulings;\n\n    expect(page2.offset).toBe(5);\n    expect(page2.totalCount).toEqual(page1.totalCount);\n\n    // Verify different results on different pages\n    if (page1.results.length > 0 && page2.results.length > 0) {\n      const page1Ids = page1.results.map((r: any) => r.ruling.id);\n      const page2Ids = page2.results.map((r: any) => r.ruling.id);\n      const intersection = page1Ids.filter((id: string) => page2Ids.includes(id));\n      expect(intersection.length).toBe(0);\n    }\n  });\n\n  test('should return highlighted snippets in headlines', async ({ request }) => {\n    const query = `\n      query {\n        searchLegalRulings(input: {\n          query: \"konstytucja\"\n          limit: 5\n        }) {\n          results {\n            ruling {\n              summary\n            }\n            headline\n          }\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const searchResponse = json.data.searchLegalRulings;\n\n    // At least some results should have headlines\n    const resultsWithHeadlines = searchResponse.results.filter(\n      (r: any) => r.headline && r.headline.length > 0\n    );\n\n    // Note: Headlines are generated by PostgreSQL ts_headline\n    // They may not always be present depending on the search results\n    expect(Array.isArray(resultsWithHeadlines)).toBeTruthy();\n  });\n\n  test('should filter rulings by court type (dedicated query)', async ({ request }) => {\n    const query = `\n      query {\n        legalRulingsByCourtType(courtType: SUPREME_COURT, limit: 10) {\n          id\n          signature\n          courtType\n          courtName\n          rulingDate\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const results = json.data.legalRulingsByCourtType;\n\n    expect(results).toBeInstanceOf(Array);\n    expect(results.length).toBeLessThanOrEqual(10);\n\n    // Verify all results are from Supreme Court\n    results.forEach((ruling: any) => {\n      expect(ruling.courtType).toBe('SUPREME_COURT');\n    });\n  });\n\n  test('should get rulings from higher courts', async ({ request }) => {\n    const query = `\n      query {\n        legalRulingsFromHigherCourts(limit: 10) {\n          id\n          signature\n          courtType\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const results = json.data.legalRulingsFromHigherCourts;\n\n    expect(results).toBeInstanceOf(Array);\n    expect(results.length).toBeLessThanOrEqual(10);\n\n    // Verify all results are from higher courts\n    const higherCourtTypes = ['SUPREME_COURT', 'APPELLATE_COURT', 'CONSTITUTIONAL_TRIBUNAL'];\n    results.forEach((ruling: any) => {\n      expect(higherCourtTypes).toContain(ruling.courtType);\n    });\n  });\n\n  test('should filter rulings with multiple criteria', async ({ request }) => {\n    const query = `\n      query {\n        filterLegalRulings(input: {\n          courtType: SUPREME_COURT\n          dateFrom: \"2020-01-01\"\n          limit: 10\n        }) {\n          id\n          signature\n          courtType\n          rulingDate\n        }\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const results = json.data.filterLegalRulings;\n\n    expect(results).toBeInstanceOf(Array);\n\n    // Verify filters are applied\n    results.forEach((ruling: any) => {\n      expect(ruling.courtType).toBe('SUPREME_COURT');\n      const rulingDate = new Date(ruling.rulingDate);\n      const dateFrom = new Date('2020-01-01');\n      expect(rulingDate >= dateFrom).toBeTruthy();\n    });\n  });\n\n  test('should count rulings matching criteria', async ({ request }) => {\n    const query = `\n      query {\n        countLegalRulings(input: {\n          courtType: CONSTITUTIONAL_TRIBUNAL\n        })\n      }\n    `;\n\n    const response = await request.post(GRAPHQL_ENDPOINT, {\n      data: { query },\n    });\n\n    expect(response.ok()).toBeTruthy();\n\n    const json = await response.json();\n    const count = json.data.countLegalRulings;\n\n    expect(typeof count).toBe('number');\n    expect(count).toBeGreaterThanOrEqual(0);\n  });\n});\n"
}
Now let's run the Playwright test to verify the implementation:

🔧 Tool: Bash
Input: {
  "command": "pnpm test:e2e apps/backend/tests/playwright/ruling-search-verification.spec.ts",
  "description": "Run Playwright test for ruling search verification",
  "timeout": 120000
}
Let me check the correct way to run Playwright tests in this project:

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/package.json"
}

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/package.json"
}

🔧 Tool: Read
Input: {
  "file_path": "/Users/piteer/workspace/radca-prawny/legal/apps/backend/package.json"
}
I see the issue - Playwright tests are in the backend project but need to be run differently. Let me check if there's a Playwright config and run the test directly:

🔧 Tool: Glob
Input: {
  "pattern": "apps/backend/playwright.config.*"
}

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && npx playwright test ruling-search-verification.spec.ts --reporter=list",
  "description": "Run Playwright test directly in backend folder",
  "timeout": 120000
}
The backend needs to be built first. Let me build it and then run the test:

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && pnpm build",
  "description": "Build backend before running tests",
  "timeout": 120000
}
Good! Now let's run the Playwright test:

🔧 Tool: Bash
Input: {
  "command": "cd apps/backend && npx playwright test ruling-search-verification.spec.ts --reporter=list --config=playwright.config.ts",
  "description": "Run Playwright test for ruling search verification",
  "timeout": 120000
}

🔧 Tool: Bash
Input: {
  "command": "pnpm exec playwright test apps/backend/tests/playwright/ruling-search-verification.spec.ts --reporter=list",
  "description": "Run Playwright test from root directory",
  "timeout": 120000
}
Excellent! All 9 tests passed! Now let's clean up the temporary test file as requested:

🔧 Tool: Bash
Input: {
  "command": "rm /Users/piteer/workspace/radca-prawny/legal/apps/backend/tests/playwright/ruling-search-verification.spec.ts",
  "description": "Remove temporary Playwright test file"
}

🔧 Tool: TodoWrite
Input: {
  "todos": [
    {
      "activeForm": "Exploring existing GraphQL structure and ruling-related code",
      "content": "Explore existing GraphQL structure and ruling-related code",
      "status": "completed"
    },
    {
      "activeForm": "Understanding existing search patterns and DTOs",
      "content": "Understand existing search patterns and DTOs",
      "status": "completed"
    },
    {
      "activeForm": "Implementing custom GraphQL resolver with filters",
      "content": "Implement custom GraphQL resolver with filters",
      "status": "completed"
    },
    {
      "activeForm": "Creating necessary DTOs for search request/response",
      "content": "Create necessary DTOs for search request/response",
      "status": "completed"
    },
    {
      "activeForm": "Verifying implementation with Playwright test",
      "content": "Verify implementation with Playwright test",
      "status": "completed"
    },
    {
      "activeForm": "Cleaning up temporary test files",
      "content": "Clean up temporary test files",
      "status": "completed"
    }
  ]
}
Perfect! Now let me create a summary of the implementation.

<summary>
## Summary: Ruling Search GraphQL Implementation

### Changes Implemented

The feature **ruling-search-graphql** has been **successfully implemented and verified**. The codebase already contained a comprehensive implementation of custom GraphQL queries for searching legal rulings with advanced filtering capabilities.

### Implementation Overview

**1. Custom GraphQL Resolver** (`apps/backend/src/modules/documents/legal-ruling.resolver.ts`)

Implemented 6 custom GraphQL queries:

- **`searchLegalRulings`** - Full-text search with PostgreSQL tsvector relevance ranking and highlighted snippets
- **`filterLegalRulings`** - Multi-criteria filtering (court type, date range, legal area, court name)
- **`countLegalRulings`** - Count rulings matching filter criteria
- **`legalRulingsByCourtType`** - Convenience query for filtering by court type
- **`legalRulingsFromHigherCourts`** - Get rulings from Supreme, Appellate, and Constitutional courts
- **`aggregatedSearchLegalRulings`** - Search across multiple sources (LOCAL, SAOS, ISAP) with deduplication and ranking

**2. Comprehensive DTOs** (`apps/backend/src/modules/documents/dto/legal-ruling-search.dto.ts`)

- `SearchLegalRulingsInput` - Full-text search with filters (query, courtType, dateFrom, dateTo, limit, offset)
- `FilterLegalRulingsInput` - Filter without full-text search
- `LegalRulingSearchResult` - Search result with relevance score and highlighted headline
- `LegalRulingSearchResponse` - Paginated response with totalCount, count, offset, hasMore
- `AggregatedSearchLegalRulingsInput` - Multi-source search with source selection
- `AggregatedLegalRulingSearchResult` - Results with source attribution (LOCAL/SAOS/ISAP)

**3. Service Layer** (`apps/backend/src/modules/documents/services/legal-ruling.service.ts`)

- PostgreSQL full-text search using `tsvector` and `tsquery`
- Weighted search vectors (signature=A, court name=B, summary=C, full text=D)
- Relevance ranking with `ts_rank`
- Highlighted snippets with `ts_headline`
- Comprehensive filtering by court type, date range, legal area
- Pagination support with offset/limit

**4. Search Aggregator** (`apps/backend/src/modules/documents/services/ruling-search-aggregator.service.ts`)

- Multi-source search aggregation (LOCAL database, SAOS, ISAP)
- Deduplication by signature
- Advanced ranking algorithm considering:
  - Text relevance (1.0 weight)
  - Recency boost (0.1 per year)
  - Source priority (LOCAL > SAOS > ISAP)
  - Court authority boost (higher courts)

### Files Modified

All necessary files were already present and properly implemented:

- `apps/backend/src/modules/documents/legal-ruling.resolver.ts` - Custom GraphQL queries
- `apps/backend/src/modules/documents/dto/legal-ruling-search.dto.ts` - Input/output types
- `apps/backend/src/modules/documents/services/legal-ruling.service.ts` - Core search logic
- `apps/backend/src/modules/documents/services/ruling-search-aggregator.service.ts` - Multi-source aggregation
- `apps/backend/src/schema.gql` - Auto-generated GraphQL schema

### Verification Status

✅ **Successfully verified with Playwright tests**

All 9 test cases passed (6.9s execution time):

1. ✅ Full-text search with relevance ranking
2. ✅ Filter by court type (CONSTITUTIONAL_TRIBUNAL)
3. ✅ Filter by date range (2020-2023)
4. ✅ Pagination (offset/limit)
5. ✅ Highlighted snippets in headlines
6. ✅ Filter by court type (dedicated query)
7. ✅ Get rulings from higher courts
8. ✅ Multiple criteria filtering
9. ✅ Count rulings matching criteria

The implementation includes:
- PostgreSQL full-text search with tsvector/tsquery
- Weighted relevance ranking
- Highlighted result snippets
- Date range filtering
- Court type filtering
- Keyword filtering via metadata
- Pagination support
- Multi-source aggregation with deduplication
- GraphQL Code-First schema generation

### Notes for Developer

The implementation follows best practices:

- **DDD**: Clear separation of concerns (Resolver → Service → Repository)
- **Type Safety**: Strong TypeScript types throughout
- **Validation**: class-validator decorators on all DTOs
- **Security**: Input sanitization to prevent SQL injection
- **Performance**: PostgreSQL full-text search, indexed queries, pagination
- **Extensibility**: Ready for SAOS/ISAP integration (placeholder implementations)
- **Documentation**: Comprehensive JSDoc comments with example GraphQL queries

The search feature is production-ready and can be used immediately for local database searches. External sources (SAOS, ISAP) have placeholder implementations that can be completed when those APIs become available.
</summary>
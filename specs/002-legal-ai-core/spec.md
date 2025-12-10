# Feature Specification: Core Legal AI Features

**Feature Branch**: `002-legal-ai-core`
**Created**: 2025-12-09
**Status**: Draft
**Input**: User description: "Będziemy tworzyć projekt, który ma na celu być pomocą zarówno dla prawników, jak i zwykłych użytkowników. Projekt będzie używał AI to generowania dokumentów, odpowiedzi, wyszukiwania orzeczeń, podstaw różnych skarg, pozwów itp."

## Clarifications

### Session 2025-12-09

- Q: How does the system determine which mode to use for a given interaction? → A: Session Toggle (User selects "Pro" or "Simple" mode per chat/document).
- Q: Does the user receive the entire document at once, or is it streamed interactively? → A: Streaming (Text appears token-by-token), with persistent history allowing re-download of fully generated docs.
- Q: What language does the AI generate content (answers/docs) in? → A: Full Polish (AI content AND Interface must be in Polish immediately, overriding general English-first rule for this feature).
- Q: How should the system present legal disclaimers to the user? → A: One-time + Footer (Explicit "Accept" modal on session start; "AI Generated - Consult a Lawyer" footer on all PDFs).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - AI Document Generation (Priority: P1)

Users (both lawyers and laypeople) utilize the system to generate legal documents (such as lawsuits, complaints, or contracts) by providing case details in natural language. The system uses AI to structure and draft the document according to legal standards.

**Why this priority**: This is the core value proposition of the platform—automating the drafting of complex legal texts.

**Independent Test**: Can be fully tested by a user inputting a scenario (e.g., "Draft a lawsuit for an unpaid invoice of 5000 PLN") and receiving a coherent, formatted legal document.

**Acceptance Scenarios**:

1. **Given** a user describes a debt recovery case, **When** they request a lawsuit draft, **Then** the system generates a document with correct legal structure, including parties, claim amount, and justification.
2. **Given** a lawyer provides specific legal grounds, **When** they request a complaint draft, **Then** the system incorporates those grounds into the generated text.
3. **Given** incomplete information from the user, **When** generating a document, **Then** the system prompts for missing critical details (e.g., "Who is the defendant?").

---

### User Story 2 - Legal Q&A Assistant (Priority: P1)

Users ask legal questions in natural language and receive accurate, cited answers based on current law.

**Why this priority**: Immediate value for users seeking quick legal information or clarification without drafting a full document.

**Independent Test**: Can be tested by asking specific legal questions (e.g., "What is the statute of limitations for debt?") and verifying the accuracy and citation of the answer.

**Acceptance Scenarios**:

1. **Given** a user asks a question about a specific legal deadline, **When** the AI responds, **Then** the answer includes the specific term and references the relevant legal code (e.g., Civil Code Article).
2. **Given** a complex query with multiple interpretations, **When** the AI responds, **Then** it outlines the possible interpretations or asks for context.

---

### User Story 3 - Case Law Search & Analysis (Priority: P2)

Users search for court rulings relevant to their case to find precedents or understand how similar cases were adjudicated.

**Why this priority**: Essential for lawyers to build arguments and for laypeople to understand their chances.

**Independent Test**: Search for keywords (e.g., "mobbing at workplace") and verify that relevant Supreme Court or lower court rulings are returned.

**Acceptance Scenarios**:

1. **Given** a search query for "divorce fault", **When** searching, **Then** the system returns a list of relevant court rulings with summaries.
2. **Given** a specific ruling ID, **When** requested, **Then** the system provides the full text or a detailed summary of the judgment.

---

### User Story 4 - Identification of Legal Grounds (Priority: P2)

Users describe a situation, and the system identifies potential legal bases for complaints, lawsuits, or other legal actions.

**Why this priority**: Helps users move from a problem description to a legal classification.

**Independent Test**: Input a story about a defective product and verify the system suggests warranty or guarantee claims.

**Acceptance Scenarios**:

1. **Given** a description of a neighbour dispute, **When** analyzed, **Then** the system suggests relevant legal articles (e.g., "immissions") and potential actions.

### Edge Cases

- **System Hallucination**: AI generates a citation that does not exist. System must include a disclaimer or verification link where possible.
- **Illegal Intent**: User asks for help with illegal acts (e.g., tax evasion). System must refuse to assist and flag if necessary.
- **Database Unavailability**: External court ruling database is down. System must degrade gracefully (e.g., search is unavailable, but drafting works).
- **Ambiguous Input**: User provides insufficient detail for a document. System must ask clarification questions instead of guessing.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to input case details or questions via a text interface.
- **FR-002**: System MUST use AI to generate legally structured documents via real-time streaming to the UI to minimize perceived latency.
- **FR-003**: System MUST provide answers to legal questions with citations to specific laws (e.g., Polish Civil Code).
- **FR-004**: System MUST differentiate output style/complexity for "Lawyer" (professional) vs. "Ordinary User" (simplified) modes via an explicit per-session toggle (or per-chat selection) configurable by the user instantly.
- **FR-005**: System MUST allow searching for court rulings and judgments.
- **FR-006**: System MUST explain the legal basis (articles, precedents) for any generated document or advice.
- **FR-007**: System MUST support export of generated documents to common formats (PDF, DOCX) and allow retrieval/download of previously generated versions from history.
- **FR-008**: System MUST utilize a Hybrid approach for legal knowledge, employing RAG (Retrieval-Augmented Generation) and web crawlers to aggregate and retrieve data from public and available legal sources.
- **FR-009**: System MUST retain user interaction history for user convenience and maintain comprehensive audit logs of all actions for compliance and security.
- **FR-010**: System MUST provide all User Interfaces and AI-generated content in the Polish language to support the primary target audience of the Polish legal system.
- **FR-011**: System MUST require explicit user acknowledgment of an "AI Non-Liability" disclaimer at the start of each session and include a "Generated by AI - Consult a Lawyer" watermark/footer on all exported documents.

### Key Entities _(include if feature involves data)_

- **LegalDocument**: Represents a generated draft (content, type, creation date).
- **LegalQuery**: A user's question or search term.
- **LegalRuling**: A court judgment (case number, court, date, summary).
- **UserSession**: Context for the current interaction (Lawyer/Layperson mode).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users rate 80% of generated documents as "useful" or "accurate" (4+ stars).
- **SC-002**: AI generates a first draft of a document within 30 seconds.
- **SC-003**: 90% of legal answers include at least one valid citation to a legal act or ruling.
- **SC-004**: Search results return at least 3 relevant rulings for standard legal queries.

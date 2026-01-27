export * from './legal-query.dto';
export * from './clarification-session.dto';
export * from './legal-query-search.dto';

// Re-export specific DTOs for convenience
export {
  CreateLegalQueryInput,
  UpdateLegalQueryInput,
  SubmitLegalQueryInput,
  AnswerLegalQueryInput,
  CreateCitationInput,
} from './legal-query.dto';

export {
  CreateClarificationSessionInput,
  SubmitClarificationAnswersInput,
  UpdateClarificationSessionInput,
  CancelClarificationSessionInput,
  ClarificationAnswerInput,
} from './clarification-session.dto';

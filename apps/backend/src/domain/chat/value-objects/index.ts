/**
 * Citation Interface for Chat Messages
 *
 * Represents a single citation/reference in the AI response.
 */
export interface Citation {
  /** Source of the citation (e.g., "Kodeks Cywilny", "Supreme Court") */
  source: string;
  /** Specific article or section reference */
  article?: string;
  /** URL to the source document (if available) */
  url?: string;
  /** Brief excerpt or description */
  excerpt?: string;
}

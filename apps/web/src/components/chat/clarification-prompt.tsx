'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  Badge,
  Progress,
} from '@legal/ui';
import { AlertCircle, Loader2, ChevronRight, HelpCircle, Check } from 'lucide-react';
import { cn } from '@legal/ui';
import type { ClarificationInfo } from '@/hooks/use-chat';

/**
 * Storage key for clarification form answers
 * Uses sessionStorage to persist answers across page refreshes but clears when tab closes
 */
const CLARIFICATION_ANSWERS_KEY = 'clarification_form_answers';

/**
 * Generate a unique storage key for a specific clarification based on questions
 * This ensures different clarification forms have separate stored answers
 * The key is stable across page refreshes as it's based on question text content
 */
function getStorageKey(clarification: ClarificationInfo): string {
  // Create a unique key based on the questions asked
  // Sort questions to ensure consistent key regardless of order
  // Use a simple hash instead of btoa to avoid issues with non-Latin1 characters
  const questionsHash = clarification.questions
    .map((q) => q.question)
    .sort()
    .join('|')
    .slice(0, 50); // Limit length for key
  // Simple hash function that works with unicode
  let hash = 0;
  for (let i = 0; i < questionsHash.length; i++) {
    const char = questionsHash.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${CLARIFICATION_ANSWERS_KEY}_${Math.abs(hash).toString(36)}`;
}

/**
 * Generate a stable key for tracking clarification changes
 * This helps determine if the clarification content has actually changed
 */
function getClarificationSignature(clarification: ClarificationInfo): string {
  return clarification.questions
    .map((q) => `${q.question}:${q.options?.join(',') || ''}`)
    .sort()
    .join('|');
}

/**
 * Load saved answers from sessionStorage for a specific clarification
 */
function loadSavedAnswers(clarification: ClarificationInfo): Record<string, string> {
  if (typeof window === 'undefined') return {};

  try {
    const key = getStorageKey(clarification);
    const saved = sessionStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Only restore answers that match current questions
      const validAnswers: Record<string, string> = {};
      clarification.questions.forEach((q) => {
        if (parsed[q.question]) {
          validAnswers[q.question] = parsed[q.question];
        }
      });
      return validAnswers;
    }
  } catch (e) {
    console.warn('Failed to load saved clarification answers:', e);
  }
  return {};
}

/**
 * Save answers to sessionStorage for a specific clarification
 */
function saveAnswers(clarification: ClarificationInfo, answers: Record<string, string>): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(clarification);
    sessionStorage.setItem(key, JSON.stringify(answers));
  } catch (e) {
    console.warn('Failed to save clarification answers:', e);
  }
}

/**
 * Clear saved answers from sessionStorage for a specific clarification
 */
function clearSavedAnswers(clarification: ClarificationInfo): void {
  if (typeof window === 'undefined') return;

  try {
    const key = getStorageKey(clarification);
    sessionStorage.removeItem(key);
  } catch (e) {
    console.warn('Failed to clear saved clarification answers:', e);
  }
}

interface ClarificationPromptProps {
  clarification: ClarificationInfo;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
  /** If true, show the form in readonly mode with pre-filled answers (greenish style) */
  readonly?: boolean;
  /** Pre-filled answers to display when in readonly mode */
  prefillAnswers?: Record<string, string>;
}

/**
 * ClarificationPrompt Component
 *
 * Displays interactive clarification questions when the AI needs more information.
 * Supports multiple question types including text input and option selection.
 * Includes progress indicator and visual state for multi-turn clarification.
 */
export function ClarificationPrompt({
  clarification,
  onSubmit,
  onCancel,
  isSubmitting = false,
  readonly = false,
  prefillAnswers,
}: ClarificationPromptProps) {
  // Initialize state from prefillAnswers (readonly mode) or sessionStorage (interactive mode)
  // Start empty and let useEffect populate to avoid issues with empty prefillAnswers object
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // If in readonly mode and have prefill answers, use those
    if (readonly && prefillAnswers && Object.keys(prefillAnswers).length > 0) {
      return { ...prefillAnswers };
    }
    // Otherwise try to load from sessionStorage for interactive mode
    return loadSavedAnswers(clarification);
  });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Track the last clarification signature to detect when clarification content changes
  const lastClarificationSignatureRef = useRef<string>(getClarificationSignature(clarification));

  // When clarification prop changes (e.g., after page refresh with session restoration),
  // try to restore saved answers if they exist for this clarification
  useEffect(() => {
    const currentSignature = getClarificationSignature(clarification);

    // Only restore if the clarification content has changed
    // This prevents unnecessary re-renders while allowing restoration after page refresh
    if (currentSignature !== lastClarificationSignatureRef.current) {
      const savedAnswers = loadSavedAnswers(clarification);
      if (Object.keys(savedAnswers).length > 0) {
        setAnswers(savedAnswers);
      }
      lastClarificationSignatureRef.current = currentSignature;
    }
  }, [clarification]);

  // When prefillAnswers changes (in readonly mode after loading from backend),
  // update the answers state to reflect the loaded answers
  // This handles the case where prefillAnswers is initially empty and then gets populated
  useEffect(() => {
    if (readonly && prefillAnswers) {
      const hasAnswers = Object.keys(prefillAnswers).length > 0;
      if (hasAnswers) {
        console.log(
          '[ClarificationPrompt] Populating answers from prefillAnswers:',
          prefillAnswers,
        );
        setAnswers(prefillAnswers);
      } else {
        console.log('[ClarificationPrompt] prefillAnswers is empty, keeping current answers');
      }
    }
  }, [readonly, prefillAnswers]);

  // Save answers to sessionStorage whenever they change
  useEffect(() => {
    // Only save if we have actual answers (not on initial mount with empty state)
    if (Object.keys(answers).length > 0) {
      saveAnswers(clarification, answers);
    }
  }, [answers, clarification]);

  const handleInputChange = (question: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  // Handle Enter key submission for single-line input fields
  // Pressing Enter submits the form when all questions are answered
  // Shift+Enter is ignored to prevent accidental submission
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, question: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Focus moves away, but we don't mark as answered immediately
      // User must press Enter on the last question to submit all
      handleSubmit();
    }
  };

  // Handle individual answer submission for a specific question
  // This marks the answer as confirmed and moves focus to next question
  const handleConfirmAnswer = (question: string) => {
    const answer = answers[question];
    if (!answer || answer.trim().length === 0) {
      return; // Don't confirm empty answers
    }

    // Find the current question index
    const currentIndex = clarification.questions.findIndex((q) => q.question === question);

    // Auto-advance to next question if available
    if (currentIndex < clarification.questions.length - 1) {
      setCurrentQuestionIndex(currentIndex + 1);
    }
  };

  const handleOptionSelect = (question: string, option: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: option,
    }));
    // Auto-advance to next question after selection
    const currentIndex = clarification.questions.findIndex((q) => q.question === question);
    if (currentIndex < clarification.questions.length - 1) {
      setCurrentQuestionIndex(currentIndex + 1);
    }
  };

  const handleSubmit = async () => {
    // Validate that all questions are answered before submitting
    const allQuestionsAnswered = clarification.questions.every(
      (q) => answers[q.question] && answers[q.question].trim().length > 0,
    );

    if (!allQuestionsAnswered) {
      return; // Don't submit if not all questions are answered
    }

    await onSubmit(answers);
    // Clear saved answers from sessionStorage after successful submission
    clearSavedAnswers(clarification);
    // Reset for potential next round
    setAnswers({});
    setCurrentQuestionIndex(0);
  };

  const allQuestionsAnswered = clarification.questions.every(
    (q) => answers[q.question] && answers[q.question].trim().length > 0,
  );

  // Calculate progress
  const answeredCount = clarification.questions.filter(
    (q) => answers[q.question] && answers[q.question].trim().length > 0,
  ).length;
  const progressPercentage = (answeredCount / clarification.questions.length) * 100;

  // Current round indicator
  const currentRound = clarification.currentRound || 1;
  const totalRounds = clarification.totalRounds || 1;
  const isMultiRound = totalRounds > 1;

  return (
    <Card
      className={cn(
        'shadow-sm',
        readonly
          ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
          : 'border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20',
      )}
      data-testid="clarification-prompt"
    >
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
              readonly ? 'bg-green-100 dark:bg-green-900' : 'bg-amber-100 dark:bg-amber-900',
            )}
          >
            {readonly ? (
              <Check
                className={cn(
                  'h-5 w-5',
                  readonly
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              />
            ) : isMultiRound ? (
              <div className="text-amber-600 dark:text-amber-400 font-semibold text-sm">
                {currentRound}/{totalRounds}
              </div>
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle
                className={cn(
                  'text-lg',
                  readonly
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-amber-900 dark:text-amber-100',
                )}
              >
                {readonly
                  ? 'Answered'
                  : isMultiRound
                    ? `Clarification (Round ${currentRound}/${totalRounds})`
                    : 'I need some more information'}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  readonly
                    ? 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                    : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300',
                )}
              >
                <Check className="h-3 w-3 mr-1" />
                {answeredCount}/{clarification.questions.length} answered
              </Badge>
            </div>
            <CardDescription
              className={cn(
                'mt-1',
                readonly
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-amber-700 dark:text-amber-300',
              )}
            >
              {clarification.context_summary}
            </CardDescription>
          </div>
        </div>

        {/* Progress bar */}
        {clarification.questions.length > 1 && (
          <div className="mt-4">
            <Progress
              value={progressPercentage}
              className={cn(
                'h-2',
                readonly
                  ? 'bg-green-200 dark:bg-green-900 [&_[role=progressbar]]:bg-green-500'
                  : 'bg-amber-200 dark:bg-amber-900 [&_[role=progressbar]]:bg-amber-500',
              )}
            />
            <p
              className={cn(
                'text-xs mt-1',
                readonly
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-amber-600 dark:text-amber-400',
              )}
            >
              {answeredCount === clarification.questions.length
                ? 'All questions answered!'
                : `${clarification.questions.length - answeredCount} more question${clarification.questions.length - answeredCount > 1 ? 's' : ''} to go`}
            </p>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {clarification.questions.map((q, idx) => {
          const isAnswered = answers[q.question] && answers[q.question].trim().length > 0;
          const isCurrent = idx === currentQuestionIndex && !isAnswered;

          return (
            <div
              key={idx}
              className={cn(
                'space-y-3 p-3 rounded-lg transition-all',
                readonly && isAnswered && 'bg-green-100/50 dark:bg-green-900/30',
                !readonly && isAnswered && 'bg-amber-100/50 dark:bg-amber-900/30 opacity-70',
                !readonly && isCurrent && 'ring-2 ring-amber-400 dark:ring-amber-600',
                !isAnswered && !isCurrent && !readonly && 'bg-white/50 dark:bg-gray-800/50',
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5',
                    readonly
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : isAnswered
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                  )}
                >
                  {isAnswered || readonly ? '✓' : idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor={`q-${idx}`}
                    className={cn(
                      'font-medium',
                      readonly
                        ? 'text-green-900 dark:text-green-100'
                        : 'text-amber-900 dark:text-amber-100',
                      isAnswered && !readonly && 'line-through text-amber-700 dark:text-amber-400',
                    )}
                  >
                    {q.question}
                  </Label>

                  {q.hint && !isAnswered && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 ml-1 flex items-center gap-1">
                      <HelpCircle className="h-3 w-3" />
                      {q.hint}
                    </p>
                  )}

                  {q.options && q.options.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {q.options.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant={answers[q.question] === option ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => !readonly && handleOptionSelect(q.question, option)}
                          disabled={isSubmitting || readonly}
                          className={cn(
                            'transition-all',
                            readonly
                              ? answers[q.question] === option
                                ? 'bg-green-600 text-white border-green-600'
                                : 'border-green-300 text-green-700 dark:border-green-700 dark:text-green-300'
                              : answers[q.question] === option
                                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                                : 'border-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900',
                            !isAnswered && !isCurrent && !readonly && 'opacity-60',
                          )}
                        >
                          {option}
                          {answers[q.question] === option && !readonly && (
                            <ChevronRight className="ml-1 h-3 w-3" />
                          )}
                          {answers[q.question] === option && readonly && (
                            <Check className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id={`q-${idx}`}
                          type="text"
                          value={answers[q.question] || ''}
                          onChange={(e) =>
                            !readonly && handleInputChange(q.question, e.target.value)
                          }
                          onKeyDown={(e) => !readonly && handleInputKeyDown(e, q.question)}
                          placeholder={readonly ? '' : 'Type your answer here...'}
                          className={cn(
                            'flex-1',
                            readonly
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100'
                              : 'bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 focus-visible:ring-amber-500',
                          )}
                          disabled={isSubmitting || readonly}
                          onFocus={() => !readonly && setCurrentQuestionIndex(idx)}
                          readOnly={readonly}
                        />
                        {!readonly && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleConfirmAnswer(q.question)}
                            disabled={
                              !answers[q.question] ||
                              answers[q.question].trim().length === 0 ||
                              isSubmitting
                            }
                            className="shrink-0 border-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                            title="Confirm answer and move to next question"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {/* Character counter with visual feedback and Enter hint - only show when not readonly */}
                      {!readonly && (
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={cn(
                              answers[q.question]?.trim().length > 0
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {answers[q.question]?.trim().length > 0 ? (
                              <>Answer ready • Press Enter or click ✓ to confirm</>
                            ) : (
                              <>Type your answer above</>
                            )}
                          </span>
                          <span className="text-muted-foreground">
                            {answers[q.question]?.length || 0} chars
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {(isAnswered || readonly) && (
                    <p
                      className={cn(
                        'text-xs italic',
                        readonly
                          ? 'text-green-700 dark:text-green-400'
                          : 'text-amber-700 dark:text-amber-400',
                      )}
                    >
                      Your answer: {answers[q.question]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter
        className={cn(
          'flex flex-col gap-3 pt-4 border-t',
          readonly
            ? 'border-green-200 dark:border-green-800'
            : 'border-amber-200 dark:border-amber-800',
        )}
      >
        <p
          className={cn(
            'text-xs w-full',
            readonly ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400',
          )}
        >
          {clarification.next_steps}
        </p>
        {!readonly && (
          <div className="flex gap-2 w-full">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!allQuestionsAnswered || isSubmitting}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {isMultiRound ? `Submit Answers for Round ${currentRound}` : 'Submit Answers'}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900"
              >
                Skip
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * InlineClarificationQuestions Component
 *
 * A compact version for displaying questions inline in the chat flow.
 */
interface InlineClarificationQuestionsProps {
  clarification: ClarificationInfo;
  onAnswerClick: (question: string, answer: string) => void;
  isSubmitting?: boolean;
}

export function InlineClarificationQuestions({
  clarification,
  onAnswerClick,
  isSubmitting = false,
}: InlineClarificationQuestionsProps) {
  // Round indicator for multi-turn
  const currentRound = clarification.currentRound || 1;
  const totalRounds = clarification.totalRounds || 1;
  const isMultiRound = totalRounds > 1;

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10 p-4">
      {/* Header with round indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-amber-900 dark:text-amber-100 font-medium">
          {clarification.context_summary}
        </p>
        {isMultiRound && (
          <Badge
            variant="outline"
            className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
          >
            Round {currentRound}/{totalRounds}
          </Badge>
        )}
      </div>

      {clarification.questions.map((q, idx) => (
        <div key={idx} className="space-y-2">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">{q.question}</p>

          {q.options && q.options.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {q.options.map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  onClick={() => onAnswerClick(q.question, option)}
                  disabled={isSubmitting}
                  className="h-7 px-3 text-xs border-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900"
                >
                  {option}
                </Button>
              ))}
            </div>
          ) : null}

          {q.hint && (
            <p className="text-xs text-amber-600 dark:text-amber-400 ml-1 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {q.hint}
            </p>
          )}
        </div>
      ))}

      <p className="text-xs text-amber-700 dark:text-amber-400">{clarification.next_steps}</p>
    </div>
  );
}

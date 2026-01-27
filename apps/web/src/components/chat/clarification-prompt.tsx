'use client';

import React, { useState } from 'react';
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
import { AlertCircle, Loader2, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@legal/ui';
import type { ClarificationInfo } from '@/hooks/use-chat';

interface ClarificationPromptProps {
  clarification: ClarificationInfo;
  onSubmit: (answers: Record<string, string>) => Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
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
}: ClarificationPromptProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const handleInputChange = (question: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(answers);
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
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center shrink-0">
            {isMultiRound ? (
              <div className="text-amber-600 dark:text-amber-400 font-semibold text-sm">
                {currentRound}/{totalRounds}
              </div>
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg text-amber-900 dark:text-amber-100">
                {isMultiRound
                  ? `Clarification (Round ${currentRound}/${totalRounds})`
                  : 'I need some more information'}
              </CardTitle>
              <Badge
                variant="outline"
                className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
              >
                <HelpCircle className="h-3 w-3 mr-1" />
                {answeredCount}/{clarification.questions.length} answered
              </Badge>
            </div>
            <CardDescription className="text-amber-700 dark:text-amber-300 mt-1">
              {clarification.context_summary}
            </CardDescription>
          </div>
        </div>

        {/* Progress bar */}
        {clarification.questions.length > 1 && (
          <div className="mt-4">
            <Progress value={progressPercentage} className="h-2 bg-amber-200 dark:bg-amber-900" />
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
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
                isAnswered && 'bg-amber-100/50 dark:bg-amber-900/30 opacity-70',
                isCurrent && 'ring-2 ring-amber-400 dark:ring-amber-600',
                !isAnswered && !isCurrent && 'bg-white/50 dark:bg-gray-800/50',
              )}
            >
              <div className="flex items-start gap-2">
                <div
                  className={cn(
                    'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium shrink-0 mt-0.5',
                    isAnswered
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
                  )}
                >
                  {isAnswered ? '✓' : idx + 1}
                </div>
                <div className="flex-1 space-y-2">
                  <Label
                    htmlFor={`q-${idx}`}
                    className={cn(
                      'text-amber-900 dark:text-amber-100 font-medium',
                      isAnswered && 'line-through text-amber-700 dark:text-amber-400',
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
                          onClick={() => handleOptionSelect(q.question, option)}
                          disabled={isSubmitting}
                          className={cn(
                            'transition-all',
                            answers[q.question] === option
                              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                              : 'border-amber-300 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900',
                            !isAnswered && !isCurrent && 'opacity-60',
                          )}
                        >
                          {option}
                          {answers[q.question] === option && (
                            <ChevronRight className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      id={`q-${idx}`}
                      value={answers[q.question] || ''}
                      onChange={(e) => handleInputChange(q.question, e.target.value)}
                      placeholder="Type your answer here..."
                      className="bg-white dark:bg-gray-800 border-amber-300 dark:border-amber-700 focus-visible:ring-amber-500"
                      disabled={isSubmitting || isAnswered}
                      onFocus={() => setCurrentQuestionIndex(idx)}
                    />
                  )}

                  {isAnswered && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 italic">
                      Your answer: {answers[q.question]}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-4 border-t border-amber-200 dark:border-amber-800">
        <p className="text-xs text-amber-600 dark:text-amber-400 w-full">
          {clarification.next_steps}
        </p>
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

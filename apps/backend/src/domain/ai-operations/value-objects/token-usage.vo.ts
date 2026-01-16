import { ValueObject } from '../../shared/base';

interface TokenUsageProps {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Token Usage Value Object
 * Tracks AI model token consumption
 */
export class TokenUsage extends ValueObject<TokenUsageProps> {
  private constructor(props: TokenUsageProps) {
    super(props);
  }

  get promptTokens(): number {
    return this.props.promptTokens;
  }

  get completionTokens(): number {
    return this.props.completionTokens;
  }

  get totalTokens(): number {
    return this.props.totalTokens;
  }

  static create(promptTokens: number, completionTokens: number): TokenUsage {
    if (promptTokens < 0 || completionTokens < 0) {
      throw new Error('Token counts cannot be negative');
    }

    return new TokenUsage({
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    });
  }

  static zero(): TokenUsage {
    return new TokenUsage({
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    });
  }

  add(other: TokenUsage): TokenUsage {
    return TokenUsage.create(
      this.props.promptTokens + other.promptTokens,
      this.props.completionTokens + other.completionTokens,
    );
  }
}

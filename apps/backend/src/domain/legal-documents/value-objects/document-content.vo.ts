import { ValueObject } from '../../shared/base';

interface DocumentContentProps {
  text: string;
  wordCount: number;
  characterCount: number;
}

/**
 * Document Content Value Object
 * Represents the textual content of a legal document with metadata
 */
export class DocumentContent extends ValueObject<DocumentContentProps> {
  private constructor(props: DocumentContentProps) {
    super(props);
  }

  get text(): string {
    return this.props.text;
  }

  get wordCount(): number {
    return this.props.wordCount;
  }

  get characterCount(): number {
    return this.props.characterCount;
  }

  get isEmpty(): boolean {
    return this.props.text.trim().length === 0;
  }

  static create(text: string): DocumentContent {
    const trimmedText = text || '';
    const wordCount = trimmedText.trim()
      ? trimmedText.trim().split(/\s+/).length
      : 0;
    const characterCount = trimmedText.length;

    return new DocumentContent({
      text: trimmedText,
      wordCount,
      characterCount,
    });
  }

  truncate(maxLength: number): string {
    if (this.props.text.length <= maxLength) {
      return this.props.text;
    }
    return this.props.text.substring(0, maxLength) + '...';
  }
}

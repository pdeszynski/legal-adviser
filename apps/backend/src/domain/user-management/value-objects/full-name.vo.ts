import { ValueObject } from '../../shared/base';

interface FullNameProps {
  firstName: string;
  lastName: string;
}

/**
 * Full Name Value Object
 */
export class FullName extends ValueObject<FullNameProps> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;

  private constructor(props: FullNameProps) {
    super(props);
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get initials(): string {
    return `${this.props.firstName.charAt(0)}${this.props.lastName.charAt(0)}`.toUpperCase();
  }

  static create(firstName: string, lastName: string): FullName {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (
      trimmedFirst.length < FullName.MIN_LENGTH ||
      trimmedLast.length < FullName.MIN_LENGTH
    ) {
      throw new Error('First name and last name are required');
    }

    if (
      trimmedFirst.length > FullName.MAX_LENGTH ||
      trimmedLast.length > FullName.MAX_LENGTH
    ) {
      throw new Error(`Name cannot exceed ${FullName.MAX_LENGTH} characters`);
    }

    return new FullName({
      firstName: trimmedFirst,
      lastName: trimmedLast,
    });
  }
}

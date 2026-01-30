import { Field, ObjectType, ID, InputType, Int } from '@nestjs/graphql';

@ObjectType('UserRole')
export class UserRoleDTO {
  @Field(() => ID)
  id: string;

  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  roleId: string;

  @Field(() => Int)
  priority: number;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  expiresAt: Date | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  // Nested role details
  @Field(() => String)
  roleName: string;

  @Field(() => String)
  roleType: string;

  @Field(() => String, { nullable: true })
  roleDescription: string | null;

  @Field(() => [String])
  rolePermissions: string[];
}

@InputType('AssignRoleInput')
export class AssignRoleInput {
  @Field(() => ID)
  userId: string;

  @Field(() => ID)
  roleId: string;

  @Field(() => Int, { nullable: true, defaultValue: 100 })
  priority?: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;
}

@InputType('UpdateUserRoleInput')
export class UpdateUserRoleInput {
  @Field(() => Int, { nullable: true })
  priority?: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;

  @Field(() => Boolean, { nullable: true })
  isActive?: boolean;
}

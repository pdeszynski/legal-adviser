import { Field, ObjectType, ID, InputType } from '@nestjs/graphql';

// Output Type
@ObjectType('UserRole')
export class UserRoleDTO {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  roleId: string;

  @Field(() => Number)
  priority: number;

  @Field(() => String, { nullable: true })
  notes: string | null;

  @Field(() => Boolean)
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  expiresAt: Date | null;

  @Field(() => String, { nullable: true })
  assignedBy: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => String)
  roleName: string;

  @Field(() => String)
  roleType: string;

  @Field(() => String, { nullable: true })
  roleDescription: string | null;

  @Field(() => [String])
  rolePermissions: string[];
}

// Input Types
@InputType('AssignRoleInput')
export class AssignRoleInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  roleId: string;

  @Field(() => Number, { nullable: true })
  priority?: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;
}

@InputType('UpdateRoleAssignmentInput')
export class UpdateRoleAssignmentInput {
  @Field(() => String)
  id: string;

  @Field(() => Number, { nullable: true })
  priority?: number;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field(() => Date, { nullable: true })
  expiresAt?: Date;
}

@InputType('RemoveRoleFromUserInput')
export class RemoveRoleFromUserInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  roleId: string;
}

@InputType('DeactivateRoleAssignmentInput')
export class DeactivateRoleAssignmentInput {
  @Field(() => String)
  userId: string;

  @Field(() => String)
  roleId: string;
}

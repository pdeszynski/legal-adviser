import { InputType, Field, ID } from '@nestjs/graphql';
import { IsUUID, IsEnum } from 'class-validator';
import { SharePermission } from '../entities/document-share.entity';

/**
 * Input DTO for updating share permission
 */
@InputType()
export class UpdateSharePermissionInput {
  @Field(() => ID, { description: 'ID of the share to update' })
  @IsUUID()
  shareId: string;

  @Field(() => SharePermission, { description: 'New permission level' })
  @IsEnum(SharePermission)
  permission: SharePermission;
}

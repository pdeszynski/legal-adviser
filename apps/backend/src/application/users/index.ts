/**
 * USER MANAGEMENT APPLICATION LAYER
 *
 * This module contains the application use cases for user management.
 * Use cases orchestrate domain operations without containing business logic.
 *
 * Use Cases:
 * - RegisterUserUseCase: Register a new user
 * - GetUserUseCase: Get user by ID
 * - GetUserByEmailUseCase: Get user by email
 * - ListUsersUseCase: List users with filters
 * - ActivateUserUseCase: Activate a pending user
 * - SuspendUserUseCase: Suspend a user account
 * - ChangeUserRoleUseCase: Change user role
 * - UpdateUserProfileUseCase: Update user profile information
 */

export * from './dto';
export * from './use-cases';
export * from './services';

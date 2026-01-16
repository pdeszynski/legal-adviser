/**
 * Base interface for all Use Cases in the Application layer.
 * Use cases represent the business actions that can be performed in the system.
 *
 * Each use case follows the Command/Query separation principle:
 * - Commands: Actions that change state (return void or the affected entity)
 * - Queries: Actions that read state (return data without side effects)
 *
 * @template TRequest - The input DTO for the use case
 * @template TResponse - The output DTO for the use case
 */
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}

/**
 * Base interface for Use Cases that don't require input parameters.
 */
export interface IUseCaseNoInput<TResponse> {
  execute(): Promise<TResponse>;
}

/**
 * Base interface for Use Cases that don't return a value (commands).
 */
export interface IUseCaseNoOutput<TRequest> {
  execute(request: TRequest): Promise<void>;
}

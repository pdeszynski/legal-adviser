/**
 * Event Handler Decorator Metadata
 *
 * This interface defines the metadata structure for event handlers
 * to enable better type safety and documentation.
 */
export interface EventHandlerMetadata {
  /**
   * The event name this handler listens to
   */
  eventName: string;

  /**
   * The module that owns this handler
   */
  module: string;

  /**
   * Description of what this handler does
   */
  description?: string;

  /**
   * Whether this handler is async
   */
  async: boolean;
}

/**
 * Event Listener Options
 *
 * Configuration options for event listeners
 */
export interface EventListenerOptions {
  /**
   * Whether to suppress errors thrown by this listener
   * Default: false
   */
  suppressErrors?: boolean;

  /**
   * Priority of this listener (higher = executed first)
   * Default: 0
   */
  priority?: number;

  /**
   * Whether this listener should be async
   * Default: true
   */
  async?: boolean;
}

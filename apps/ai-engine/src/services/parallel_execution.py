"""Parallel execution utilities for LangGraph workflows.

This module provides utilities for running independent agents in parallel
to reduce overall workflow latency.

LangGraph supports parallel execution through send() method on multiple nodes.
This module provides patterns for common parallel operations.
"""

import asyncio
from collections.abc import Callable, Coroutine
from dataclasses import dataclass
from typing import Any, TypeVar

T = TypeVar("T")
StateT = TypeVar("StateT")


@dataclass
class ParallelResult:
    """Result from a parallel execution."""

    name: str
    success: bool
    data: Any | None = None
    error: str | None = None
    duration_ms: float = 0.0


async def execute_parallel(
    tasks: dict[str, Callable[[], Coroutine[Any, Any, T]]],
) -> dict[str, ParallelResult]:
    """Execute multiple async tasks in parallel and collect results.

    Args:
        tasks: Dictionary mapping task names to async callables

    Returns:
        Dictionary mapping task names to ParallelResult objects

    Example:
        ```python
        results = await execute_parallel({
            "classify": lambda: classifier_agent.run(prompt),
            "extract": lambda: extractor_agent.run(prompt),
        })
        ```
    """
    import time

    async def run_task(name: str, task_func: Callable[[], Coroutine[Any, Any, T]]) -> ParallelResult:
        """Run a single task and return result."""
        start = time.time()
        try:
            data = await task_func()
            duration = (time.time() - start) * 1000
            return ParallelResult(name=name, success=True, data=data, duration_ms=duration)
        except Exception as e:
            duration = (time.time() - start) * 1000
            return ParallelResult(
                name=name,
                success=False,
                error=str(e),
                duration_ms=duration,
            )

    # Run all tasks concurrently
    coroutine_list = [
        run_task(name, func)
        for name, func in tasks.items()
    ]

    results_list = await asyncio.gather(*coroutine_list, return_exceptions=True)

    # Convert list back to dict
    results: dict[str, ParallelResult] = {}
    for result in results_list:
        if isinstance(result, Exception):
            # Unexpected error in task wrapper itself
            results["unknown"] = ParallelResult(
                name="unknown",
                success=False,
                error=str(result),
                duration_ms=0,
            )
        elif isinstance(result, ParallelResult):
            results[result.name] = result

    return results


async def execute_parallel_with_fallback(
    tasks: dict[str, Callable[[], Coroutine[Any, Any, T]]],
    fallback: Callable[[str, Exception], T] | None = None,
) -> dict[str, Any]:
    """Execute tasks in parallel with fallback for failures.

    Args:
        tasks: Dictionary mapping task names to async callables
        fallback: Optional fallback function for failed tasks

    Returns:
        Dictionary mapping task names to results (data or fallback result)
    """
    parallel_results = await execute_parallel(tasks)

    final_results: dict[str, Any] = {}
    for name, result in parallel_results.items():
        if result.success:
            final_results[name] = result.data
        elif fallback:
            # Try to get fallback result
            try:
                # Create a dummy exception for the fallback
                exc = Exception(result.error or "Unknown error")
                final_results[name] = fallback(name, exc)
            except Exception:
                final_results[name] = None
        else:
            final_results[name] = None

    return final_results


def parallel_node_wrapper(
    node_func: Callable[[dict[str, Any]], Coroutine[Any, Any, dict[str, Any]]],
    node_name: str,
) -> Callable[[dict[str, Any]], Coroutine[Any, Any, dict[str, Any]]]:
    """Wrap a node function for parallel execution in LangGraph.

    LangGraph's send() method expects nodes that accept state directly.
    This wrapper ensures proper state handling.

    Args:
        node_func: The node function to wrap
        node_name: Name of the node for logging

    Returns:
        Wrapped function suitable for parallel execution
    """

    async def wrapped(state: dict[str, Any]) -> dict[str, Any]:
        """Execute the node with state handling."""
        import time

        start = time.time()
        metadata = state.get("metadata", {})

        # Add node name to state for tracking
        state["metadata"] = {
            **metadata,
            "current_parallel_node": node_name,
        }

        try:
            result = await node_func(state)
            duration = (time.time() - start) * 1000

            # Track timing
            if "parallel_timings" not in result:
                result["parallel_timings"] = {}
            result["parallel_timings"][node_name] = duration

            return result
        except Exception as e:
            duration = (time.time() - start) * 1000
            return {
                **state,
                "error": str(e),
                "parallel_errors": [*state.get("parallel_errors", []), f"{node_name}: {e}"],
                "parallel_timings": state.get("parallel_timings", {}),
            }

    return wrapped


async def run_parallel_research(
    queries: list[str],
    research_func: Callable[[str], Coroutine[Any, Any, dict[str, Any]]],
    max_concurrency: int = 3,
) -> list[dict[str, Any]]:
    """Run multiple research queries in parallel with concurrency control.

    Args:
        queries: List of query strings to research
        research_func: Async function that takes a query and returns results
        max_concurrency: Maximum number of concurrent requests

    Returns:
        List of research results in the same order as queries
    """
    semaphore = asyncio.Semaphore(max_concurrency)

    async def bounded_research(query: str, index: int) -> tuple[int, dict[str, Any]]:
        """Run research with semaphore control."""
        async with semaphore:
            result = await research_func(query)
            return index, result

    # Avoid mypy error about unused variable
    _ = bounded_research

    tasks = [
        bounded_research(query, i)
        for i, query in enumerate(queries)
    ]

    results = await asyncio.gather(*tasks)

    # Sort by index and extract results
    return [
        result for _, result in sorted(results, key=lambda x: x[0])
    ]



class ParallelAgentRunner:
    """Helper class for running multiple agents in parallel."""

    def __init__(self, max_concurrency: int = 5) -> None:
        """Initialize the parallel runner.

        Args:
            max_concurrency: Maximum number of concurrent agent calls
        """
        self.semaphore = asyncio.Semaphore(max_concurrency)
        self.results: dict[str, Any] = {}

    async def run_agent(
        self,
        name: str,
        agent: Any,  # PydanticAI Agent
        prompt: str,
        deps: Any,  # ModelDeps
    ) -> tuple[str, Any]:
        """Run a single agent with semaphore control.

        Args:
            name: Task name for tracking
            agent: PydanticAI Agent instance
            prompt: Prompt to send to agent
            deps: Dependencies for the agent

        Returns:
            Tuple of (name, agent result)
        """
        async with self.semaphore:
            result = await agent.run(prompt, deps=deps)
            return name, result

    async def run_all(
        self,
        agents: dict[str, tuple[Any, str]],  # name -> (agent, prompt)
        deps: Any,  # ModelDeps
    ) -> dict[str, Any]:
        """Run all agents and return results.

        Args:
            agents: Dict mapping names to (agent, prompt) tuples
            deps: Dependencies for all agents

        Returns:
            Dict mapping names to agent results
        """
        tasks = [
            self.run_agent(name, agent, prompt, deps)
            for name, (agent, prompt) in agents.items()
        ]

        results = await asyncio.gather(*tasks)
        self.results = dict(results)
        return self.results

    def get_total_duration_ms(self) -> float:
        """Get the total duration if timing was tracked."""
        # This would need to be implemented with timing tracking
        return 0.0


# LangGraph-specific parallel patterns


def create_parallel_research_node(
    research_func: Callable[[str], Coroutine[Any, Any, dict[str, Any]]],
    node_name: str = "parallel_research",
) -> Callable[[dict[str, Any]], Coroutine[Any, Any, dict[str, Any]]]:
    """Create a LangGraph node that runs research in parallel.

    This node extracts multiple queries from state and runs them
    concurrently using the provided research function.

    Args:
        research_func: Async function that takes a query string
        node_name: Name for the node

    Returns:
        LangGraph node function
    """

    async def parallel_research_node(state: dict[str, Any]) -> dict[str, Any]:
        """Execute parallel research queries."""
        # Extract queries from state
        queries = state.get("research_queries", [])
        if not queries:
            return {**state, "research_results": []}

        # Run research in parallel
        results = await run_parallel_research(
            queries=queries,
            research_func=research_func,
            max_concurrency=3,
        )

        return {
            **state,
            "research_results": results,
        }

    parallel_research_node.__name__ = node_name
    return parallel_research_node

/**
 * Content hydration and enrichment for API responses
 * Single pattern to parse, filter, and transform raw message content
 */

export type HydratedContent =
  | { type: "text"; content: string }
  | { type: "hidden"; reason: string };

/**
 * Hydrate raw message content from API
 * Detects special formats (JSON widgets, debug data) and enriches them
 */
export function hydrateContent(rawContent: string): HydratedContent {
  const trimmed = rawContent.trim();

  // Not JSON - return as plain text
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return { type: "text", content: rawContent };
  }

  // Try parsing as JSON
  let parsed: any;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    // Invalid JSON - treat as text
    return { type: "text", content: rawContent };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { type: "text", content: rawContent };
  }

  // Check for debug/tool output data (should be hidden from chat)
  const isDebugData =
    parsed.type === "debug" ||
    // Tool output patterns - be specific to avoid hiding legitimate content
    (parsed.flights !== undefined && Array.isArray(parsed.flights)) ||
    (parsed.hotels !== undefined && Array.isArray(parsed.hotels)) ||
    (parsed.attractions !== undefined && Array.isArray(parsed.attractions)) ||
    (parsed.activities !== undefined && Array.isArray(parsed.activities)) ||
    (parsed.forecasts !== undefined && Array.isArray(parsed.forecasts)) ||
    (parsed.day_plans !== undefined && Array.isArray(parsed.day_plans)) ||
    // Specific tool response patterns
    (parsed.passport_country !== undefined &&
      parsed.destination_country !== undefined &&
      parsed.requirements !== undefined) ||
    (parsed.avg_temp_max !== undefined && parsed.month !== undefined) ||
    (parsed.events !== undefined && Array.isArray(parsed.events)) ||
    (parsed.estimated_budget !== undefined && parsed.breakdown !== undefined);

  if (isDebugData) {
    return { type: "hidden", reason: "debug-data" };
  }

  // Unknown JSON structure - show as text (might be legitimate JSON in message)
  return { type: "text", content: rawContent };
}

/**
 * Check if content should be filtered out (not displayed)
 */
export function shouldHideContent(hydrated: HydratedContent): boolean {
  return hydrated.type === "hidden";
}

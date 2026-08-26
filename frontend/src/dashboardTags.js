export function normalizeDashboardTags(tags) {
  if (Array.isArray(tags)) {
    return tags
      .filter((item) => item && typeof item === "object" && typeof item.tag === "string")
      .map((item) => [item.tag, Number(item.count) || 0]);
  }

  if (tags && typeof tags === "object") {
    return Object.entries(tags).map(([tag, count]) => [tag, Number(count) || 0]);
  }

  return [];
}

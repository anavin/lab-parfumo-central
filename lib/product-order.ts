// Shared ORDER BY for product search (autocomplete). Manually-"featured" scents
// win ties and appear first, then everything else alphabetically, then by size.
//
// To change which scent shows first, edit FEATURED below (lower number = higher).
// e.g. Cherry Shade before Cherry Dance when typing "ch".
const FEATURED: Record<string, number> = {
  "Cherry Shade": 0,
  "Cherry Dance": 1,
};

const CASES = Object.entries(FEATURED)
  .map(([scent, rank]) => `when '${scent.replace(/'/g, "''")}' then ${rank}`)
  .join(" ");

// unqualified column names (scent/size) — valid because every search hits one table
export const PRODUCT_SEARCH_ORDER = `
  order by
    case scent ${CASES} else 100 end,
    scent, (substring(size from '[0-9]+'))::int nulls last, size
  limit 25`;

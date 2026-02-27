// Define valid include fields for User model
export const USER_INCLUDABLE_RELATIONS = [
  'address_book',
  'sessions',
  'wallets',
] as const;

export type UserIncludableRelation = (typeof USER_INCLUDABLE_RELATIONS)[number];

export type UserIncludeQuery = {
  include?: string; // Comma-separated list of relations to include
};

// Type for parsed include parameters for User
export type ParsedUserInclude = {
  [key in UserIncludableRelation]?: true;
};

// Helper function to parse and validate include query parameters for User
export function parseUserInclude(
  query: UserIncludeQuery
): Record<string, boolean> | undefined {
  if (!query.include) return undefined;

  const requestedIncludes = query.include.split(',');
  const validatedIncludes: ParsedUserInclude = {};

  // Validate each requested include field
  for (const include of requestedIncludes) {
    const trimmed = include.trim();
    // Check if the requested include is valid
    if (USER_INCLUDABLE_RELATIONS.includes(trimmed as UserIncludableRelation)) {
      validatedIncludes[trimmed as UserIncludableRelation] = true;
    }
  }

  return Object.keys(validatedIncludes).length ? validatedIncludes : undefined;
}

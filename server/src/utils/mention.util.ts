/**
 * Utility functions for parsing and processing user mentions in post content
 */

/**
 * Extracts all @mentions from a text string
 * Matches patterns like @username, @user_name, @user123
 * @param content - The text content to parse
 * @returns Array of unique tag names (without the @ symbol)
 */
export function parseMentions(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return []
  }

  // Regex to match @mentions
  // Matches @ followed by alphanumeric characters, underscores, and hyphens
  // Excludes @ at the end of string or followed by whitespace/punctuation
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const matches = content.match(mentionRegex)

  if (!matches) {
    return []
  }

  // Extract tag names (remove @ symbol) and get unique values
  const tagNames = matches.map((match) => match.substring(1))
  return [...new Set(tagNames)] // Remove duplicates
}

/**
 * Validates if a tag name exists in the database
 * This is a helper function - actual validation should be done in the controller
 * with database access
 * @param tagName - The tag name to validate
 * @returns boolean indicating if the tag name format is valid
 */
export function isValidTagNameFormat(tagName: string): boolean {
  if (!tagName || typeof tagName !== 'string') {
    return false
  }

  // Tag names should be alphanumeric with underscores and hyphens
  // Minimum 1 character, maximum reasonable length (e.g., 30)
  const tagNameRegex = /^[a-zA-Z0-9_-]{1,30}$/
  return tagNameRegex.test(tagName)
}

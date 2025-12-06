/**
 * Utility functions for parsing and processing user mentions in post content
 */

export interface TextSegment {
  type: 'text' | 'mention'
  content: string
  tagName?: string
}

/**
 * Parses text content and extracts mentions (@username)
 * Returns an array of segments that can be used to render text with clickable mentions
 * @param content - The text content to parse
 * @returns Array of text segments with type and content
 */
export function parseTextWithMentions(content: string): TextSegment[] {
  if (!content || typeof content !== 'string') {
    return [{ type: 'text', content: '' }]
  }

  const segments: TextSegment[] = []
  // Regex to match @mentions
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  let lastIndex = 0
  let match

  while ((match = mentionRegex.exec(content)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      })
    }

    // Add the mention
    segments.push({
      type: 'mention',
      content: match[0], // Full match including @
      tagName: match[1], // Tag name without @
    })

    lastIndex = mentionRegex.lastIndex
  }

  // Add remaining text after the last mention
  if (lastIndex < content.length) {
    segments.push({
      type: 'text',
      content: content.substring(lastIndex),
    })
  }

  // If no mentions found, return the whole content as a single text segment
  if (segments.length === 0) {
    segments.push({ type: 'text', content })
  }

  return segments
}

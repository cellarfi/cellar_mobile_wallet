import { SearchUsers } from '@/types/user.interface'
import React, { useRef, useState } from 'react'
import { Text, TextInput, View } from 'react-native'
import MentionSuggestions from '../MentionSuggestions'
import PostComposerToolbar from './PostComposerToolbar'

interface ContentEditorProps {
  value: string
  onChangeText: (text: string) => void
  onSelectionChange: (start: number, end: number) => void
  onGifPress: () => void
  onAttachPress: () => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  error?: string
  mediaCount?: number
  maxAttachments?: number
}

/**
 * Extracts the mention query from text at the current cursor position
 * Returns the query string after @ if cursor is in a mention context
 */
const getMentionQuery = (
  text: string,
  cursorPosition: number
): string | null => {
  // Find the last @ before cursor
  const textBeforeCursor = text.substring(0, cursorPosition)
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')

  if (lastAtIndex === -1) {
    return null
  }

  // Check if there's a space or newline before @ (not a mention)
  if (lastAtIndex > 0) {
    const charBeforeAt = textBeforeCursor[lastAtIndex - 1]
    if (charBeforeAt && charBeforeAt !== ' ' && charBeforeAt !== '\n') {
      return null
    }
  }

  // Extract text after @
  const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)

  // Check if there's a space or newline in the mention (mention is complete)
  if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
    return null
  }

  // Extract the query (text after @ until cursor)
  const query = textAfterAt.trim()

  // Only show suggestions if query is not empty and doesn't contain invalid chars
  if (query.length === 0 || /[^\w_-]/.test(query)) {
    return null
  }

  return query
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChangeText,
  onSelectionChange,
  onGifPress,
  onAttachPress,
  placeholder = "What's on your mind?",
  maxLength = 1000,
  disabled = false,
  error,
  mediaCount = 0,
  maxAttachments = 5,
}) => {
  const textInputRef = useRef<TextInput>(null)
  const [selection, setSelection] = useState({ start: 0, end: 0 })
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSelectionChange = ({
    nativeEvent: { selection: newSelection },
  }: any) => {
    setSelection(newSelection)
    onSelectionChange(newSelection.start, newSelection.end)

    // Check for mention query
    const query = getMentionQuery(value, newSelection.start)
    if (query !== null) {
      setMentionQuery(query)
      setShowSuggestions(true)
    } else {
      setMentionQuery(null)
      setShowSuggestions(false)
    }
  }

  const handleTextChange = (text: string) => {
    onChangeText(text)

    // When text changes, cursor is typically at the end
    // Use the new text length as cursor position, or keep current selection if it's within bounds
    const cursorPos = Math.min(selection.start, text.length)

    // Check for mention query at cursor position
    const query = getMentionQuery(text, cursorPos)
    if (query !== null) {
      setMentionQuery(query)
      setShowSuggestions(true)
    } else {
      setMentionQuery(null)
      setShowSuggestions(false)
    }
  }

  const handleMentionSelect = (user: SearchUsers) => {
    // Find the @ position
    const textBeforeCursor = value.substring(0, selection.start)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex === -1) {
      return
    }

    // Replace the mention query with the selected user's tag_name
    const textBeforeAt = value.substring(0, lastAtIndex + 1)
    const textAfterMention = value.substring(selection.start)
    const newText = `${textBeforeAt}${user.tag_name} ${textAfterMention}`

    onChangeText(newText)
    setMentionQuery(null)
    setShowSuggestions(false)

    // Set cursor position after the inserted mention
    const newCursorPosition = lastAtIndex + 1 + user.tag_name.length + 1
    setTimeout(() => {
      textInputRef.current?.setNativeProps({
        selection: { start: newCursorPosition, end: newCursorPosition },
      })
      setSelection({ start: newCursorPosition, end: newCursorPosition })
    }, 0)
  }

  return (
    <View>
      {/* Text Input Container */}
      <View className='relative'>
        <TextInput
          ref={textInputRef}
          className='bg-secondary-light text-white rounded-t-xl px-4 py-4'
          placeholder={placeholder}
          placeholderTextColor='#888'
          multiline
          value={value}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          style={{
            minHeight: 100,
            maxHeight: 200,
            textAlignVertical: 'top',
            borderWidth: error ? 1 : 0,
            borderColor: error ? '#ef4444' : undefined,
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          editable={!disabled}
          maxLength={maxLength}
        />

        {/* Mention Suggestions */}
        {showSuggestions && mentionQuery !== null && (
          <View className='absolute top-full left-0 right-0 z-50 mt-1'>
            <MentionSuggestions
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => {
                setShowSuggestions(false)
                setMentionQuery(null)
              }}
              visible={showSuggestions}
            />
          </View>
        )}
      </View>

      {/* Toolbar */}
      <PostComposerToolbar
        contentLength={value.length}
        maxLength={maxLength}
        onGifPress={onGifPress}
        onAttachPress={onAttachPress}
        disabled={disabled}
        mediaCount={mediaCount}
        maxAttachments={maxAttachments}
      />

      {/* Error Message */}
      {error && <Text className='text-red-500 mt-2 text-sm'>{error}</Text>}
    </View>
  )
}

export default ContentEditor

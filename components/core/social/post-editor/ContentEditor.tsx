import React, { useRef } from 'react'
import { Text, TextInput } from 'react-native'
import PostComposerToolbar from './PostComposerToolbar'

interface ContentEditorProps {
  value: string
  onChangeText: (text: string) => void
  onSelectionChange: (start: number, end: number) => void
  onEmojiPress: () => void
  onGifPress: () => void
  onAttachPress: () => void
  placeholder?: string
  maxLength?: number
  disabled?: boolean
  error?: string
  mediaCount?: number
  maxAttachments?: number
}

const ContentEditor: React.FC<ContentEditorProps> = ({
  value,
  onChangeText,
  onSelectionChange,
  onEmojiPress,
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

  const handleSelectionChange = ({ nativeEvent: { selection } }: any) => {
    onSelectionChange(selection.start, selection.end)
  }

  return (
    <>
      {/* Text Input */}
      <TextInput
        ref={textInputRef}
        className='bg-secondary-light text-white rounded-t-xl px-4 py-4'
        placeholder={placeholder}
        placeholderTextColor='#888'
        multiline
        value={value}
        onChangeText={onChangeText}
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

      {/* Toolbar */}
      <PostComposerToolbar
        contentLength={value.length}
        maxLength={maxLength}
        onEmojiPress={onEmojiPress}
        onGifPress={onGifPress}
        onAttachPress={onAttachPress}
        disabled={disabled}
        mediaCount={mediaCount}
        maxAttachments={maxAttachments}
      />

      {/* Error Message */}
      {error && <Text className='text-red-500 mt-2 text-sm'>{error}</Text>}
    </>
  )
}

export default ContentEditor

import { parseTextWithMentions } from '@/utils/mention.util'
import { router } from 'expo-router'
import React from 'react'
import { Text } from 'react-native'

interface TextWithMentionsProps {
  content: string
  textClassName?: string
  mentionClassName?: string
}

/**
 * Component that renders text with clickable @mentions
 * Mentions are rendered as clickable links that navigate to user profiles
 */
const TextWithMentions: React.FC<TextWithMentionsProps> = ({
  content,
  textClassName = 'text-gray-100 text-base',
  mentionClassName = 'text-primary-400 font-medium',
}) => {
  const segments = parseTextWithMentions(content)

  const handleMentionPress = (tagName: string) => {
    router.push(`/profile/${tagName}` as any)
  }

  return (
    <Text className={textClassName}>
      {segments.map((segment, index) => {
        if (segment.type === 'mention' && segment.tagName) {
          return (
            <Text
              key={index}
              className={mentionClassName}
              onPress={() => handleMentionPress(segment.tagName!)}
            >
              {segment.content}
            </Text>
          )
        }
        return <Text key={index}>{segment.content}</Text>
      })}
    </Text>
  )
}

export default TextWithMentions

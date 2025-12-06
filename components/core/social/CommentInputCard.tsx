import { Colors } from '@/constants/Colors';
import { SearchUsers } from '@/types/user.interface';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MentionSuggestions from './MentionSuggestions';

const MAX_LENGTH = 280;

export default function CommentInputCard({
  onPost,
  onCancel,
  loading = false,
  expanded: expandedProp = false,
  onExpand,
  quotedComment,
  postLabel = 'Post',
}: {
  onPost: (text: string) => void;
  onCancel?: () => void;
  loading?: boolean;
  expanded?: boolean;
  onExpand?: (expanded: boolean) => void;
  quotedComment?: {
    user: { display_name: string; tag_name: string };
    text: string;
  };
  postLabel?: string;
}) {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(expandedProp);
  const [showModal, setShowModal] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const [anim] = useState(new Animated.Value(0));

  // Mention state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Detect @mention while typing
  const handleTextChange = useCallback((newText: string) => {
    setText(newText);

    // Find if we're typing a mention
    const beforeCursor = newText.substring(0, cursorPosition + (newText.length - text.length));
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setShowMentions(true);
    } else {
      setShowMentions(false);
      setMentionQuery('');
    }
  }, [cursorPosition, text.length]);

  // Handle user selection from mention suggestions
  const handleMentionSelect = useCallback((user: SearchUsers) => {
    // Find the @ position and replace with full mention
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    const mentionMatch = beforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const beforeMention = beforeCursor.substring(0, mentionMatch.index);
      const newText = `${beforeMention}@${user.tag_name} ${afterCursor}`;
      setText(newText);
      setCursorPosition(beforeMention.length + user.tag_name.length + 2); // +2 for @ and space
    }

    setShowMentions(false);
    setMentionQuery('');
  }, [text, cursorPosition]);

  const handleSelectionChange = useCallback((event: any) => {
    setCursorPosition(event.nativeEvent.selection.end);
  }, []);

  // Animate in on mount
  React.useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  // Focus input when modal opens
  React.useEffect(() => {
    if (showModal && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [showModal]);

  const handleExpand = () => {
    setShowModal(true);
    setExpanded(true);
    onExpand?.(true);
  };

  const handleCollapse = () => {
    setShowModal(false);
    setExpanded(false);
    onExpand?.(false);
  };

  const handlePost = () => {
    if (text.trim().length > 0 && !loading) {
      onPost(text.trim());
      setText('');
      setShowModal(false);
      setExpanded(false);
    }
  };

  // Quoted comment block
  const quotedBlock = quotedComment ? (
    <View className="bg-dark-300 rounded-xl px-4 py-3 mb-2 border border-dark-400">
      <Text className="text-gray-400 text-xs mb-1">
        Replying to @{quotedComment.user.tag_name}
      </Text>
      <Text className="text-gray-200 text-sm">{quotedComment.text}</Text>
    </View>
  ) : null;

  // Inline card (default)
  const inputCard = (
    <Animated.View
      style={{
        opacity: anim,
        transform: [
          {
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [30, 0],
            }),
          },
        ],
        backgroundColor: '#23272f',
        borderRadius: 16,
        padding: 16,
        marginTop: 10,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {quotedBlock}
      {/* Mention Suggestions */}
      {showMentions && (
        <View style={{ marginBottom: 8 }}>
          <MentionSuggestions
            query={mentionQuery}
            onSelect={handleMentionSelect}
            onClose={() => setShowMentions(false)}
            visible={showMentions}
          />
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput
          ref={inputRef}
          style={{
            flex: 1,
            color: '#fff',
            fontSize: 16,
            minHeight: expanded ? 80 : 40,
            maxHeight: 120,
            paddingVertical: 8,
          }}
          placeholder="Post your reply"
          placeholderTextColor="#888"
          value={text}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          multiline={expanded}
          maxLength={MAX_LENGTH}
          editable={!loading}
        />
        <TouchableOpacity onPress={handleExpand} style={{ marginLeft: 8 }}>
          <Ionicons
            name={expanded ? 'chevron-down' : 'expand-outline'}
            size={20}
            color="#6366f1"
          />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 8,
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            color: text.length > MAX_LENGTH - 20 ? '#fbbf24' : '#94a3b8',
            fontSize: 13,
          }}
        >
          {text.length}/{MAX_LENGTH}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              style={{
                marginRight: 10,
                paddingVertical: 6,
                paddingHorizontal: 12,
              }}
              disabled={loading}
            >
              <Text style={{ color: '#94a3b8', fontWeight: 'bold' }}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handlePost}
            disabled={text.trim().length === 0 || loading}
            style={{
              backgroundColor:
                text.trim().length === 0 || loading ? '#334155' : '#6366f1',
              borderRadius: 8,
              paddingVertical: 8,
              paddingHorizontal: 20,
              opacity: text.trim().length === 0 || loading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {loading ? postLabel + '...' : postLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  // Full-screen modal card
  const modalCard = (
    <Modal
      visible={showModal}
      animationType="slide"
      transparent={false}
      onRequestClose={handleCollapse}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: Colors.dark.secondaryLight,
          paddingTop: Platform.OS === 'android' ? 32 : 60,
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleCollapse}
            style={{ marginRight: 12 }}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
            Post your reply
          </Text>
        </View>
        {quotedBlock}
        {/* Mention Suggestions in Modal */}
        {showMentions && (
          <View style={{ marginBottom: 8 }}>
            <MentionSuggestions
              query={mentionQuery}
              onSelect={handleMentionSelect}
              onClose={() => setShowMentions(false)}
              visible={showMentions}
            />
          </View>
        )}
        <TextInput
          ref={inputRef}
          style={{
            color: '#fff',
            fontSize: 18,
            minHeight: 120,
            maxHeight: 300,
            backgroundColor: '#23272f',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            textAlignVertical: 'top',
          }}
          placeholder="What's happening?"
          placeholderTextColor="#888"
          value={text}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          multiline
          maxLength={MAX_LENGTH}
          editable={!loading}
        />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text
            style={{
              color: text.length > MAX_LENGTH - 20 ? '#fbbf24' : '#94a3b8',
              fontSize: 15,
            }}
          >
            {text.length}/{MAX_LENGTH}
          </Text>
          <TouchableOpacity
            onPress={handlePost}
            disabled={text.trim().length === 0 || loading}
            style={{
              backgroundColor:
                text.trim().length === 0 || loading ? '#334155' : '#6366f1',
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 32,
              opacity: text.trim().length === 0 || loading ? 0.7 : 1,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? postLabel + '...' : postLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      {inputCard}
      {modalCard}
    </>
  );
}

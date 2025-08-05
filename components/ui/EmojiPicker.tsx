import { Colors } from '@/constants/Colors';
import { emojiByCategory, emojiCategories } from '@/constants/Emojis';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface EmojiPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  const [activeCategory, setActiveCategory] = useState(emojiCategories[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmojis = emojiByCategory[
    activeCategory as keyof typeof emojiByCategory
  ].filter((emoji) =>
    emoji.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderEmoji = useCallback(
    ({ item }: { item: { emoji: string; name: string } }) => (
      <TouchableOpacity
        style={styles.emojiItem}
        onPress={() => onSelect(item.emoji)}
        activeOpacity={0.7}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
      </TouchableOpacity>
    ),
    []
  );

  const renderCategoryTab = (category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryTab,
        activeCategory === category && styles.activeCategoryTab,
      ]}
      onPress={() => setActiveCategory(category)}
    >
      <Text style={styles.categoryText}>
        {category === 'smileys'
          ? '😊'
          : category === 'animals'
            ? '🐾'
            : category === 'food'
              ? '🍕'
              : category === 'travel'
                ? '✈️'
                : category === 'activities'
                  ? '⚽'
                  : category === 'objects'
                    ? '💡'
                    : '😊'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose an Emoji</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons
              name="search"
              size={18}
              color={Colors.dark.text}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search emojis..."
              placeholderTextColor={Colors.dark.text}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.categories}>
            {emojiCategories.map(renderCategoryTab)}
          </View>

          <FlatList
            data={filteredEmojis}
            renderItem={renderEmoji}
            keyExtractor={(item) => item.emoji}
            numColumns={8}
            contentContainerStyle={styles.emojiGrid}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    height: 40,
    fontSize: 16,
  },
  categories: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.background,
    paddingBottom: 8,
  },
  categoryTab: {
    padding: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  activeCategoryTab: {
    backgroundColor: Colors.dark.primary,
  },
  categoryText: {
    fontSize: 20,
  },
  emojiGrid: {
    paddingBottom: 20,
  },
  emojiItem: {
    width: '12.5%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
});

export default EmojiPicker;

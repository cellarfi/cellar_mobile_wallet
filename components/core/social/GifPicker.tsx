import { Colors } from '@/constants/Colors';
import type { GifObject } from '@/services/giphy';
import {
  getGifCategories,
  getTrendingGifs,
  searchGifs,
} from '@/services/giphy';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width } = Dimensions.get('window');
const GIPHY_LOGO =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/GIPHY_Logo_2014.svg/640px-GIPHY_Logo_2014.svg.png';

type GifCategory = {
  name: string;
  gif: GifObject;
};

interface GifPickerProps {
  visible: boolean;
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

const GifPicker: React.FC<GifPickerProps> = ({
  visible,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GifObject[]>([]);
  const [categories, setCategories] = useState<GifCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'trending' | 'categories'>(
    'trending'
  );
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const loadGifs = useCallback(
    async (query: string = '') => {
      const searchTerm = query || searchQuery || '';
      try {
        setIsLoading(true);
        const data = searchTerm.trim()
          ? await searchGifs(searchTerm)
          : await getTrendingGifs();
        setGifs(data);
      } catch (error) {
        console.error('Error loading GIFs:', error);
        setGifs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery]
  );

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getGifCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle search with debounce
  useEffect(() => {
    if (!visible) return;

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      loadGifs(searchQuery);
    }, 500);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, loadGifs, visible]);

  // Load data when component becomes visible
  useEffect(() => {
    if (visible) {
      loadGifs('');
      loadCategories();
    } else {
      // Reset state when closing
      setSearchQuery('');
      setGifs([]);
      setActiveTab('trending');
    }
  }, [visible, loadGifs, loadCategories]);

  const renderGifItem = ({ item }: { item: GifObject }) => (
    <TouchableOpacity
      style={styles.gifItem}
      onPress={() => onSelect(item.images.original.url)}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri: item.images.fixed_width?.url || item.images.original?.url,
        }}
        style={styles.gifImage}
        resizeMode="cover"
        onError={(e) => console.log('Error loading GIF:', e.nativeEvent.error)}
      />
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: GifCategory }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        setSearchQuery(item.name);
        loadGifs(item.name);
      }}
      activeOpacity={0.8}
    >
      <Image
        source={{
          uri:
            item.gif.images.fixed_width?.url || item.gif.images.original?.url,
        }}
        style={styles.categoryImage}
        resizeMode="cover"
      />
      <View style={styles.categoryOverlay} />
      <Text style={styles.categoryTitle}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.secondary} />
        </View>
      );
    }

    if (activeTab === 'categories') {
      return (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.name}
          numColumns={2}
          contentContainerStyle={styles.categoriesList}
          showsVerticalScrollIndicator={false}
        />
      );
    }

    if (gifs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="sad-outline"
            size={48}
            color={Colors.dark.text + '80'}
          />
          <Text style={styles.emptyText}>
            {searchQuery.trim()
              ? 'No GIFs found. Try a different search term.'
              : 'Unable to load GIFs. Please try again.'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={gifs}
        renderItem={renderGifItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gifList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

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
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={Colors.dark.text + '80'}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search GIFs..."
                placeholderTextColor={Colors.dark.text + '80'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => loadGifs(searchQuery)}
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.dark.text} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
              onPress={() => {
                setSearchQuery('');
                loadGifs('');
              }}
            >
              <Ionicons
                name="flame"
                size={20}
                color={
                  activeTab === 'trending'
                    ? Colors.dark.secondary
                    : Colors.dark.text + '80'
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'trending' && styles.activeTabText,
                ]}
              >
                Trending
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'categories' && styles.activeTab,
              ]}
              onPress={() => {
                setSearchQuery('');
                setActiveTab('categories');
              }}
            >
              <Ionicons
                name="grid"
                size={20}
                color={
                  activeTab === 'categories'
                    ? Colors.dark.secondary
                    : Colors.dark.text + '80'
                }
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'categories' && styles.activeTabText,
                ]}
              >
                Categories
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>{renderContent()}</View>

          <View style={styles.footer}>
            <Image
              source={{ uri: GIPHY_LOGO }}
              style={styles.giphyLogo}
              resizeMode="contain"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  container: {
    height: '80%',
    width: '100%',
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.dark.secondaryLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 48,
    marginRight: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.secondaryLight,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.dark.secondary,
  },
  tabText: {
    color: Colors.dark.text + '80',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: Colors.dark.secondary,
  },
  searchInput: {
    flex: 1,
    color: Colors.dark.text,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
    backgroundColor: Colors.dark.secondaryLight,
    borderRadius: 20,
  },
  gifList: {
    paddingBottom: 20,
  },
  gifItem: {
    width: (width - 48) / 2,
    height: (width - 48) / 2,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.dark.secondaryLight,
  },
  gifImage: {
    width: '100%',
    height: '100%',
  },
  categoryItem: {
    width: (width - 48) / 2,
    height: (width - 48) / 3,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.dark.secondaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  categoryTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: 8,
  },
  categoriesList: {
    paddingBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 80,
    height: 20,
    marginBottom: 4,
  },
  logoText: {
    color: Colors.dark.text + '80',
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    color: Colors.dark.text + '80',
    fontSize: 14,
    marginTop: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  giphyLogo: {
    width: 80,
    height: 20,
    opacity: 0.7,
  },
});

export default GifPicker;

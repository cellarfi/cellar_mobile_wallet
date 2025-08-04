import { Colors } from '@/constants/Colors';
import { getTrendingGifs, searchGifs } from '@/services/giphy';
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

type GifObject = {
  id: string;
  images: {
    fixed_width: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
      width: string;
      height: string;
    };
  };
  title: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(null);

  const loadGifs = useCallback(async (query: string = '') => {
    try {
      setIsLoading(true);
      const data = query.trim()
        ? await searchGifs(query)
        : await getTrendingGifs();
      setGifs(data);
    } catch (error) {
      console.error('Error loading GIFs:', error);
      setGifs([]);
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

  // Load trending GIFs when component becomes visible
  useEffect(() => {
    if (visible) {
      loadGifs(''); // Pass empty string to load trending GIFs
    } else {
      // Reset state when closing
      setSearchQuery('');
      setGifs([]);
    }
  }, [visible, loadGifs]);

  const renderGifItem = ({ item }: { item: GifObject }) => (
    <TouchableOpacity
      style={styles.gifItem}
      onPress={() => onSelect(item.images.original.url)}
    >
      <Image
        source={{ uri: item.images.fixed_width.url }}
        style={styles.gifImage}
        resizeMode="cover"
      />
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

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.dark.secondary} />
            </View>
          ) : gifs.length > 0 ? (
            <FlatList
              data={gifs}
              renderItem={renderGifItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gifList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="sad-outline"
                size={48}
                color={Colors.dark.text + '80'}
              />
              <Text style={styles.emptyText}>No GIFs found</Text>
              <Text style={styles.emptySubtext}>
                Try a different search term
              </Text>
            </View>
          )}

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
    height: '70%',
    width: '100%',
    backgroundColor: Colors.dark.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
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

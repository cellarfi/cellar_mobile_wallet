import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 4;
const MAX_IMAGES = 4;
const MAX_VIDEOS = 1; // For now, we'll only show one video at a time

interface MediaGalleryProps {
  media: string[];
  maxItems?: number;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media = [],
  maxItems = MAX_IMAGES,
}) => {
  const videoUris = media.filter(
    (uri) => uri.endsWith('.mp4') || uri.endsWith('.mov')
  );
  const imageUris = media.filter((uri) => !videoUris.includes(uri));

  // Show videos first, then images
  const displayMedia = [...videoUris.slice(0, MAX_VIDEOS), ...imageUris].slice(
    0,
    maxItems
  );
  const remainingCount = media.length - displayMedia.length;

  const getGridStyle = (index: number, total: number) => {
    if (total === 1) return styles.singleItem;
    if (total === 2) return styles.twoItems;
    if (total === 3)
      return index === 0 ? styles.threeItemsFirst : styles.threeItemsRest;
    if (total >= 4) {
      if (index === 0) return styles.fourItemsFirst;
      if (index === 1) return styles.fourItemsSecond;
      if (index === 2) return styles.fourItemsThird;
      return styles.fourItemsFourth;
    }
    return styles.singleItem;
  };

  const handleMediaPress = (uri: string) => {
    // TODO: Implement media viewer navigation
    console.log('Media pressed:', uri);
  };

  if (!media.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {displayMedia.map((uri, index) => {
          const isVideo = uri.endsWith('.mp4') || uri.endsWith('.mov');
          const gridStyle = getGridStyle(
            index,
            Math.min(displayMedia.length, 4)
          );

          return (
            <TouchableOpacity
              key={uri}
              style={[styles.mediaContainer, gridStyle]}
              onPress={() => handleMediaPress(uri)}
              activeOpacity={0.8}
            >
              {isVideo ? (
                <>
                  <Video
                    source={{ uri }}
                    style={styles.media}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls={false}
                    isLooping
                    shouldPlay={false}
                  />
                  <View style={styles.videoOverlay}>
                    <Ionicons
                      name="play-circle"
                      size={40}
                      color="rgba(255,255,255,0.9)"
                    />
                  </View>
                </>
              ) : (
                <Image
                  source={{ uri }}
                  style={styles.media}
                  contentFit="cover"
                  transition={300}
                />
              )}

              {index === displayMedia.length - 1 && remainingCount > 0 && (
                <View style={styles.remainingOverlay}>
                  <Text style={styles.remainingText}>+{remainingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -GAP / 2,
  },
  mediaContainer: {
    backgroundColor: Colors.dark.background,
    position: 'relative',
    overflow: 'hidden',
    margin: GAP / 2,
  },
  media: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 24,
  },
  // Grid layout styles
  singleItem: {
    width: '100%',
    aspectRatio: 1,
  },
  twoItems: {
    width: '49.5%',
    aspectRatio: 1,
  },
  threeItemsFirst: {
    width: '100%',
    height: 200,
  },
  threeItemsRest: {
    width: '49.5%',
    height: 100,
  },
  fourItemsFirst: {
    width: '100%',
    height: 200,
  },
  fourItemsSecond: {
    width: '66%',
    height: 100,
  },
  fourItemsThird: {
    width: '32%',
    height: 100,
  },
  fourItemsFourth: {
    width: '32%',
    height: 100,
  },
});

export default MediaGallery;

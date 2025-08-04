import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    switch (total) {
      case 1:
        return styles.singleItem;

      case 2:
        return styles.twoItems;

      case 3:
        if (index === 0) return styles.threeItemsFirst;
        return styles.threeItemsRest;

      case 4:
        return styles.fourItems;

      case 5:
        if (index === 0) return styles.fiveItemsFirst;
        if (index === 1 || index === 2) return styles.fiveItemsSecond;
        return styles.fiveItemsThird;

      default:
        return styles.singleItem;
    }
  };

  const renderMediaGrid = () => {
    const totalItems = Math.min(displayMedia.length, maxItems);

    if (totalItems === 3) {
      return (
        <>
          {/* First item - full width */}
          {renderMediaItem(0, styles.threeItemsFirst)}
          {/* Bottom row - two items side by side */}
          <View style={styles.bottomRow}>
            {renderMediaItem(1, styles.threeItemsRest)}
            {renderMediaItem(2, styles.threeItemsRest)}
          </View>
        </>
      );
    }

    if (totalItems === 5) {
      return (
        <>
          {/* First item - full width */}
          {renderMediaItem(0, styles.fiveItemsFirst)}
          {/* Second row - two items side by side */}
          <View style={styles.bottomRow}>
            {renderMediaItem(1, styles.fiveItemsSecond)}
            {renderMediaItem(2, styles.fiveItemsSecond)}
          </View>
          {/* Third row - two items side by side */}
          <View style={styles.bottomRow}>
            {renderMediaItem(3, styles.fiveItemsThird)}
            {renderMediaItem(4, styles.fiveItemsThird)}
          </View>
        </>
      );
    }

    // Default grid layout for 1, 2, 4 items
    return displayMedia.map((uri, index) =>
      renderMediaItem(index, getGridStyle(index, totalItems))
    );
  };

  const renderMediaItem = (index: number, style: any) => {
    if (index >= displayMedia.length) return null;

    const uri = displayMedia[index];
    const isVideo = uri.endsWith('.mp4') || uri.endsWith('.mov');

    return (
      <TouchableOpacity
        key={uri}
        style={[styles.mediaContainer, style]}
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
  };

  const handleMediaPress = (uri: string) => {
    // TODO: Implement media viewer navigation
    console.log('Media pressed:', uri);
  };

  if (!media.length) return null;

  const totalItems = Math.min(displayMedia.length, maxItems);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.grid,
          totalItems === 3 || totalItems === 5
            ? styles.columnContainer
            : styles.rowContainer,
        ]}
      >
        {renderMediaGrid()}
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
    margin: -GAP / 2,
  },
  rowContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  columnContainer: {
    flexDirection: 'column',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: GAP,
    marginTop: GAP / 2,
  },
  mediaContainer: {
    backgroundColor: Colors.dark.background,
    position: 'relative',
    overflow: 'hidden',
    margin: GAP / 2,
    borderRadius: 8,
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

  // Single item - full width
  singleItem: {
    width: `${100 - GAP}%`,
    aspectRatio: 4 / 3,
  },

  // Two items - side by side
  twoItems: {
    width: `${50 - GAP}%`,
    aspectRatio: 1,
  },

  // Three items layout
  threeItemsFirst: {
    width: `${100 - GAP}%`,
    height: 200,
    marginBottom: GAP / 2,
  },
  threeItemsRest: {
    width: `${50 - GAP * 0.75}%`,
    height: 120,
  },

  // Four items - 2x2 grid
  fourItems: {
    width: `${50 - GAP}%`,
    aspectRatio: 1,
  },

  // Five items layout
  fiveItemsFirst: {
    width: `${100 - GAP}%`,
    height: 180,
    marginBottom: GAP,
  },
  fiveItemsSecond: {
    width: `${50 - GAP * 0.75}%`,
    height: 100,
  },
  fiveItemsThird: {
    width: `${50 - GAP * 0.75}%`,
    height: 100,
  },
});

export default MediaGallery;

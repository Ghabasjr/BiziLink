import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/app-button';
import { Colors, Fonts } from '@/constants/theme';

const collageImages = {
  cap: '/images/cap.png',
  sneakers:
    '/images/sneakers.png',
  watch:
    '/images/watch.png',
  fashion:
    '/images/fashion.png',
  bag: '/images/bag.png',
  shirt:
    '/images/shirt.png',
};

export default function HomeScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.collage} aria-hidden>
        <ProductTile image={collageImages.cap} style={styles.capTile} />
        <ProductTile image={collageImages.sneakers} style={styles.sneakerTile} />
        <ProductTile image={collageImages.watch} style={styles.watchTile} />
        <ProductTile image={collageImages.fashion} style={styles.fashionTile} />
        <ProductTile image={collageImages.bag} style={styles.bagTile} />
        <ProductTile image={collageImages.shirt} style={styles.shirtTile} />
        <View style={styles.fade} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/BizlinkLogo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={styles.logoText}>BiziLink</Text>
          </View>

          <Text style={styles.heading}>Your Business. Your Catalog. More Customers</Text>
          <Text style={styles.subheading}>
            Create your online catalog, share link, and grow your business
          </Text>
        </View>

        <AppButton
          title="Continue"
          style={styles.continueButton}
          onPress={() => router.push('/signup')}
        />
      </SafeAreaView>
    </View>
  );
}

function ProductTile({ image, style }: { image: string; style: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.tile, style]}>
      <Image source={{ uri: image }} style={styles.tileImage} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 17,
    paddingBottom: 40,
  },
  collage: {
    position: 'absolute',
    top: -26,
    left: -16,
    right: -16,
    height: '68%',
    overflow: 'hidden',
  },
  tile: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 7,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#EFEAF5',
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },
  capTile: {
    top: -12,
    left: -18,
    width: 225,
    height: 118,
    transform: [{ rotate: '-13deg' }],
  },
  sneakerTile: {
    top: -6,
    right: -7,
    width: 205,
    height: 208,
    transform: [{ rotate: '-13deg' }],
  },
  watchTile: {
    top: 92,
    left: 22,
    width: 244,
    height: 319,
    transform: [{ rotate: '-13deg' }],
  },
  fashionTile: {
    top: 184,
    right: -26,
    width: 153,
    height: 235,
    transform: [{ rotate: '-13deg' }],
  },
  bagTile: {
    top: 398,
    left: 82,
    width: 228,
    height: 250,
    transform: [{ rotate: '-13deg' }],
  },
  shirtTile: {
    top: 374,
    right: -84,
    width: 144,
    height: 210,
    transform: [{ rotate: '-13deg' }],
  },
  fade: {
    ...StyleSheet.absoluteFill,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(255,255,255,0), #FFFFFF 82%)',
  },
  content: {
    alignItems: 'center',
    gap: 22,
    marginBottom: 56,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  logoText: {
    color: Colors.brand.primary,
    fontFamily: Fonts.sans,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '900',
  },
  heading: {
    maxWidth: 330,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 25,
    lineHeight: 33,
    fontWeight: '900',
    textAlign: 'center',
  },
  subheading: {
    maxWidth: 310,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  continueButton: {
    alignSelf: 'stretch',
    paddingBottom: 20,
  },
});

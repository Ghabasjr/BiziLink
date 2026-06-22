import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

export function GoogleMark() {
  return (
    <View style={styles.mark} aria-hidden>
      <Image
        source={{ uri: 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg' }}
        style={styles.image}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 41,
    height: 41,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 39,
    height: 39,
  },
});

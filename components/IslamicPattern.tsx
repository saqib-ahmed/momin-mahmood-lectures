import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { COLORS } from '../constants';

// Golden Mandala - decorative element using provided image
export function GoldenMandala({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/golden-mandala-400x400.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
    />
  );
}

// Geometric border pattern using View-based decorations
export function GeometricBorder({ width, height = 2 }: { width?: number; height?: number }) {
  return (
    <View style={[styles.borderContainer, width ? { width, height: height + 8 } : { height: height + 8 }]}>
      <View style={[styles.borderLine, { backgroundColor: COLORS.border }]} />
      <View style={styles.borderDiamond}>
        <View style={[styles.diamond, { borderColor: COLORS.gold }]} />
      </View>
      <View style={[styles.borderLine, { backgroundColor: COLORS.border }]} />
    </View>
  );
}

// Header decoration with golden mandala
export function HeaderDecoration() {
  return (
    <View style={styles.headerDecoration}>
      <View style={styles.headerLineLeft} />
      <GoldenMandala size={24} />
      <View style={styles.headerLineRight} />
    </View>
  );
}

// Decorative card with corner accents
export function DecorativeCard({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <View style={[styles.decorativeCard, style]}>
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  borderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  borderLine: {
    flex: 1,
    height: 1,
  },
  borderDiamond: {
    marginHorizontal: 8,
  },
  diamond: {
    width: 6,
    height: 6,
    borderWidth: 1,
    transform: [{ rotate: '45deg' }],
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  headerLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    marginRight: 12,
  },
  headerLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 12,
  },
  decorativeCard: {
    position: 'relative',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderColor: COLORS.gold,
    opacity: 0.4,
    borderBottomRightRadius: 8,
  },
});

export default {
  GoldenMandala,
  GeometricBorder,
  HeaderDecoration,
  DecorativeCard,
};

import { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type TextStyle,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type AppButtonProps = PressableProps & {
  title: string;
  icon?: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

export function AppButton({
  title,
  icon,
  loading = false,
  variant = 'primary',
  disabled,
  style,
  labelStyle,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'outline' && styles.outlineButton,
        pressed && !isDisabled && styles.pressed,
        pressed && !isDisabled && variant === 'outline' && styles.outlinePressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...pressableProps}>
      {loading ? <ActivityIndicator color={variant === 'outline' ? Colors.brand.primary : '#FFFFFF'} /> : icon}
      <Text style={[styles.label, variant === 'outline' && styles.outlineLabel, labelStyle]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 64,
    borderRadius: 32,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 24,
  },
  pressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: Colors.brand.primaryDark,
  },
  outlineButton: {
    minHeight: 66,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
    backgroundColor: '#FFFFFF',
  },
  outlinePressed: {
    backgroundColor: '#F7F1FF',
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: '#FFFFFF',
    fontFamily: Fonts.sans,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
  },
  outlineLabel: {
    color: Colors.brand.ink,
  },
});

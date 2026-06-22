import { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colors, Fonts } from '@/constants/theme';

type AppTextInputProps = TextInputProps & {
  label?: string;
  error?: string;
  showEyeIcon?: boolean;
  showSecureToggle?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export const AppTextInput = forwardRef<TextInput, AppTextInputProps>(function AppTextInput(
  {
    label,
    error,
    showEyeIcon,
    showSecureToggle,
    secureTextEntry,
    containerStyle,
    style,
    onBlur,
    onFocus,
    ...textInputProps
  },
  ref
) {
  const [focused, setFocused] = useState(false);
  const [secureEntry, setSecureEntry] = useState(secureTextEntry);
  const hasEyeIcon = showEyeIcon || showSecureToggle;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputShell, focused && styles.focused, error && styles.errorInput]}>
        <TextInput
          ref={ref}
          placeholderTextColor={Colors.brand.ink}
          secureTextEntry={secureEntry}
          style={[styles.input, hasEyeIcon && styles.inputWithIcon, style]}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          {...textInputProps}
        />
        {hasEyeIcon ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={secureEntry ? 'Show password' : 'Hide password'}
            hitSlop={12}
            disabled={!showSecureToggle}
            onPress={() => setSecureEntry((value) => !value)}
            style={styles.eyeButton}>
            <View style={styles.eyeOutline}>
              <View style={styles.eyeDot} />
            </View>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  inputShell: {
    minHeight: 56,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: 9,
    backgroundColor: '#F7F7F8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 56,
    color: Colors.brand.ink,
    fontFamily: Fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  inputWithIcon: {
    paddingRight: 4,
  },
  focused: {
    borderColor: Colors.brand.primary,
  },
  errorInput: {
    borderColor: '#D92D20',
  },
  errorText: {
    color: '#D92D20',
    fontFamily: Fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  eyeButton: {
    width: 48,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeOutline: {
    width: 20,
    height: 13,
    borderWidth: 2,
    borderColor: '#15213B',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#15213B',
  },
});

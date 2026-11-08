import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadow } from '@/theme';

type PillProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'dark' | 'light' | 'danger';
};

// Big rounded button. "dark" = black fill, "light" = soft grey, "danger" = red text.
export function PillButton({ title, onPress, disabled, variant = 'dark' }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.pill,
        variant === 'dark' ? styles.dark : styles.light,
        disabled && { opacity: 0.35 },
        pressed && { transform: [{ scale: 0.98 }], opacity: 0.85 }, // press feedback
      ]}
    >
      <Text style={[styles.pillText, variant === 'dark' && { color: '#fff' }, variant === 'danger' && { color: colors.danger }]}>
        {title}
      </Text>
    </Pressable>
  );
}

type IconProps = {
  icon?: ComponentProps<typeof Ionicons>['name'];
  children?: ReactNode; // custom icon instead of 'icon'
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
};

// White round floating button with a soft shadow (like the + on the Dressup screen).
export function CircleButton({ icon, children, onPress, color = colors.ink, size = 56, disabled }: IconProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      {children ?? (icon ? <Ionicons name={icon} size={size * 0.43} color={color} /> : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: { height: 54, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 12 },
  dark: { backgroundColor: colors.ink },
  light: { backgroundColor: colors.band },
  pillText: { fontSize: 15.5, fontWeight: '700', letterSpacing: 0.2, color: colors.ink },
  circle: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', ...shadow, elevation: 5 },
});

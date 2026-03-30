import React from 'react';
import { Image, Text, View } from 'react-native';
import { SvgUri } from 'react-native-svg';

function initials(name: string) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface TeacherAvatarBadgeProps {
  styles: Record<string, any>;
  name: string;
  avatar?: string;
  size?: number;
}

export function TeacherAvatarBadge({
  styles,
  name,
  avatar,
  size = 40,
}: TeacherAvatarBadgeProps) {
  const isSvgAvatar = Boolean(avatar && /\.svg(\?|$)/i.test(avatar));

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}>
      {avatar ? (
        isSvgAvatar ? (
          <SvgUri uri={avatar} width="100%" height="100%" />
        ) : (
          <Image source={{ uri: avatar }} style={styles.avatarImage} resizeMode="cover" />
        )
      ) : (
        <Text style={styles.avatarText}>{initials(name)}</Text>
      )}
    </View>
  );
}

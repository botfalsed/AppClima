import { View, StyleSheet } from 'react-native';

import { useColorScheme } from '../../hooks/use-color-scheme';

export default function TabBarBackground() {
  const { colorScheme } = useColorScheme();

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: colorScheme === 'dark' 
            ? 'rgba(0, 0, 0, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)',
        }
      ]}
    />
  );
}
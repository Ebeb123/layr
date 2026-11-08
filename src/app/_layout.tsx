import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { migrate } from '@/db/schema';
import { ListsProvider } from '@/lib/lists';
import { headerOptions } from '@/theme';

// Root layout: opens the database once. The Dressup screen (index) is the home screen.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="wardrobe.db" onInit={migrate}>
      <ListsProvider>
        <Stack screenOptions={headerOptions}>
          <Stack.Screen name="index" options={{ title: 'Dressup' }} />
          <Stack.Screen name="favorites" options={{ title: 'Favorites' }} />
          <Stack.Screen name="builder" options={{ title: 'Create outfit' }} />
          <Stack.Screen name="add" options={{ title: 'Add clothes' }} />
          <Stack.Screen name="closet" options={{ title: 'My closet' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="item/[id]" options={{ title: 'Edit item' }} />
          <Stack.Screen name="look/[id]" options={{ title: 'Look' }} />
        </Stack>
      </ListsProvider>
    </SQLiteProvider>
  );
}

import { Tabs } from "expo-router";
import { View ,Text} from "react-native";
import { Stack } from 'expo-router';
import { ThemedText } from "@/components/themed-text";
export default function TabsLayout() {
  return (
   
   <Stack screenOptions={{headerShown : false}}>
    <View>
      <ThemedText>WIDOK POLUBIONYCH</ThemedText>
    </View>
   </Stack>
  );
}
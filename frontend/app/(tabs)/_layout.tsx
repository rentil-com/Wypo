import { Tabs } from "expo-router";
import {Stack} from "expo-router"
export default function TabsLayout() {
  return (
        <Stack screenOptions={{headerShown : false}}>  
    <Tabs>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
        }}
      />
    </Tabs>
    </Stack>
  );
}
import { Tabs } from "expo-router";

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: "#6B3FE7",
                tabBarInactiveTintColor: "#AAAAAA",
                tabBarStyle: {
                    backgroundColor: "#FFFFFF",
                    borderTopColor: "#F0F0F0",
                },
                headerShown: false,
            }}
        >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="products" options={{ title: "Products" }} />
            <Tabs.Screen name="insight" options={{ title: "Insight" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
    );
}
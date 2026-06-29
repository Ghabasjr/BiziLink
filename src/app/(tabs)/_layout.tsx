// import { Tabs } from "expo-router";

// export default function TabLayout() {
//     return (
//         <Tabs
//             screenOptions={{
//                 tabBarActiveTintColor: "#6B3FE7",
//                 tabBarInactiveTintColor: "#AAAAAA",
//                 tabBarStyle: {
//                     backgroundColor: "#FFFFFF",
//                     borderTopColor: "#F0F0F0",
//                 },
//                 headerShown: false,
//             }}
//         >
//             <Tabs.Screen name="home" options={{ title: "Home" }} />
//             <Tabs.Screen name="products" options={{ title: "Products" }} />
//             <Tabs.Screen name="insight" options={{ title: "Insight" }} />
//             <Tabs.Screen name="profile" options={{ title: "Profile" }} />
//         </Tabs>
//     );
// }

import { Ionicons } from "@expo/vector-icons";
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
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="products"
                options={{
                    title: "Products",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="insight"
                options={{
                    title: "Insight",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="bar-chart-outline" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
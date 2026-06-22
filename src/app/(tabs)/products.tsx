/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator,
    Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

import { auth, db } from "@/lib/firebase";
import { Colors } from "@/constants/theme";
import SubscriptionLock from "@/components/SubscriptionLock";

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    images: string[];
    isOutOfStock: boolean;
}

export default function ProductsScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [subscriptionStatus, setSubscriptionStatus] = useState<string>("expired");
    const router = useRouter();

    const fetchProducts = async () => {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            setLoading(true);
            
            // Check subscription status
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                setSubscriptionStatus(userDoc.data()?.subscriptionStatus || "expired");
            }

            const q = query(collection(db, "products"), where("storeId", "==", user.uid));
            const querySnapshot = await getDocs(q);
            const loadedProducts: Product[] = [];
            querySnapshot.forEach((docSnap) => {
                loadedProducts.push({ id: docSnap.id, ...docSnap.data() } as Product);
            });
            setProducts(loadedProducts);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const toggleStockStatus = async (productId: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, "products", productId), {
                isOutOfStock: !currentStatus
            });
            fetchProducts();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const renderProduct = ({ item }: { item: Product }) => (
        <View style={styles.productCard}>
            <Image 
                source={{ uri: item.images[0] || 'https://via.placeholder.com/150' }} 
                style={styles.productImage} 
            />
            <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productPrice}>₦{item.price}</Text>
                <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <TouchableOpacity 
                style={[styles.stockBtn, item.isOutOfStock ? styles.outOfStockBtn : styles.inStockBtn]}
                onPress={() => toggleStockStatus(item.id, item.isOutOfStock)}
            >
                <Text style={styles.stockBtnText}>
                    {item.isOutOfStock ? "Mark In Stock" : "Mark Out of Stock"}
                </Text>
            </TouchableOpacity>
        </View>
    );

    if (!loading && subscriptionStatus !== "active") {
        return <SubscriptionLock tabName="Products" />;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Products</Text>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => router.push("/add-Product/index" as any)}
                >
                    <Text style={styles.addBtnText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.brand.primary} />
                </View>
            ) : products.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyText}>No products found. Add your first product!</Text>
                </View>
            ) : (
                <FlatList
                    data={products}
                    keyExtractor={(item) => item.id}
                    renderItem={renderProduct}
                    contentContainerStyle={styles.listContainer}
                    onRefresh={fetchProducts}
                    refreshing={loading}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: "#FFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E8E8E8",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    addBtn: {
        backgroundColor: "#6B3FE7",
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    addBtnText: {
        color: "#FFF",
        fontWeight: "600",
    },
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    emptyText: {
        color: "#888",
        fontSize: 16,
    },
    listContainer: {
        padding: 15,
        gap: 15,
    },
    productCard: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        flexDirection: "row",
        padding: 10,
        alignItems: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    productImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        backgroundColor: "#F0F0F0",
    },
    productInfo: {
        flex: 1,
        marginLeft: 15,
    },
    productName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1A1A",
    },
    productPrice: {
        fontSize: 15,
        fontWeight: "700",
        color: "#6B3FE7",
        marginTop: 4,
    },
    productCategory: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },
    stockBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    inStockBtn: {
        backgroundColor: "#FFF0F0",
    },
    outOfStockBtn: {
        backgroundColor: "#F0FFF0",
    },
    stockBtnText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#333",
    }
});

import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Share,
    Platform,
    StatusBar,
    ScrollView,
    Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    doc,
    updateDoc,
    increment,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";
const CARD_RADIUS = 16;

interface Business {
    id: string;
    businessName: string;
    description?: string;
    whatsappNumber: string;
    storeSlug: string;
    logoUrl?: string;
    state?: string;
    country?: string;
    subscriptionStatus: string;
}

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    images: string[];
    isOutOfStock: boolean;
    description?: string;
}

export default function StorefrontPage() {
    const { storeSlug } = useLocalSearchParams<{ storeSlug: string }>();
    const [business, setBusiness] = useState<Business | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchStore = async () => {
            if (!storeSlug) return;
            try {
                setLoading(true);

                // Find the business by storeSlug
                const bq = query(
                    collection(db, "users"),
                    where("storeSlug", "==", storeSlug)
                );
                const bSnapshot = await getDocs(bq);
                if (bSnapshot.empty) {
                    setLoading(false);
                    return;
                }
                const bizDoc = bSnapshot.docs[0];
                const bizData = { id: bizDoc.id, ...bizDoc.data() } as Business;
                setBusiness(bizData);

                // Track a store view
                await updateDoc(doc(db, "users", bizDoc.id), {
                    views: increment(1),
                });

                // Fetch products
                const pq = query(
                    collection(db, "products"),
                    where("storeId", "==", bizDoc.id)
                );
                const pSnapshot = await getDocs(pq);
                const productList: Product[] = [];
                pSnapshot.forEach((d) =>
                    productList.push({ id: d.id, ...d.data() } as Product)
                );
                setProducts(productList);
            } catch (error: any) {
                Alert.alert("Error", error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStore();
    }, [storeSlug]);

    const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

    const filteredProducts =
        selectedCategory === "All"
            ? products
            : products.filter((p) => p.category === selectedCategory);

    const handleLike = async (product: Product) => {
        if (!business) return;
        try {
            await addDoc(collection(db, "interests"), {
                storeId: business.id,
                productId: product.id,
                productName: product.name,
                createdAt: new Date().toISOString(),
            });
            // Increment likes on the store owner
            await updateDoc(doc(db, "users", business.id), {
                likesReceived: increment(1),
            });
            Alert.alert("❤️ Liked!", "The seller has been notified of your interest.");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleWhatsApp = async (product: Product) => {
        if (!business) return;
        const phone = business.whatsappNumber.replace(/[^0-9]/g, "");
        const message = encodeURIComponent(
            `Hello, I'm interested in the *${product.name}* for ₦${product.price.toLocaleString()}. Is it available?`
        );
        const url = `https://wa.me/${phone}?text=${message}`;

        try {
            // Track WhatsApp lead
            await updateDoc(doc(db, "users", business.id), {
                whatsappLeads: increment(1),
            });
        } catch {}

        Linking.openURL(url).catch(() =>
            Alert.alert("Error", "Could not open WhatsApp. Please make sure it is installed.")
        );
    };

    const handleShare = async () => {
        if (!business) return;
        try {
            await Share.share({
                message: `Check out ${business.businessName}'s store on BiziLink! bizilink.ng/store/${storeSlug}`,
                url: `https://bizilink.ng/store/${storeSlug}`,
            });
        } catch {}
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={PURPLE} />
                <Text style={styles.loadingText}>Loading store...</Text>
            </SafeAreaView>
        );
    }

    if (!business) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <Text style={styles.notFoundIcon}>🏪</Text>
                <Text style={styles.notFoundTitle}>Store not found</Text>
                <Text style={styles.notFoundText}>
                    {"The store link you opened doesn't exist or has been removed."}
                </Text>
            </SafeAreaView>
        );
    }

    if (business.subscriptionStatus !== "active") {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <Text style={styles.notFoundIcon}>🔒</Text>
                <Text style={styles.notFoundTitle}>Store Unavailable</Text>
                <Text style={styles.notFoundText}>
                    {"This store's subscription is currently inactive."}
                </Text>
            </SafeAreaView>
        );
    }

    // Product detail modal-like inline view
    if (selectedProduct) {
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="light-content" backgroundColor={PURPLE} />
                <View style={styles.detailHeader}>
                    <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => setSelectedProduct(null)}
                    >
                        <Text style={styles.backBtnText}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.detailHeaderTitle}>Product Detail</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Product image */}
                    {selectedProduct.images[0] ? (
                        <Image
                            source={{ uri: selectedProduct.images[0] }}
                            style={styles.detailImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.detailImage, styles.placeholderImage]}>
                            <Text style={styles.placeholderText}>No Image</Text>
                        </View>
                    )}

                    <View style={styles.detailBody}>
                        <View style={styles.detailTitleRow}>
                            <Text style={styles.detailName}>{selectedProduct.name}</Text>
                            {selectedProduct.isOutOfStock && (
                                <View style={styles.outBadge}>
                                    <Text style={styles.outBadgeText}>Out of Stock</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.detailPrice}>
                            ₦{selectedProduct.price.toLocaleString()}
                        </Text>
                        <Text style={styles.detailCategory}>{selectedProduct.category}</Text>
                        {selectedProduct.description ? (
                            <Text style={styles.detailDesc}>{selectedProduct.description}</Text>
                        ) : null}

                        {/* Action buttons */}
                        <View style={styles.detailActions}>
                            <TouchableOpacity
                                style={styles.likeBtn}
                                onPress={() => handleLike(selectedProduct)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.likeBtnText}>❤️  I Like This</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.whatsappBtn,
                                    selectedProduct.isOutOfStock && { opacity: 0.5 },
                                ]}
                                onPress={() => handleWhatsApp(selectedProduct)}
                                disabled={selectedProduct.isOutOfStock}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.whatsappBtnText}>💬  Chat on WhatsApp</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

            {/* Banner header */}
            <View style={styles.banner}>
                <View style={styles.bannerTop}>
                    {/* Logo */}
                    <View style={styles.logoCircle}>
                        {business.logoUrl ? (
                            <Image
                                source={{ uri: business.logoUrl }}
                                style={styles.logoImg}
                                resizeMode="cover"
                            />
                        ) : (
                            <Text style={styles.logoLetter}>
                                {business.businessName.charAt(0).toUpperCase()}
                            </Text>
                        )}
                    </View>

                    {/* Share button */}
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Text style={styles.shareBtnText}>⬆  Share Store</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.storeName}>{business.businessName}</Text>
                {business.description ? (
                    <Text style={styles.storeDesc}>{business.description}</Text>
                ) : null}
                <Text style={styles.storeLocation}>
                    📍 {business.state || ""}{business.state && business.country ? ", " : ""}{business.country || ""}
                </Text>
            </View>

            {/* Category filter */}
            {categories.length > 1 && (
                <View style={styles.catWrapper}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.catScroll}
                    >
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[
                                    styles.catChip,
                                    selectedCategory === cat && styles.catChipActive,
                                ]}
                                onPress={() => setSelectedCategory(cat)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.catChipText,
                                        selectedCategory === cat && styles.catChipTextActive,
                                    ]}
                                >
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Products grid */}
            {filteredProducts.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.notFoundIcon}>📦</Text>
                    <Text style={styles.notFoundTitle}>No products yet</Text>
                    <Text style={styles.notFoundText}>{"This store hasn't added any products."}</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.productCard}
                            onPress={() => setSelectedProduct(item)}
                            activeOpacity={0.85}
                        >
                            {item.images[0] ? (
                                <Image
                                    source={{ uri: item.images[0] }}
                                    style={styles.productImg}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={[styles.productImg, styles.placeholderImage]}>
                                    <Text style={styles.placeholderText}>No Image</Text>
                                </View>
                            )}

                            {item.isOutOfStock && (
                                <View style={styles.outBadgeOverlay}>
                                    <Text style={styles.outBadgeText}>Out of Stock</Text>
                                </View>
                            )}

                            <View style={styles.productInfo}>
                                <Text style={styles.productName} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <Text style={styles.productPrice}>
                                    ₦{item.price.toLocaleString()}
                                </Text>
                            </View>

                            <View style={styles.productActions}>
                                <TouchableOpacity
                                    style={styles.likeSmallBtn}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        handleLike(item);
                                    }}
                                >
                                    <Text style={styles.likeSmallText}>❤️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[
                                        styles.waSmallBtn,
                                        item.isOutOfStock && { opacity: 0.4 },
                                    ]}
                                    onPress={(e) => {
                                        e.stopPropagation?.();
                                        handleWhatsApp(item);
                                    }}
                                    disabled={item.isOutOfStock}
                                >
                                    <Text style={styles.waSmallText}>💬</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 20 },
    loadingText: { fontSize: 14, color: "#888", marginTop: 8 },

    // Not found / inactive states
    notFoundIcon: { fontSize: 56 },
    notFoundTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A", textAlign: "center" },
    notFoundText: { fontSize: 14, color: "#888", textAlign: "center", lineHeight: 20 },

    // Banner
    banner: {
        backgroundColor: PURPLE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 22,
    },
    bannerTop: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255,255,255,0.25)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.5)",
        overflow: "hidden",
    },
    logoImg: { width: 60, height: 60 },
    logoLetter: { fontSize: 26, fontWeight: "800", color: "#fff" },
    shareBtn: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
    },
    shareBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
    storeName: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: 4 },
    storeDesc: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        lineHeight: 18,
        marginBottom: 6,
    },
    storeLocation: { fontSize: 12, color: "rgba(255,255,255,0.7)" },

    // Category filter
    catWrapper: {
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    catScroll: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
    catChip: {
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: "#F0F0F0",
    },
    catChipActive: { backgroundColor: PURPLE_LIGHT },
    catChipText: { fontSize: 13, fontWeight: "600", color: "#555" },
    catChipTextActive: { color: PURPLE },

    // Products grid
    grid: { padding: 12, paddingBottom: 32 },
    row: { gap: 10, marginBottom: 10 },
    productCard: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: CARD_RADIUS,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    productImg: {
        width: "100%",
        height: 140,
        backgroundColor: "#F0F0F0",
    },
    placeholderImage: { alignItems: "center", justifyContent: "center" },
    placeholderText: { fontSize: 12, color: "#aaa" },
    outBadgeOverlay: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(232,82,82,0.9)",
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    productInfo: { padding: 10 },
    productName: { fontSize: 13, fontWeight: "600", color: "#1A1A1A", lineHeight: 17 },
    productPrice: { fontSize: 14, fontWeight: "800", color: PURPLE, marginTop: 4 },
    productActions: {
        flexDirection: "row",
        borderTopWidth: 1,
        borderTopColor: "#F5F5F5",
        padding: 8,
        gap: 6,
    },
    likeSmallBtn: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 4,
        backgroundColor: "#FFF0F5",
        borderRadius: 8,
    },
    likeSmallText: { fontSize: 16 },
    waSmallBtn: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 4,
        backgroundColor: "#E5F7EE",
        borderRadius: 8,
    },
    waSmallText: { fontSize: 16 },

    // Detail view
    detailHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: PURPLE,
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 14,
    },
    backBtn: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
    },
    backBtnText: { fontSize: 26, color: "#fff", lineHeight: 30 },
    detailHeaderTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
    detailImage: { width: "100%", height: 300, backgroundColor: "#F0F0F0" },
    detailBody: { padding: 20 },
    detailTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 6,
    },
    detailName: {
        flex: 1,
        fontSize: 20,
        fontWeight: "800",
        color: "#1A1A1A",
        lineHeight: 26,
    },
    outBadge: {
        backgroundColor: "#FFF0F0",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    outBadgeText: { fontSize: 11, fontWeight: "700", color: "#E85252" },
    detailPrice: { fontSize: 26, fontWeight: "900", color: PURPLE, marginBottom: 4 },
    detailCategory: {
        fontSize: 13,
        color: "#888",
        marginBottom: 12,
        backgroundColor: PURPLE_LIGHT,
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        fontWeight: "600",
        overflow: "hidden",
    },
    detailDesc: { fontSize: 14, color: "#555", lineHeight: 21, marginBottom: 24 },
    detailActions: { gap: 12, marginTop: 8 },
    likeBtn: {
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: "#E85252",
        alignItems: "center",
        backgroundColor: "#FFF0F5",
    },
    likeBtnText: { fontSize: 15, fontWeight: "700", color: "#E85252" },
    whatsappBtn: {
        paddingVertical: 15,
        borderRadius: 30,
        backgroundColor: "#25D366",
        alignItems: "center",
        shadowColor: "#25D366",
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    whatsappBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

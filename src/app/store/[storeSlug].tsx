import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { collection, getDocs, query, where, doc, updateDoc, increment, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

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
    brandName?: string;
    description?: string;
    color?: string;
}

interface StoreBrand {
    name: string;
    image: string;
    colors: string;
}

const STORE_BRANDS: StoreBrand[] = [
    { name: "Gedzner", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=300&auto=format&fit=crop", colors: "20 colors" },
    { name: "Wagambari", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop", colors: "13 Colors" },
    { name: "Bazin", image: "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?q=80&w=300&auto=format&fit=crop", colors: "99 Colors" },
    { name: "Senator", image: "https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=300&auto=format&fit=crop", colors: "99 Colors" },
    { name: "Men Lace", image: "https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=300&auto=format&fit=crop", colors: "10 Colors" },
    { name: "Dan Abba", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&auto=format&fit=crop", colors: "8 Colors" },
];

const STORE_COLORS = [
    "All Colors",
    "Red",
    "Blue",
    "Green",
    "Gold",
    "White",
    "Black",
    "Yellow",
    "Purple",
    "Navy Blue",
    "Brown",
    "Pink",
    "Silver",
    "Orange",
    "Teal",
    "Maroon",
];

export default function StorefrontPage() {
    const { storeSlug, brand } = useLocalSearchParams<{ storeSlug: string; brand?: string }>();
    const initialBrand = Array.isArray(brand) ? brand[0] : brand;
    const [business, setBusiness] = useState<Business | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Brand Selection & Filter State
    const [selectedBrand, setSelectedBrand] = useState(initialBrand || "Men Lace");
    const [tempSelectedBrand, setTempSelectedBrand] = useState(initialBrand || "Men Lace");
    const [brandModalOpen, setBrandModalOpen] = useState(false);

    // Color Selection & Filter State
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [colorModalOpen, setColorModalOpen] = useState(false);

    // Likes tracking
    const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>({});

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

    const filteredProducts = products.filter(
        (p) => p.brandName?.toLowerCase() === selectedBrand.toLowerCase() || p.name?.toLowerCase() === selectedBrand.toLowerCase()
    );

    const handleLike = async (product: Product) => {
        if (!business) return;
        const isLiked = likedProducts[product.id];

        try {
            // Optimistic update
            setLikedProducts((prev) => ({ ...prev, [product.id]: !isLiked }));

            if (!isLiked) {
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
            } else {
                // Decrement if already liked
                await updateDoc(doc(db, "users", business.id), {
                    likesReceived: increment(-1),
                });
            }
        } catch (error: any) {
            // Revert state on error
            setLikedProducts((prev) => ({ ...prev, [product.id]: isLiked }));
            Alert.alert("Error", error.message);
        }
    };

    const handleWhatsApp = async (product: Product) => {
        if (!business) return;

        // Clean phone number format
        let phone = business.whatsappNumber.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) {
            phone = "234" + phone.substring(1);
        } else if (!phone.startsWith("234") && phone.length === 10) {
            phone = "234" + phone;
        }

        const message = encodeURIComponent(
            `Hello, I'm interested in the *${product.name}* for ₦${product.price.toLocaleString()}/Yard. Is it available?`
        );
        const url = `https://wa.me/${phone}?text=${message}`;

        try {
            // Track WhatsApp lead in Firestore
            await updateDoc(doc(db, "users", business.id), {
                whatsappLeads: increment(1),
            });
        } catch (e) {
            console.error("Failed to track lead:", e);
        }

        Linking.openURL(url).catch(() =>
            Alert.alert("Error", "Could not open WhatsApp. Please make sure it is installed.")
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color="#6B3FE7" />
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

    const currentUser = auth.currentUser;
    const isOwner = currentUser && currentUser.uid === business.id;

    if (business.subscriptionStatus !== "active" && !isOwner) {
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

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            <View style={styles.webContainer}>
                {/* Scrollable storefront */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    
                    {/* Store Info Header */}
                    <View style={styles.storeHeader}>
                        <View style={styles.avatarCircle}>
                            {business.logoUrl ? (
                                <Image source={{ uri: business.logoUrl }} style={styles.avatarImg} />
                            ) : (
                                <Text style={styles.avatarLetter}>
                                    {business.businessName.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>
                        <View style={styles.storeHeaderText}>
                            <Text style={styles.storeTitle}>{business.businessName}</Text>
                            <Text style={styles.storeSubtitle}>Trusted Store</Text>
                        </View>
                    </View>

                    {/* Brand Dropdown Trigger */}
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => {
                            setTempSelectedBrand(selectedBrand);
                            setBrandModalOpen(true);
                        }}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dropdownTriggerText}>
                            {selectedBrand} - Select Brands
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {/* Color Dropdown Trigger */}
                    <TouchableOpacity
                        style={styles.dropdownTrigger}
                        onPress={() => setColorModalOpen(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.dropdownTriggerText}>
                            {selectedColor && selectedColor !== "All Colors" ? selectedColor : "Select Color"}
                        </Text>
                        <Text style={styles.dropdownArrow}>▼</Text>
                    </TouchableOpacity>

                    {/* Product Cards Filtered by Brand */}
                    {filteredProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyTitle}>No products found</Text>
                            <Text style={styles.emptySub}>
                                There are no products currently available under &quot;{selectedBrand}&quot;{selectedColor ? ` in ${selectedColor}` : ""}.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.productsContainer}>
                            {filteredProducts.map((product) => {
                                const isLiked = !!likedProducts[product.id];
                                return (
                                    <View key={product.id} style={styles.productCard}>
                                        
                                        {/* Large Product Image */}
                                        <View style={styles.imageWrapper}>
                                            {product.images[0] ? (
                                                <Image source={{ uri: product.images[0] }} style={styles.productImg} />
                                            ) : (
                                                <View style={[styles.productImg, styles.placeholderImg]}>
                                                    <Text style={styles.placeholderText}>No Image Available</Text>
                                                </View>
                                            )}

                                            {/* Heart Button Overlay (top right) */}
                                            <TouchableOpacity
                                                style={styles.heartBtn}
                                                onPress={() => handleLike(product)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.heartText, isLiked && styles.heartTextActive]}>
                                                    {isLiked ? "❤️" : "💚"}
                                                </Text>
                                            </TouchableOpacity>

                                            {/* Floating Info Overlay (bottom) */}
                                            <View style={styles.floatingInfoBox}>
                                                <View style={styles.infoCol}>
                                                    <Text style={styles.infoLabel}>Price</Text>
                                                    <Text style={styles.infoValue}>₦{product.price}/Yard</Text>
                                                </View>
                                                <View style={styles.infoDivider} />
                                                <View style={styles.infoCol}>
                                                    <Text style={styles.infoLabel}>Availability</Text>
                                                    <Text style={styles.infoValue}>
                                                        {product.isOutOfStock ? "Out of Stock" : "In stock"}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        {/* WhatsApp Redirection Button */}
                                        <TouchableOpacity
                                            style={[styles.whatsappBtn, product.isOutOfStock && styles.whatsappBtnDisabled]}
                                            onPress={() => handleWhatsApp(product)}
                                            activeOpacity={0.85}
                                            disabled={product.isOutOfStock}
                                        >
                                            {/* Unicode representation of whatsapp icon (speech bubble / chat icon) */}
                                            <Text style={styles.whatsappIcon}>💬</Text>
                                            <Text style={styles.whatsappText}>I Like This</Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* Select Brand Dropdown Modal */}
            <Modal visible={brandModalOpen} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setBrandModalOpen(false)}
                >
                    <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Select Brand</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            <View style={styles.modalList}>
                                {STORE_BRANDS.map((brandOpt) => {
                                    const isSelected = tempSelectedBrand.toLowerCase() === brandOpt.name.toLowerCase();
                                    return (
                                        <TouchableOpacity
                                            key={brandOpt.name}
                                            style={[styles.brandOptionCard, isSelected && styles.brandOptionCardSelected]}
                                            onPress={() => setTempSelectedBrand(brandOpt.name)}
                                            activeOpacity={0.7}
                                        >
                                            <Image source={{ uri: brandOpt.image }} style={styles.brandOptThumb} />
                                            <View style={styles.brandOptTextContainer}>
                                                <Text style={styles.brandOptName}>{brandOpt.name}</Text>
                                                <Text style={styles.brandOptColors}>{brandOpt.colors}</Text>
                                            </View>
                                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                                {isSelected && <View style={styles.radioDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalContinueBtn}
                                onPress={() => {
                                    setSelectedBrand(tempSelectedBrand);
                                    setBrandModalOpen(false);
                                }}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.modalContinueText}>Continue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Select Color Dropdown Modal (Closes immediately upon selection) */}
            <Modal visible={colorModalOpen} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setColorModalOpen(false)}
                >
                    <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Select Color</Text>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
                            <View style={styles.modalList}>
                                {STORE_COLORS.map((colorOpt) => {
                                    const isSelected =
                                        (selectedColor?.toLowerCase() === colorOpt.toLowerCase()) ||
                                        (!selectedColor && colorOpt === "All Colors");
                                    return (
                                        <TouchableOpacity
                                            key={colorOpt}
                                            style={[styles.colorOptionCard, isSelected && styles.colorOptionCardSelected]}
                                            onPress={() => {
                                                setSelectedColor(colorOpt === "All Colors" ? null : colorOpt);
                                                setColorModalOpen(false);
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.colorOptName}>{colorOpt}</Text>
                                            <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                                {isSelected && <View style={styles.radioDot} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    loadingText: {
        fontSize: 14,
        color: "#888888",
        marginTop: 8,
    },
    notFoundIcon: {
        fontSize: 56,
        marginBottom: 10,
    },
    notFoundTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        textAlign: "center",
    },
    notFoundText: {
        fontSize: 14,
        color: "#888888",
        textAlign: "center",
        lineHeight: 20,
    },

    // Mobile First Web Container constraint
    webContainer: {
        flex: 1,
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
        backgroundColor: "#FFFFFF",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 32,
        gap: 16,
    },

    // Header Store info
    storeHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 8,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#F0F0F0",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    avatarImg: {
        width: 50,
        height: 50,
    },
    avatarLetter: {
        fontSize: 22,
        fontWeight: "800",
        color: PURPLE,
    },
    storeHeaderText: {
        justifyContent: "center",
    },
    storeTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    storeSubtitle: {
        fontSize: 12,
        color: "#888888",
        marginTop: 2,
    },

    // Dropdown selection
    dropdownTrigger: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        paddingHorizontal: 20,
        paddingVertical: 14,
        minHeight: 52,
    },
    dropdownTriggerText: {
        fontSize: 14,
        color: "#1A1A1A",
        fontWeight: "500",
    },
    dropdownArrow: {
        fontSize: 10,
        color: "#888888",
    },

    // Product Card Grid / View
    productsContainer: {
        gap: 20,
    },
    productCard: {
        gap: 14,
    },
    imageWrapper: {
        position: "relative",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#F5F5FA",
        borderWidth: 1,
        borderColor: "#F0F0F5",
    },
    productImg: {
        width: "100%",
        height: 380,
    },
    placeholderImg: {
        alignItems: "center",
        justifyContent: "center",
    },
    placeholderText: {
        fontSize: 14,
        color: "#AAAAAA",
    },

    // Heart Icon Button overlay (top right)
    heartBtn: {
        position: "absolute",
        top: 16,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    heartText: {
        fontSize: 20,
        color: "#22C55E",
    },
    heartTextActive: {
        color: "#E85252",
    },

    // Floating Details Info Box
    floatingInfoBox: {
        position: "absolute",
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },
    infoCol: {
        flex: 1,
        gap: 2,
    },
    infoLabel: {
        fontSize: 11,
        color: "#6B6B80",
        fontWeight: "500",
    },
    infoValue: {
        fontSize: 14,
        fontWeight: "700",
        color: PURPLE,
    },
    infoDivider: {
        width: 1,
        height: 28,
        backgroundColor: "#EAEAEA",
        marginHorizontal: 16,
    },

    // WhatsApp Button
    whatsappBtn: {
        backgroundColor: "#22C55E",
        borderRadius: 12,
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        shadowColor: "#22C55E",
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 2,
    },
    whatsappBtnDisabled: {
        backgroundColor: "#AAAAAA",
        shadowOpacity: 0,
        elevation: 0,
    },
    whatsappIcon: {
        fontSize: 18,
        color: "#FFFFFF",
    },
    whatsappText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "700",
    },

    // Empty state
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 48,
        paddingHorizontal: 24,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 10,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 6,
    },
    emptySub: {
        fontSize: 13,
        color: "#888888",
        textAlign: "center",
        lineHeight: 18,
    },

    // Bottom Sheet modal brand options
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        maxHeight: "75%",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1A1A1A",
        textAlign: "center",
        marginBottom: 16,
        paddingHorizontal: 18,
    },
    modalScroll: {
        paddingHorizontal: 18,
    },
    modalList: {
        gap: 12,
        paddingBottom: 16,
    },
    brandOptionCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 14,
    },
    brandOptionCardSelected: {
        borderColor: PURPLE,
    },
    brandOptThumb: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },
    brandOptTextContainer: {
        flex: 1,
    },
    brandOptName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    brandOptColors: {
        fontSize: 12,
        color: "#999999",
        marginTop: 3,
    },

    // Radio styles
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#DEDEDE",
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: {
        borderColor: PURPLE,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PURPLE,
    },

    // Color Option Card
    colorOptionCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    colorOptionCardSelected: {
        borderColor: PURPLE,
    },
    colorOptName: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1A1A1A",
    },

    // Modal Footer
    modalFooter: {
        paddingHorizontal: 18,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "#EAEAEA",
    },
    modalContinueBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    modalContinueText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});

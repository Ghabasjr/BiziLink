import { auth, db, PUBLIC_STORE_BASE_URL } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Clipboard,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Brand {
    id: string;
    name: string;
    image: string;
}

const BRANDS: Brand[] = [
    { id: "men_lace", name: "Men Lace", image: "https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=300&auto=format&fit=crop" },
    { id: "gezner", name: "Gezner", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=300&auto=format&fit=crop" },
    { id: "wagambari", name: "Wagambari", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop" },
    { id: "dan_abba", name: "Dan Abba", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&auto=format&fit=crop" },
    { id: "bazin", name: "Bazin", image: "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?q=80&w=300&auto=format&fit=crop" },
    { id: "bazin_alt", name: "Bazin", image: "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=300&auto=format&fit=crop" },
];

export default function ShareLinkScreen() {
    const router = useRouter();
    const [storeSlug, setStoreSlug] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [brandProductCounts, setBrandProductCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                // Get store slug & business name
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setStoreSlug(data?.storeSlug || "");
                    setBusinessName(data?.businessName || "");
                }

                // Get product counts per brand
                const q = query(collection(db, "products"), where("storeId", "==", user.uid));
                const snap = await getDocs(q);
                const counts: Record<string, number> = {};
                snap.forEach((docSnap) => {
                    const prod = docSnap.data();
                    const brand = prod.brandName || "";
                    if (brand) {
                        counts[brand] = (counts[brand] || 0) + 1;
                    }
                });
                setBrandProductCounts(counts);
            } catch (e) {
                console.error("Error fetching share link data:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const mainStoreUrl = storeSlug ? `${PUBLIC_STORE_BASE_URL}/store/${storeSlug}` : "";

    const handleCopyMainLink = () => {
        if (!storeSlug) {
            Alert.alert("Error", "We could not fetch your store slug. Please set up your business profile first.");
            return;
        }

        Clipboard.setString(mainStoreUrl);
        Alert.alert("Store Link Copied", "Your main store link has been copied to your clipboard.");
    };

    const handleShareMainLink = async () => {
        if (!storeSlug) {
            Alert.alert("Error", "We could not fetch your store slug. Please set up your business profile first.");
            return;
        }

        try {
            await Share.share({
                message: `Check out ${businessName || 'my'} store on BiziLink! ${mainStoreUrl}`,
                url: mainStoreUrl,
            });
        } catch (error) {
            console.error("Failed to share store", error);
        }
    };

    const handleCopyLink = (brand: Brand) => {
        if (!storeSlug) {
            Alert.alert("Error", "We could not fetch your store slug. Please set up your business profile first.");
            return;
        }

        const link = `${PUBLIC_STORE_BASE_URL}/store/${storeSlug}?brand=${encodeURIComponent(brand.name)}`;
        Clipboard.setString(link);

        Alert.alert("Link Copied", `Successfully copied the link for "${brand.name}" to clipboard.`);
    };

    const handleCopyAllLinks = () => {
        if (!storeSlug) {
            Alert.alert("Error", "We could not fetch your store slug. Please set up your business profile first.");
            return;
        }

        const allLinks = BRANDS.map(
            (brand) => `${brand.name}: ${PUBLIC_STORE_BASE_URL}/store/${storeSlug}?brand=${encodeURIComponent(brand.name)}`
        ).join("\n");
        Clipboard.setString(allLinks);

        Alert.alert("All Links Copied", "All brand store links have been copied to your clipboard.");
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color="#6B3FE7" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Share Link</Text>
                <TouchableOpacity style={styles.searchBtn} activeOpacity={0.7}>
                    <Text style={styles.searchIcon}></Text>
                    <View>
                        <Image
                            source={require("../../assets/images/search-01.png")}
                        />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Copy All Links Button */}
            <TouchableOpacity
                style={styles.copyAllBtn}
                onPress={handleCopyAllLinks}
                activeOpacity={0.8}
            >
                <Text style={styles.copyAllIcon}>⧉</Text>
                <Text style={styles.copyAllText}>Copy All Links</Text>
            </TouchableOpacity>

            {/* Content */}
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Main Store Link Card */}
                <View style={styles.mainLinkCard}>
                    <Text style={styles.mainLinkTitle}>Your Public Store Link</Text>
                    <Text style={styles.mainLinkUrl} numberOfLines={1}>
                        {mainStoreUrl || "https://bizi-link.vercel.app/store/..."}
                    </Text>
                    <View style={styles.mainLinkBtnRow}>
                        <TouchableOpacity style={styles.mainLinkBtnSecondary} onPress={handleCopyMainLink} activeOpacity={0.8}>
                            <Text style={styles.mainLinkBtnSecondaryText}>Copy Store Link</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.mainLinkBtnPrimary} onPress={handleShareMainLink} activeOpacity={0.8}>
                            <Text style={styles.mainLinkBtnPrimaryText}>Share Link</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Please Copy link and send to customer</Text>

                <View style={styles.brandList}>
                    {BRANDS.map((brand, idx) => {
                        const productCount = brandProductCounts[brand.name] || 0;
                        return (
                            <View key={`${brand.id}-${idx}`} style={styles.brandCard}>
                                <Image source={{ uri: brand.image }} style={styles.brandThumb} />
                                <View style={styles.brandTextContainer}>
                                    <Text style={styles.brandName}>{brand.name}</Text>
                                    <Text style={styles.brandCount}>{productCount} Products</Text>
                                </View>
                                <TouchableOpacity
                                    style={styles.copyBtn}
                                    onPress={() => handleCopyLink(brand)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.copyBtnText}>Copy Link</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
        paddingTop: 30,
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    backIcon: {
        fontSize: 24,
        color: "#1A1A1A",
        lineHeight: 28,
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    searchBtn: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    searchIcon: {
        fontSize: 18,
        color: PURPLE,
    },
    copyAllBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-end",
        marginHorizontal: 18,
        marginBottom: 6,
        gap: 7,
        backgroundColor: PURPLE,
        paddingVertical: 9,
        paddingHorizontal: 18,
        borderRadius: 30,
        shadowColor: PURPLE,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    copyAllIcon: {
        fontSize: 14,
        color: "#FFFFFF",
        fontWeight: "700",
    },
    copyAllText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
        letterSpacing: 0.2,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 24,
        gap: 14,
    },
    mainLinkCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        marginBottom: 8,
    },
    mainLinkTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#666666",
        marginBottom: 4,
    },
    mainLinkUrl: {
        fontSize: 15,
        fontWeight: "700",
        color: PURPLE,
        marginBottom: 14,
    },
    mainLinkBtnRow: {
        flexDirection: "row",
        gap: 10,
    },
    mainLinkBtnSecondary: {
        flex: 1,
        backgroundColor: "#F0EBFE",
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    mainLinkBtnSecondaryText: {
        fontSize: 13,
        fontWeight: "700",
        color: PURPLE,
    },
    mainLinkBtnPrimary: {
        flex: 1,
        backgroundColor: PURPLE,
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    mainLinkBtnPrimaryText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    sectionLabel: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        lineHeight: 28,
        marginBottom: 14,
    },
    brandList: {
        gap: 12,
    },
    brandCard: {
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
    brandThumb: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },
    brandTextContainer: {
        flex: 1,
    },
    brandName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    brandCount: {
        fontSize: 12,
        color: "#999999",
        marginTop: 3,
    },
    copyBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    copyBtnText: {
        fontSize: 14,
        color: PURPLE,
        fontWeight: "700",
    },
});

/* eslint-disable react-hooks/set-state-in-effect */
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator
} from "react-native";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/theme";

export default function UnpaidDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [productCount, setProductCount] = useState(0);
    const [userData, setUserData] = useState<any>(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                // Fetch user data
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                }

                // Fetch product count
                const q = query(collection(db, "products"), where("storeId", "==", user.uid));
                const querySnapshot = await getDocs(q);
                setProductCount(querySnapshot.size);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const stats = [
        {
            label: "Total\nProducts",
            value: productCount,
            bg: "#EEE9FB",
            iconBg: "#7B52E8",
            icon: "▦",
        },
        {
            label: "Store\nViews",
            value: userData?.views || 0,
            bg: "#FDE8E8",
            iconBg: "#E85252",
            icon: "👁",
        },
        {
            label: "Whatsapp\nLead",
            value: userData?.whatsappLeads || 0,
            bg: "#E5F7EE",
            iconBg: "#25D366",
            icon: "💬",
        },
        {
            label: "Likes\nReceived",
            value: userData?.likesReceived || 0,
            bg: "#FEF3E2",
            iconBg: "#F5A623",
            icon: "♥",
        },
    ];

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={PURPLE} />
            </SafeAreaView>
        );
    }

    const isSubscribed = userData?.subscriptionStatus === 'active';

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.menuBtn}>
                        <Text style={styles.menuIcon}>☰</Text>
                    </TouchableOpacity>

                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>Good Morning, {userData?.fullName?.split(' ')[0] || 'User'}</Text>
                        <Text style={styles.subGreeting}>Let get your store live and start selling</Text>
                    </View>

                    <TouchableOpacity style={styles.bellBtn}>
                        <Text style={styles.bellIcon}>🔔</Text>
                        <View style={styles.bellDot} />
                    </TouchableOpacity>
                </View>

                {/* ── Store Card ── */}
                <View style={styles.storeCard}>
                    {/* Top row: avatar + name */}
                    <View style={styles.storeTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>👟</Text>
                        </View>
                        <View>
                            <Text style={styles.storeName}>{userData?.businessName || 'Your Store'}</Text>
                            <Text style={styles.storeLocation}>{userData?.state || 'Location'}, {userData?.country || 'Country'}</Text>
                        </View>
                    </View>

                    {/* Unlock banner */}
                    {!isSubscribed && (
                        <View style={styles.unlockBanner}>
                            <View style={styles.unlockIcon}>
                                <Text style={styles.unlockIconText}>👑</Text>
                            </View>
                            <View style={styles.unlockText}>
                                <Text style={styles.unlockTitle}>Unlock all features</Text>
                                <Text style={styles.unlockSub}>Add product, get views{"\n"}and receive lead</Text>
                            </View>
                            <View style={styles.unlockRight}>
                                <TouchableOpacity style={styles.activateBtn} onPress={() => router.push('/payment')}>
                                    <Text style={styles.activateBtnText}>Activate</Text>
                                </TouchableOpacity>
                                <Text style={styles.price}>₦800 / month</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* ── Quick Actions ── */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity 
                        style={[styles.actionBtn, !isSubscribed && { opacity: 0.5 }]} 
                        onPress={() => isSubscribed ? router.push('/add-Product/index' as any) : null} 
                        activeOpacity={0.8}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: "#25C16F" }]}>
                            <Text style={styles.actionIconText}>＋</Text>
                        </View>
                        <Text style={styles.actionLabel}>Add Product</Text>
                    </TouchableOpacity>

                    <View style={styles.actionDivider} />

                    <TouchableOpacity 
                        style={styles.actionBtn} 
                        onPress={() => router.push(`/store/${userData?.storeSlug}` as any)} 
                        activeOpacity={0.8}
                    >
                        <View style={[styles.actionIcon, { backgroundColor: "#FEF0DC" }]}>
                            <Text style={[styles.actionIconText, { color: "#F5A623" }]}>⛓</Text>
                        </View>
                        <Text style={styles.actionLabel}>View Store</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Store Overview ── */}
                <Text style={styles.sectionTitle}>Store Overview</Text>

                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: stat.iconBg }]}>
                                <Text style={styles.statIconText}>{stat.icon}</Text>
                            </View>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Complete Setup Banner ── */}
                {!isSubscribed && (
                    <View style={styles.setupBanner}>
                        <View style={styles.setupText}>
                            <Text style={styles.setupTitle}>Complete your store setup</Text>
                            <Text style={styles.setupSub}>You are just a few step away from going live.</Text>
                        </View>
                        <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/payment')}>
                            <Text style={styles.setupBtnText}>Activate</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";
const CARD_RADIUS = 18;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },

    // ── Header ──────────────────────────────────────────
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 16,
        gap: 12,
    },
    menuBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    menuIcon: {
        fontSize: 18,
        color: "#333",
    },
    headerText: {
        flex: 1,
    },
    greeting: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    subGreeting: {
        fontSize: 12,
        color: "#888",
        marginTop: 1,
    },
    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    bellIcon: {
        fontSize: 18,
    },
    bellDot: {
        position: "absolute",
        top: 7,
        right: 7,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#FF3B30",
        borderWidth: 1.5,
        borderColor: "#fff",
    },

    // ── Store Card ──────────────────────────────────────
    storeCard: {
        marginHorizontal: 16,
        borderRadius: CARD_RADIUS,
        backgroundColor: PURPLE,
        padding: 18,
        marginBottom: 14,
    },
    storeTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginBottom: 18,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#1A0A5E",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.3)",
    },
    avatarText: {
        fontSize: 24,
    },
    storeName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#FFFFFF",
    },
    storeLocation: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },

    // Unlock banner
    unlockBanner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 14,
        padding: 14,
        gap: 10,
    },
    unlockIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    unlockIconText: {
        fontSize: 18,
    },
    unlockText: {
        flex: 1,
    },
    unlockTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#FFFFFF",
    },
    unlockSub: {
        fontSize: 11,
        color: "rgba(255,255,255,0.7)",
        marginTop: 2,
        lineHeight: 15,
    },
    unlockRight: {
        alignItems: "flex-end",
        gap: 6,
    },
    activateBtn: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 7,
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.4)",
    },
    activateBtnText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    price: {
        fontSize: 11,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "600",
    },

    // ── Quick Actions ────────────────────────────────────
    actionsRow: {
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        paddingHorizontal: 24,
        marginBottom: 22,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    actionIconText: {
        fontSize: 20,
        color: "#FFFFFF",
        fontWeight: "700",
        lineHeight: 24,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1A1A",
    },
    actionDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#EBEBEB",
        marginHorizontal: 8,
    },

    // ── Store Overview ───────────────────────────────────
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A1A",
        paddingHorizontal: 18,
        marginBottom: 14,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 10,
        marginBottom: 20,
    },
    statCard: {
        width: "47%",
        borderRadius: 16,
        padding: 14,
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statIconText: {
        fontSize: 18,
        color: "#fff",
    },
    statLabel: {
        fontSize: 13,
        color: "#555",
        fontWeight: "500",
        lineHeight: 18,
    },
    statValue: {
        fontSize: 28,
        fontWeight: "800",
        color: "#1A1A1A",
        marginTop: 4,
        marginBottom: 6,
    },

    // ── Setup Banner ─────────────────────────────────────
    setupBanner: {
        marginHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 18,
        paddingHorizontal: 18,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    setupText: {
        flex: 1,
        marginRight: 12,
    },
    setupTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    setupSub: {
        fontSize: 12,
        color: "#888",
        marginTop: 3,
        lineHeight: 17,
    },
    setupBtn: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    setupBtnText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
    },
});
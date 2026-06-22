/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import SubscriptionLock from "@/components/SubscriptionLock";

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";
const CARD_RADIUS = 16;

interface Interest {
    id: string;
    productName: string;
    createdAt: string;
}

export default function InsightScreen() {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [productCount, setProductCount] = useState(0);
    const [interests, setInterests] = useState<Interest[]>([]);

    useEffect(() => {
        const fetchInsights = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                setLoading(true);

                // Fetch user data (views, likes, whatsapp leads)
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) setUserData(snap.data());

                // Product count
                const pq = query(
                    collection(db, "products"),
                    where("storeId", "==", user.uid)
                );
                const pSnap = await getDocs(pq);
                setProductCount(pSnap.size);

                // Recent interests/likes
                const iq = query(
                    collection(db, "interests"),
                    where("storeId", "==", user.uid),
                    orderBy("createdAt", "desc"),
                    limit(10)
                );
                const iSnap = await getDocs(iq);
                const list: Interest[] = [];
                iSnap.forEach((d) => list.push({ id: d.id, ...d.data() } as Interest));
                setInterests(list);
            } catch (e) {
                // Firestore index might not be created yet — silently handle
            } finally {
                setLoading(false);
            }
        };
        fetchInsights();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={PURPLE} />
            </SafeAreaView>
        );
    }

    if (userData?.subscriptionStatus !== "active") {
        return <SubscriptionLock tabName="Insights" />;
    }

    const stats = [
        {
            label: "Total Products",
            value: productCount,
            icon: "▦",
            bg: "#EEE9FB",
            iconBg: "#7B52E8",
        },
        {
            label: "Store Views",
            value: userData?.views || 0,
            icon: "👁",
            bg: "#FDE8E8",
            iconBg: "#E85252",
        },
        {
            label: "WhatsApp Leads",
            value: userData?.whatsappLeads || 0,
            icon: "💬",
            bg: "#E5F7EE",
            iconBg: "#25D366",
        },
        {
            label: "Likes Received",
            value: userData?.likesReceived || 0,
            icon: "♥",
            bg: "#FEF3E2",
            iconBg: "#F5A623",
        },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Insights</Text>
                    <Text style={styles.headerSub}>Your store performance at a glance</Text>
                </View>
                <View style={styles.headerBadge}>
                    <Text style={styles.headerBadgeText}>Live</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Stats grid */}
                <Text style={styles.sectionTitle}>Overview</Text>
                <View style={styles.statsGrid}>
                    {stats.map((s) => (
                        <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: s.iconBg }]}>
                                <Text style={styles.statIcon}>{s.icon}</Text>
                            </View>
                            <Text style={styles.statValue}>{s.value}</Text>
                            <Text style={styles.statLabel}>{s.label}</Text>
                        </View>
                    ))}
                </View>

                {/* Conversion rate card */}
                <View style={styles.convCard}>
                    <View style={styles.convLeft}>
                        <Text style={styles.convTitle}>Conversion Rate</Text>
                        <Text style={styles.convSub}>
                            WhatsApp leads / Total views
                        </Text>
                    </View>
                    <Text style={styles.convValue}>
                        {userData?.views
                            ? (((userData?.whatsappLeads || 0) / userData.views) * 100).toFixed(1) + "%"
                            : "—"}
                    </Text>
                </View>

                {/* Recent interests */}
                <Text style={styles.sectionTitle}>Recent Customer Interests</Text>
                {interests.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyIcon}>❤️</Text>
                        <Text style={styles.emptyTitle}>No likes yet</Text>
                        <Text style={styles.emptyText}>
                            When customers like your products, they'll appear here.
                        </Text>
                    </View>
                ) : (
                    <View style={styles.card}>
                        {interests.map((item, index) => {
                            const date = new Date(item.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                            });
                            return (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.interestRow,
                                        index < interests.length - 1 && styles.interestRowBorder,
                                    ]}
                                >
                                    <View style={styles.interestIcon}>
                                        <Text style={{ fontSize: 16 }}>❤️</Text>
                                    </View>
                                    <View style={styles.interestText}>
                                        <Text style={styles.interestProduct}>{item.productName}</Text>
                                        <Text style={styles.interestDate}>{date}</Text>
                                    </View>
                                    <View style={styles.interestBadge}>
                                        <Text style={styles.interestBadgeText}>Liked</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Tips card */}
                <View style={styles.tipsCard}>
                    <Text style={styles.tipsTitle}>💡  Growth Tips</Text>
                    {[
                        "Share your store link on WhatsApp status daily.",
                        "Add clear product photos for more views.",
                        "Respond to leads quickly to convert sales.",
                        "Update your product list regularly to stay fresh.",
                    ].map((tip, i) => (
                        <View key={i} style={styles.tipRow}>
                            <View style={styles.tipDot} />
                            <Text style={styles.tipText}>{tip}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    center: { justifyContent: "center", alignItems: "center" },

    // Header
    header: {
        backgroundColor: PURPLE,
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    headerBadge: {
        backgroundColor: "#25C16F",
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },

    content: { padding: 16, gap: 14, paddingBottom: 40 },

    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 2,
        marginTop: 4,
    },

    // Stats grid — 2 columns
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    statCard: {
        width: "47.5%",
        borderRadius: CARD_RADIUS,
        padding: 14,
    },
    statIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statIcon: { fontSize: 18, color: "#fff" },
    statValue: { fontSize: 30, fontWeight: "900", color: "#1A1A1A" },
    statLabel: { fontSize: 12, color: "#555", fontWeight: "500", marginTop: 2 },

    // Conversion card
    convCard: {
        backgroundColor: PURPLE,
        borderRadius: CARD_RADIUS,
        padding: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    convLeft: { flex: 1 },
    convTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
    convSub: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 3 },
    convValue: {
        fontSize: 32,
        fontWeight: "900",
        color: "#fff",
        letterSpacing: -0.5,
    },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: CARD_RADIUS,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },

    // Interests list
    interestRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
    },
    interestRowBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
    interestIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#FFF0F5",
        alignItems: "center",
        justifyContent: "center",
    },
    interestText: { flex: 1 },
    interestProduct: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
    interestDate: { fontSize: 11, color: "#888", marginTop: 2 },
    interestBadge: {
        backgroundColor: "#FFF0F5",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    interestBadgeText: { fontSize: 11, fontWeight: "700", color: "#E85252" },

    // Empty state
    emptyCard: {
        backgroundColor: "#fff",
        borderRadius: CARD_RADIUS,
        padding: 28,
        alignItems: "center",
        gap: 8,
    },
    emptyIcon: { fontSize: 40 },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },
    emptyText: { fontSize: 13, color: "#888", textAlign: "center", lineHeight: 18 },

    // Tips
    tipsCard: {
        backgroundColor: PURPLE_LIGHT,
        borderRadius: CARD_RADIUS,
        padding: 16,
        gap: 10,
    },
    tipsTitle: { fontSize: 14, fontWeight: "700", color: PURPLE, marginBottom: 2 },
    tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    tipDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: PURPLE,
        marginTop: 5,
        flexShrink: 0,
    },
    tipText: { flex: 1, fontSize: 13, color: "#444", lineHeight: 19 },
});

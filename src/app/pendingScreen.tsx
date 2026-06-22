import { auth, db } from "@/lib/firebase";
import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PURPLE = "#6B3FE7";
const CARD_RADIUS = 18;

export default function PendingDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [productCount, setProductCount] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) setUserData(snap.data());
                const q = query(collection(db, "products"), where("storeId", "==", user.uid));
                const ps = await getDocs(q);
                setProductCount(ps.size);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCancel = () => {
        Alert.alert(
            "Cancel Subscription",
            "Are you sure you want to cancel your pending subscription?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        const user = auth.currentUser;
                        if (!user) return;
                        await updateDoc(doc(db, "users", user.uid), {
                            subscriptionStatus: "expired",
                        });
                        router.replace("/(tabs)/index" as any);
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { justifyContent: "center", alignItems: "center" }]}>
                <ActivityIndicator size="large" color={PURPLE} />
            </SafeAreaView>
        );
    }

    const statCards = [
        { label: "Total\nProducts", value: productCount, bg: "#EEE9FB", iconBg: "#7B52E8", icon: "▦" },
        { label: "Store\nViews", value: userData?.views || 0, bg: "#FDE8E8", iconBg: "#E85252", icon: "👁" },
        { label: "Whatsapp\nLead", value: userData?.whatsappLeads || 0, bg: "#E5F7EE", iconBg: "#25D366", icon: "💬" },
        { label: "Likes\nReceived", value: userData?.likesReceived || 0, bg: "#FEF3E2", iconBg: "#F5A623", icon: "♥" },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ── Header ── */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={styles.menuIcon}>☰</Text>
                    </TouchableOpacity>
                    <View style={styles.headerText}>
                        <Text style={styles.greeting}>Good Morning, {userData?.fullName?.split(" ")[0] || "there"}</Text>
                        <Text style={styles.subGreeting}>Your payment is being reviewed</Text>
                    </View>
                    <TouchableOpacity style={styles.iconBtn}>
                        <Text style={styles.bellIcon}>🔔</Text>
                        <View style={styles.bellDot} />
                    </TouchableOpacity>
                </View>

                {/* ── Store Card ── */}
                <View style={styles.storeCard}>
                    <View style={styles.storeTop}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userData?.businessName?.charAt(0)?.toUpperCase() || "B"}
                            </Text>
                        </View>
                        <View>
                            <Text style={styles.storeName}>{userData?.businessName || "Your Store"}</Text>
                            <Text style={styles.storeSub}>
                                {[userData?.state, userData?.country].filter(Boolean).join(", ")}
                            </Text>
                        </View>
                    </View>

                    {/* Pending banner */}
                    <View style={styles.pendingBanner}>
                        <View style={styles.bannerIconWrap}>
                            <Text style={styles.bannerIcon}>⏳</Text>
                        </View>
                        <View style={styles.bannerText}>
                            <Text style={styles.bannerTitle}>Pending Verification</Text>
                            <Text style={styles.bannerSub}>Your payment is under{"\n"}review — usually within 24 hrs</Text>
                        </View>
                        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel} activeOpacity={0.8}>
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Quick Actions (disabled) ── */}
                <View style={[styles.actionsRow, { opacity: 0.5 }]}>
                    <View style={styles.actionBtn}>
                        <View style={[styles.actionIcon, { backgroundColor: "#25C16F" }]}>
                            <Text style={styles.actionIconText}>＋</Text>
                        </View>
                        <Text style={styles.actionLabel}>Add Product</Text>
                    </View>
                    <View style={styles.actionDivider} />
                    <View style={styles.actionBtn}>
                        <View style={[styles.actionIcon, { backgroundColor: "#FEF0DC" }]}>
                            <Text style={[styles.actionIconText, { color: "#F5A623" }]}>⛓</Text>
                        </View>
                        <Text style={styles.actionLabel}>Share Store</Text>
                    </View>
                </View>

                {/* ── Stats ── */}
                <Text style={styles.sectionTitle}>Store Overview</Text>
                <View style={styles.statsGrid}>
                    {statCards.map((stat) => (
                        <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: stat.iconBg }]}>
                                <Text style={styles.statIconText}>{stat.icon}</Text>
                            </View>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.value}</Text>
                        </View>
                    ))}
                </View>

                {/* ── Info banner ── */}
                <View style={styles.infoBanner}>
                    <Text style={styles.infoIcon}>ℹ️</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoTitle}>What happens next?</Text>
                        <Text style={styles.infoText}>
                            {"Our team will verify your payment receipt and activate your account. You'll be notified as soon as it's done."}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 32 },

    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 16 : 8, paddingBottom: 16, gap: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    menuIcon: { fontSize: 18, color: "#333" },
    headerText: { flex: 1 },
    greeting: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
    subGreeting: { fontSize: 12, color: "#888", marginTop: 1 },
    bellIcon: { fontSize: 18 },
    bellDot: { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", borderWidth: 1.5, borderColor: "#fff" },

    storeCard: { marginHorizontal: 16, borderRadius: CARD_RADIUS, backgroundColor: PURPLE, padding: 18, marginBottom: 14 },
    storeTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#1A0A5E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
    avatarText: { fontSize: 24, color: "#fff", fontWeight: "700" },
    storeName: { fontSize: 20, fontWeight: "800", color: "#FFF" },
    storeSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

    pendingBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, gap: 10 },
    bannerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    bannerIcon: { fontSize: 18 },
    bannerText: { flex: 1 },
    bannerTitle: { fontSize: 13, fontWeight: "800", color: "#FFF" },
    bannerSub: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2, lineHeight: 15 },
    cancelBtn: { backgroundColor: PURPLE, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.4)" },
    cancelBtnText: { color: "#FFF", fontSize: 12, fontWeight: "700" },

    actionsRow: { marginHorizontal: 16, backgroundColor: "#FFF", borderRadius: CARD_RADIUS, flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 24, marginBottom: 22, elevation: 2 },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 12
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center"
    },
    actionIconText: {
        fontSize: 20,
        color: "#FFF",
        fontWeight: "700",
        lineHeight: 24
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1A1A"
    },
    actionDivider: {
        width: 1,
        height: 36,
        backgroundColor: "#EBEBEB",
        marginHorizontal: 8
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A1A",
        paddingHorizontal: 18,
        marginBottom: 14
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 12,
        gap: 10,
        marginBottom: 20
    },
    statCard: {
        width: "47%",
        borderRadius: 16,
        padding: 14
    },
    statIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8
    },
    statIconText: {
        fontSize: 18,
        color: "#fff"
    },
    statLabel: {
        fontSize: 13,
        color: "#555",
        fontWeight: "500",
        lineHeight: 18
    },
    statValue:
    {
        fontSize: 28,
        fontWeight: "800",
        color: "#1A1A1A",
        marginTop: 4
    },

    infoBanner:
    {
        marginHorizontal: 16,
        backgroundColor: "#FFF",
        borderRadius: CARD_RADIUS,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
        elevation: 2
    },
    infoIcon:
    {
        fontSize: 22

    },
    infoTitle:
    {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 4
    },
    infoText:
    {
        fontSize: 13,
        color: "#666",
        lineHeight: 19
    },
});
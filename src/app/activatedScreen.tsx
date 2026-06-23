import { router } from "expo-router";
import {
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
    storeName?: string;
    storeCategories?: string;
    renewDate?: string;
    onAddProduct?: () => void;
    onShareStore?: () => void;
    onManageSubscription?: () => void;
    onActivate?: () => void;
    stats?: {
        totalProducts: { value: number; addedToday: number };
        storeViews: { value: number; addedToday: number };
        whatsappLead: { value: number; addedToday: number };
        likesReceived: { value: number; addedToday: number };
    };
}

export default function ActiveDashboard({
    storeName = "Aliyu Shoes",
    storeCategories = "Shoes, Ankara, Caps",
    renewDate = "24 june, 2026",
    onAddProduct,
    onShareStore,
    onManageSubscription,
    onActivate,
    stats = {
        totalProducts: { value: 20, addedToday: 5 },
        storeViews: { value: 200, addedToday: 70 },
        whatsappLead: { value: 100, addedToday: 50 },
        likesReceived: { value: 50, addedToday: 20 },
    },
}: Props) {
    const statCards = [
        { label: "Total\nProducts", data: stats.totalProducts, bg: "#EEE9FB", iconBg: "#7B52E8", icon: "▦" },
        { label: "Store\nViews", data: stats.storeViews, bg: "#FDE8E8", iconBg: "#E85252", icon: "👁" },
        { label: "Whatsapp\nLead", data: stats.whatsappLead, bg: "#E5F7EE", iconBg: "#25D366", icon: "💬" },
        { label: "Likes\nReceived", data: stats.likesReceived, bg: "#FEF3E2", iconBg: "#F5A623", icon: "♥" },
    ];

    const tabs = [
        { key: "Home", icon: "⌂" },
        { key: "Products", icon: "🛍" },
        { key: "Insight", icon: "▦" },
        { key: "Profile", icon: "👤" },
    ];
    onAddProduct = () => {
        router.push("/add-Product" as any);
    };
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
                        <Text style={styles.greeting}>Good Morning, Aliyu</Text>
                        <Text style={styles.subGreeting}>Let get your store live and start selling</Text>
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
                            <Text style={styles.avatarText}>👟</Text>
                        </View>
                        <View>
                            <Text style={styles.storeName}>{storeName}</Text>
                            <Text style={styles.storeSub}>{storeCategories}</Text>
                        </View>
                    </View>

                    {/* Active subscription banner */}
                    <View style={styles.activeBanner}>
                        <View style={styles.bannerIconWrap}>
                            <Text style={styles.bannerIcon}>👑</Text>
                        </View>
                        <View style={styles.bannerText}>
                            <Text style={styles.bannerLabel}>Subscription Status</Text>
                            <Text style={styles.activeStatus}>Active</Text>
                            <Text style={styles.renewText}>Renew on {renewDate}</Text>
                        </View>
                        <TouchableOpacity style={styles.manageBtn} onPress={onManageSubscription} activeOpacity={0.8}>
                            <Text style={styles.manageBtnText}>Manage</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Quick Actions ── */}
                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.actionBtn}
                        onPress={onAddProduct} activeOpacity={0.8}>
                        <View style={[styles.actionIcon, { backgroundColor: "#25C16F" }]}>
                            <Text style={styles.actionIconText}>＋</Text>
                        </View>
                        <Text style={styles.actionLabel}>Add Product</Text>
                    </TouchableOpacity>
                    <View style={styles.actionDivider} />
                    <TouchableOpacity style={styles.actionBtn} onPress={onShareStore} activeOpacity={0.8}>
                        <View style={[styles.actionIcon, { backgroundColor: "#FEF0DC" }]}>
                            <Text style={[styles.actionIconText, { color: "#F5A623" }]}>⛓</Text>
                        </View>
                        <Text style={styles.actionLabel}>Share Store</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Store Overview ── */}
                <Text style={styles.sectionTitle}>Store Overview</Text>
                <View style={styles.statsGrid}>
                    {statCards.map((stat) => (
                        <View key={stat.label} style={[styles.statCard, { backgroundColor: stat.bg }]}>
                            <View style={[styles.statIconCircle, { backgroundColor: stat.iconBg }]}>
                                <Text style={styles.statIconText}>{stat.icon}</Text>
                            </View>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <Text style={styles.statValue}>{stat.data.value}</Text>
                            <View style={styles.statFooter}>
                                <Text style={styles.statCheck}>✔</Text>
                                <Text style={styles.statFooterText}>{stat.data.addedToday} added today</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* ── Complete store setup banner ── */}
                <View style={styles.setupBanner}>
                    <View style={styles.setupText}>
                        <Text style={styles.setupTitle}>Complete your store setup</Text>
                        <Text style={styles.setupSub}>You are just a few step away from going live.</Text>
                    </View>
                    <TouchableOpacity style={styles.setupBtn} onPress={onActivate}>
                        <Text style={styles.setupBtnText}>Activate</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            {/* ── Tab Bar ── */}
            <View style={styles.tabBar}>
                {tabs.map((tab, i) => {
                    const isActive = i === 0;
                    return (
                        <TouchableOpacity key={tab.key} style={styles.tabItem} activeOpacity={0.7}>
                            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
                            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.key}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";
const CARD_RADIUS = 18;

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 24 },

    // Header
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingTop: Platform.OS === "android" ? 16 : 8, paddingBottom: 16, gap: 12 },
    iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#FFF", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    menuIcon: { fontSize: 18, color: "#333" },
    headerText: { flex: 1 },
    greeting: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
    subGreeting: { fontSize: 12, color: "#888", marginTop: 1 },
    bellIcon: { fontSize: 18 },
    bellDot: { position: "absolute", top: 7, right: 7, width: 8, height: 8, borderRadius: 4, backgroundColor: "#FF3B30", borderWidth: 1.5, borderColor: "#fff" },

    // Store card
    storeCard: { marginHorizontal: 16, borderRadius: CARD_RADIUS, backgroundColor: PURPLE, padding: 18, marginBottom: 14 },
    storeTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 18 },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#1A0A5E", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.3)" },
    avatarText: { fontSize: 24 },
    storeName: { fontSize: 20, fontWeight: "800", color: "#FFF" },
    storeSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },

    // Active banner
    activeBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 14, padding: 14, gap: 12 },
    bannerIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
    bannerIcon: { fontSize: 18 },
    bannerText: { flex: 1 },
    bannerLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
    activeStatus: { fontSize: 18, fontWeight: "800", color: "#4ADE80", marginTop: 1 },
    renewText: { fontSize: 11, color: "rgba(255,255,255,0.65)", marginTop: 2 },
    manageBtn: { backgroundColor: "#FFF", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
    manageBtnText: { color: PURPLE, fontSize: 12, fontWeight: "800" },

    // Actions
    actionsRow: { marginHorizontal: 16, backgroundColor: "#FFF", borderRadius: CARD_RADIUS, flexDirection: "row", alignItems: "center", paddingVertical: 18, paddingHorizontal: 24, marginBottom: 22, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
    actionIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    actionIconText: { fontSize: 20, color: "#FFF", fontWeight: "700", lineHeight: 24 },
    actionLabel: { fontSize: 14, fontWeight: "600", color: "#1A1A1A" },
    actionDivider: { width: 1, height: 36, backgroundColor: "#EBEBEB", marginHorizontal: 8 },

    // Stats
    sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A1A", paddingHorizontal: 18, marginBottom: 14 },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10, marginBottom: 20 },
    statCard: { width: "47%", borderRadius: 16, padding: 14 },
    statIconCircle: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
    statIconText: { fontSize: 18, color: "#fff" },
    statLabel: { fontSize: 13, color: "#555", fontWeight: "500", lineHeight: 18 },
    statValue: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", marginTop: 4, marginBottom: 6 },
    statFooter: { flexDirection: "row", alignItems: "center", gap: 4 },
    statCheck: { fontSize: 11, color: "#25C16F" },
    statFooterText: { fontSize: 11, color: "#888" },

    // Setup banner
    setupBanner: { marginHorizontal: 16, backgroundColor: "#FFF", borderRadius: CARD_RADIUS, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18, paddingHorizontal: 18, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
    setupText: { flex: 1, marginRight: 12 },
    setupTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A" },
    setupSub: { fontSize: 12, color: "#888", marginTop: 3, lineHeight: 17 },
    setupBtn: { backgroundColor: PURPLE, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 },
    setupBtnText: { color: "#FFF", fontSize: 13, fontWeight: "700" },

    // Tab bar
    tabBar: { flexDirection: "row", backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F0F0F0", paddingBottom: Platform.OS === "ios" ? 20 : 8, paddingTop: 10, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 }, elevation: 8 },
    tabItem: { flex: 1, alignItems: "center", gap: 3 },
    tabIcon: { fontSize: 20, color: "#AAAAAA" },
    tabIconActive: { color: PURPLE },
    tabLabel: { fontSize: 11, color: "#AAAAAA", fontWeight: "500" },
    tabLabelActive: { color: PURPLE, fontWeight: "700" },
});
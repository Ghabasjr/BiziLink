import { useEffect, useState } from "react";
import {
    Animated,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

const PURPLE = "#7B2FE0";
const PURPLE_BG = "#EEE6FF";
const GREEN = "#22C55E";
const GREEN_BG = "#DCFCE7";
const RED_BG = "#FEE2E2";
const RED = "#EF4444";
const ORANGE_BG = "#FEF3C7";

// ── Header ─────────────────────────────────────────────────────────────────────
function Header() {
    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.menuBtn} activeOpacity={0.7}>
                <MenuIcon />
            </TouchableOpacity>
            <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Good Morning, Aliyu</Text>
                <Text style={styles.headerSub}>Let get your store live and start selling</Text>
            </View>
            <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
                <BellIcon />
                <View style={styles.bellBadge}>
                    <Text style={styles.bellBadgeText}>1</Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

function MenuIcon() {
    return (
        <View style={{ gap: 4, paddingHorizontal: 2 }}>
            <View style={styles.menuLine} />
            <View style={[styles.menuLine, { width: 14 }]} />
            <View style={styles.menuLine} />
        </View>
    );
}

function BellIcon() {
    return (
        <View style={{ width: 22, height: 24, alignItems: "center" }}>
            <View style={styles.bellTop} />
            <View style={styles.bellBody} />
            <View style={styles.bellBottom} />
        </View>
    );
}

// ── Business card ──────────────────────────────────────────────────────────────
function BusinessCard() {
    return (
        <View style={styles.bizCard}>
            {/* Top row */}
            <View style={styles.bizTop}>
                <View style={styles.bizLogo}>
                    <Text style={styles.bizLogoText}>👟</Text>
                </View>
                <View style={styles.bizInfo}>
                    <Text style={styles.bizName}>Aliyu Shoes</Text>
                    <Text style={styles.bizLocation}>Kano, Nigeria</Text>
                </View>
            </View>
            {/* Unlock banner */}
            <View style={styles.unlockRow}>
                <View style={styles.unlockIcon}>
                    <Text style={{ fontSize: 18 }}>👑</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.unlockTitle}>Unlock all features</Text>
                    <Text style={styles.unlockSub}>Add product, get views and receive lead</Text>
                    <Text style={styles.unlockPrice}>₦990 / month</Text>
                </View>
                <TouchableOpacity style={styles.activateBtn} activeOpacity={0.85}>
                    <Text style={styles.activateBtnText}>Activate</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

// ── Quick actions ──────────────────────────────────────────────────────────────
function QuickActions() {
    return (
        <View style={styles.quickCard}>
            <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
                <View style={[styles.quickIcon, { backgroundColor: GREEN }]}>
                    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>+</Text>
                </View>
                <Text style={styles.quickText}>Add Product</Text>
            </TouchableOpacity>
            <View style={styles.quickDivider} />
            <TouchableOpacity style={styles.quickBtn} activeOpacity={0.75}>
                <View style={[styles.quickIcon, { backgroundColor: ORANGE_BG }]}>
                    <Text style={{ fontSize: 18 }}>🔗</Text>
                </View>
                <Text style={styles.quickText}>Share Store</Text>
            </TouchableOpacity>
        </View>
    );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
type StatCardProps = {
    icon: string;
    iconBg: string;
    label: string;
    value: number;
};

function StatCard({ icon, iconBg, label, value }: StatCardProps) {
    return (
        <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: iconBg }]}>
                <Text style={{ fontSize: 18 }}>{icon}</Text>
            </View>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <View style={styles.statFooter}>
                <Text style={{ color: GREEN, fontSize: 13 }}>✓ </Text>
                <Text style={styles.statFooterText}>0 added today</Text>
            </View>
        </View>
    );
}

// ── Setup progress ─────────────────────────────────────────────────────────────
function SetupProgress() {
    const [progress] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.timing(progress, {
            toValue: 0.5,
            duration: 900,
            delay: 400,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    return (
        <View style={styles.setupCard}>
            <View style={styles.setupTop}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.setupTitle}>Complete your store setup</Text>
                    <Text style={styles.setupSub}>You are just a few step away from going live.</Text>
                </View>
                <TouchableOpacity style={styles.activateBtnDark} activeOpacity={0.85}>
                    <Text style={styles.activateBtnText}>Activate</Text>
                </TouchableOpacity>
            </View>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <Animated.View
                    style={[
                        styles.progressFill,
                        {
                            width: progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ["0%", "100%"],
                            }),
                        },
                    ]}
                />
            </View>
            <View style={styles.setupFooter}>
                <Text style={styles.setupPercent}>50% completed</Text>
                <Text style={styles.setupPrice}>₦899 / month</Text>
            </View>
        </View>
    );
}

// ── Recent Activity ────────────────────────────────────────────────────────────
function RecentActivity() {
    return (
        <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Recent Activity</Text>
                <TouchableOpacity activeOpacity={0.7}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>
            {/* Empty state */}
            <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                    <Text style={{ fontSize: 28, opacity: 0.4 }}>📋</Text>
                </View>
                <Text style={styles.emptyTitle}>No Activity Yet</Text>
                <Text style={styles.emptySub}>
                    Customer activities will appear here after you activate your account and start sharing your store
                </Text>
            </View>
        </View>
    );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
    const [fadeIn] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.timing(fadeIn, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, [fadeIn]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5FA" />
            <Animated.View style={{ flex: 1, opacity: fadeIn }}>
                <Header />
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    <BusinessCard />
                    <QuickActions />

                    {/* Store overview */}
                    <Text style={styles.sectionTitle}>Store Overview</Text>
                    <View style={styles.statsGrid}>
                        <StatCard icon="📊" iconBg={PURPLE_BG} label={"Total\nProducts"} value={0} />
                        <StatCard icon="👁️" iconBg={RED_BG} label={"Store\nViews"} value={0} />
                        <StatCard icon="💬" iconBg={GREEN_BG} label={"Whatsapp\nLead"} value={0} />
                        <StatCard icon="❤️" iconBg={ORANGE_BG} label={"Likes\nReceived"} value={0} />
                    </View>

                    <SetupProgress />
                    <RecentActivity />

                    <View style={{ height: 32 }} />
                </ScrollView>
            </Animated.View>
        </SafeAreaView>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },

    // Header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: Platform.OS === "android" ? 12 : 6,
        paddingBottom: 12,
        backgroundColor: "#F5F5FA",
    },
    menuBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5EF",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    menuLine: {
        width: 18,
        height: 2,
        backgroundColor: "#1A1A2E",
        borderRadius: 2,
    },
    headerText: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    headerSub: {
        fontSize: 12,
        color: "#9B9BAD",
        marginTop: 1,
    },
    bellBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5EF",
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
    },
    bellTop: {
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#1A1A2E",
        marginBottom: -2,
        zIndex: 1,
    },
    bellBody: {
        width: 18,
        height: 12,
        borderWidth: 2,
        borderColor: "#1A1A2E",
        borderBottomWidth: 0,
        borderTopLeftRadius: 9,
        borderTopRightRadius: 9,
    },
    bellBottom: {
        width: 10,
        height: 3,
        borderWidth: 2,
        borderColor: "#1A1A2E",
        borderTopWidth: 0,
        borderBottomLeftRadius: 4,
        borderBottomRightRadius: 4,
    },
    bellBadge: {
        position: "absolute",
        top: 6,
        right: 6,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: RED,
        alignItems: "center",
        justifyContent: "center",
    },
    bellBadgeText: {
        color: "#fff",
        fontSize: 8,
        fontWeight: "700",
    },

    // Business card
    bizCard: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
    },
    bizTop: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    bizLogo: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#2A0060",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.2)",
    },
    bizLogoText: {
        fontSize: 24,
    },
    bizInfo: {},
    bizName: {
        fontSize: 18,
        fontWeight: "700",
        color: "#fff",
    },
    bizLocation: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    unlockRow: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 14,
        padding: 12,
        gap: 10,
    },
    unlockIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    unlockTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#fff",
    },
    unlockSub: {
        fontSize: 11,
        color: "rgba(255,255,255,0.75)",
        marginTop: 1,
    },
    unlockPrice: {
        fontSize: 11,
        color: "rgba(255,255,255,0.75)",
        marginTop: 2,
    },
    activateBtn: {
        backgroundColor: "#fff",
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    activateBtnDark: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 18,
    },
    activateBtnText: {
        color: PURPLE,
        fontWeight: "700",
        fontSize: 13,
    },

    // Quick actions
    quickCard: {
        flexDirection: "row",
        backgroundColor: "#fff",
        borderRadius: 16,
        marginBottom: 22,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    quickBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 18,
        gap: 10,
    },
    quickIcon: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    quickText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#1A1A2E",
    },
    quickDivider: {
        width: 1,
        backgroundColor: "#F0F0F0",
        marginVertical: 14,
    },

    // Section title
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 14,
    },

    // Stats grid
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        minWidth: "45%",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    statIcon: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 13,
        color: "#6B6B80",
        lineHeight: 18,
    },
    statValue: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A1A2E",
        marginTop: 4,
        marginBottom: 6,
    },
    statFooter: {
        flexDirection: "row",
        alignItems: "center",
    },
    statFooterText: {
        fontSize: 12,
        color: "#9B9BAD",
    },

    // Setup progress
    setupCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    setupTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 14,
        gap: 12,
    },
    setupTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 4,
    },
    setupSub: {
        fontSize: 12,
        color: "#9B9BAD",
        lineHeight: 17,
    },
    progressTrack: {
        height: 7,
        backgroundColor: "#EEE6FF",
        borderRadius: 4,
        overflow: "hidden",
        marginBottom: 8,
    },
    progressFill: {
        height: "100%",
        backgroundColor: PURPLE,
        borderRadius: 4,
    },
    setupFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    setupPercent: {
        fontSize: 12,
        color: PURPLE,
        fontWeight: "600",
    },
    setupPrice: {
        fontSize: 12,
        color: "#9B9BAD",
    },

    // Recent activity
    activityCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 18,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    activityHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    activityTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A2E",
    },
    seeAll: {
        fontSize: 13,
        color: PURPLE,
        fontWeight: "600",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 24,
        paddingHorizontal: 12,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#F5F5FA",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 14,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 8,
    },
    emptySub: {
        fontSize: 13,
        color: "#9B9BAD",
        textAlign: "center",
        lineHeight: 20,
    },
});
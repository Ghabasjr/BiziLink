/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    SafeAreaView,
    Image,
} from "react-native";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const PURPLE = "#6B3FE7";
const CARD_RADIUS = 16;

interface PendingUser {
    id: string;
    fullName: string;
    businessName: string;
    email: string;
    subscriptionStatus: string;
    receiptUrl?: string;
    receiptSubmittedAt?: string;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<PendingUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPendingUsers = async () => {
        try {
            setLoading(true);
            const q = query(collection(db, "users"), where("subscriptionStatus", "==", "pending"));
            const snapshot = await getDocs(q);
            const list: PendingUser[] = [];
            snapshot.forEach((d) => list.push({ id: d.id, ...d.data() } as PendingUser));
            setUsers(list);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const handleActivate = async (userId: string, name: string) => {
        Alert.alert("Activate Account", `Activate ${name}'s subscription?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Activate",
                style: "default",
                onPress: async () => {
                    try {
                        setActionLoading(userId);
                        await updateDoc(doc(db, "users", userId), {
                            subscriptionStatus: "active",
                            activatedAt: new Date().toISOString(),
                        });
                        fetchPendingUsers();
                    } catch (err: any) {
                        Alert.alert("Error", err.message);
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const handleReject = async (userId: string, name: string) => {
        Alert.alert("Reject Payment", `Reject ${name}'s payment?`, [
            { text: "Cancel", style: "cancel" },
            {
                text: "Reject",
                style: "destructive",
                onPress: async () => {
                    try {
                        setActionLoading(userId);
                        await updateDoc(doc(db, "users", userId), {
                            subscriptionStatus: "expired",
                            rejectedAt: new Date().toISOString(),
                        });
                        fetchPendingUsers();
                    } catch (err: any) {
                        Alert.alert("Error", err.message);
                    } finally {
                        setActionLoading(null);
                    }
                },
            },
        ]);
    };

    const renderItem = ({ item }: { item: PendingUser }) => {
        const isActing = actionLoading === item.id;
        const date = item.receiptSubmittedAt
            ? new Date(item.receiptSubmittedAt).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              })
            : "—";

        return (
            <View style={styles.card}>
                {/* User info row */}
                <View style={styles.userRow}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>
                            {item.fullName?.charAt(0).toUpperCase() || "?"}
                        </Text>
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{item.fullName}</Text>
                        <Text style={styles.businessName}>{item.businessName || "—"}</Text>
                        <Text style={styles.email}>{item.email}</Text>
                    </View>
                    <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>Pending</Text>
                    </View>
                </View>

                {/* Submitted date */}
                <View style={styles.divider} />
                <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Submitted:</Text>
                    <Text style={styles.metaValue}>{date}</Text>
                </View>

                {/* Receipt preview */}
                {item.receiptUrl ? (
                    <View style={styles.receiptRow}>
                        <Text style={styles.metaLabel}>Receipt:</Text>
                        <Image
                            source={{ uri: item.receiptUrl }}
                            style={styles.receiptThumb}
                            resizeMode="cover"
                        />
                    </View>
                ) : (
                    <View style={styles.receiptRow}>
                        <Text style={styles.metaLabel}>Receipt:</Text>
                        <Text style={[styles.metaValue, { color: "#E85252" }]}>Not uploaded</Text>
                    </View>
                )}

                {/* Action buttons */}
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.rejectBtn, isActing && { opacity: 0.6 }]}
                        onPress={() => handleReject(item.id, item.fullName)}
                        disabled={isActing}
                        activeOpacity={0.8}
                    >
                        {isActing ? (
                            <ActivityIndicator size="small" color="#E85252" />
                        ) : (
                            <Text style={styles.rejectBtnText}>✕  Reject</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.activateBtn, isActing && { opacity: 0.6 }]}
                        onPress={() => handleActivate(item.id, item.fullName)}
                        disabled={isActing}
                        activeOpacity={0.85}
                    >
                        {isActing ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.activateBtnText}>✓  Activate</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Admin Panel</Text>
                    <Text style={styles.headerSub}>Review pending subscriptions</Text>
                </View>
                <TouchableOpacity style={styles.refreshBtn} onPress={fetchPendingUsers}>
                    <Text style={styles.refreshIcon}>↻</Text>
                </TouchableOpacity>
            </View>

            {/* Stats bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={styles.statNum}>{users.length}</Text>
                    <Text style={styles.statLbl}>Pending</Text>
                </View>
            </View>

            {/* List */}
            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
            ) : users.length === 0 ? (
                <View style={styles.center}>
                    <Text style={styles.emptyIcon}>🎉</Text>
                    <Text style={styles.emptyTitle}>All clear!</Text>
                    <Text style={styles.emptyText}>No pending subscription requests.</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    onRefresh={fetchPendingUsers}
                    refreshing={loading}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },

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
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
    headerSub: { fontSize: 13, color: "rgba(255,255,255,0.75)", marginTop: 2 },
    refreshBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255,255,255,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    refreshIcon: { fontSize: 22, color: "#fff", fontWeight: "700" },

    // Stats bar
    statsBar: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingVertical: 14,
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    statItem: { alignItems: "center" },
    statNum: { fontSize: 24, fontWeight: "800", color: PURPLE },
    statLbl: { fontSize: 12, color: "#888", marginTop: 1 },

    // List
    listContent: { padding: 16, gap: 14, paddingBottom: 32 },

    // Card
    card: {
        backgroundColor: "#fff",
        borderRadius: CARD_RADIUS,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    userRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarLetter: { fontSize: 20, fontWeight: "700", color: "#fff" },
    userInfo: { flex: 1 },
    userName: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
    businessName: { fontSize: 13, color: "#555", marginTop: 1 },
    email: { fontSize: 12, color: "#888", marginTop: 1 },
    pendingBadge: {
        backgroundColor: "#FEF3E2",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: "flex-start",
    },
    pendingBadgeText: { fontSize: 11, fontWeight: "700", color: "#F5A623" },

    divider: { height: 1, backgroundColor: "#F5F5F5", marginVertical: 12 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    receiptRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    metaLabel: { fontSize: 12, color: "#888", fontWeight: "500" },
    metaValue: { fontSize: 13, color: "#1A1A1A", fontWeight: "600" },
    receiptThumb: {
        width: 60,
        height: 60,
        borderRadius: 8,
        backgroundColor: "#F0F0F0",
        borderWidth: 1,
        borderColor: "#E0E0E0",
    },

    // Action buttons
    actionRow: { flexDirection: "row", gap: 10 },
    rejectBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        borderWidth: 1.5,
        borderColor: "#E85252",
        alignItems: "center",
        justifyContent: "center",
    },
    rejectBtnText: { fontSize: 14, fontWeight: "700", color: "#E85252" },
    activateBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    activateBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

    // States
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10 },
    loadingText: { fontSize: 14, color: "#888", marginTop: 8 },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A1A" },
    emptyText: { fontSize: 14, color: "#888" },
});

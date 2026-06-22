/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    TextInput,
    Platform,
    StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { auth, db } from "@/lib/firebase";

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";
const CARD_RADIUS = 16;

export default function ProfileScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [userData, setUserData] = useState<any>(null);

    // editable fields
    const [businessName, setBusinessName] = useState("");
    const [description, setDescription] = useState("");
    const [whatsappNumber, setWhatsappNumber] = useState("");

    const fetchProfile = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            setLoading(true);
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setUserData(data);
                setBusinessName(data.businessName || "");
                setDescription(data.description || "");
                setWhatsappNumber(data.whatsappNumber || "");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchProfile(); }, []);

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            setSaving(true);
            await updateDoc(doc(db, "users", user.uid), {
                businessName,
                description,
                whatsappNumber,
            });
            setUserData((prev: any) => ({ ...prev, businessName, description, whatsappNumber }));
            setEditing(false);
            Alert.alert("Saved!", "Your profile has been updated.");
        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        Alert.alert("Log Out", "Are you sure you want to log out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await signOut(auth);
                    router.replace("/login");
                },
            },
        ]);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, styles.center]}>
                <ActivityIndicator size="large" color={PURPLE} />
            </SafeAreaView>
        );
    }

    const statusColor =
        userData?.subscriptionStatus === "active"
            ? "#25C16F"
            : userData?.subscriptionStatus === "pending"
            ? "#F5A623"
            : "#E85252";

    const statusLabel =
        userData?.subscriptionStatus === "active"
            ? "Active"
            : userData?.subscriptionStatus === "pending"
            ? "Pending Verification"
            : "Expired";

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Profile</Text>
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => (editing ? handleSave() : setEditing(true))}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.editBtnText}>{editing ? "Save" : "Edit"}</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Avatar + name */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarLetter}>
                            {userData?.businessName?.charAt(0)?.toUpperCase() || "B"}
                        </Text>
                    </View>
                    <Text style={styles.businessNameText}>{userData?.businessName || "Your Store"}</Text>
                    <Text style={styles.slugText}>bizilink.ng/store/{userData?.storeSlug}</Text>

                    {/* Subscription badge */}
                    <View style={[styles.subBadge, { backgroundColor: statusColor + "20" }]}>
                        <View style={[styles.subDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.subBadgeText, { color: statusColor }]}>{statusLabel}</Text>
                    </View>
                </View>

                {/* Profile fields card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Business Info</Text>

                    <Field
                        label="Business Name"
                        value={businessName}
                        editing={editing}
                        onChangeText={setBusinessName}
                        icon="🏪"
                    />
                    <Field
                        label="WhatsApp Number"
                        value={whatsappNumber}
                        editing={editing}
                        onChangeText={setWhatsappNumber}
                        icon="💬"
                        keyboardType="phone-pad"
                    />
                    <Field
                        label="Description"
                        value={description}
                        editing={editing}
                        onChangeText={setDescription}
                        icon="📝"
                        multiline
                        last
                    />
                </View>

                {/* Account info card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Account</Text>
                    <InfoRow icon="👤" label="Full Name" value={userData?.fullName || "—"} />
                    <InfoRow icon="✉️" label="Email" value={userData?.email || "—"} />
                    <InfoRow
                        icon="📍"
                        label="Location"
                        value={[userData?.state, userData?.country].filter(Boolean).join(", ") || "—"}
                        last
                    />
                </View>

                {/* Subscription card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Subscription</Text>
                    <InfoRow icon="💳" label="Status" value={statusLabel} valueColor={statusColor} />
                    <InfoRow icon="💰" label="Plan" value="₦800 / month" last />
                </View>

                {/* Actions */}
                {userData?.subscriptionStatus !== "active" && (
                    <TouchableOpacity
                        style={styles.activateBtn}
                        onPress={() => router.push("/payment")}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.activateBtnText}>👑  Activate Subscription</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity
                    style={styles.storeBtn}
                    onPress={() => router.push(`/store/${userData?.storeSlug}` as any)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.storeBtnText}>🔗  View My Store</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                    <Text style={styles.logoutBtnText}>Log Out</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ---------- Sub-components ----------

function Field({
    label, value, editing, onChangeText, icon, multiline, last, keyboardType,
}: {
    label: string; value: string; editing: boolean;
    onChangeText: (t: string) => void; icon: string;
    multiline?: boolean; last?: boolean; keyboardType?: any;
}) {
    return (
        <View style={[fieldStyles.row, !last && fieldStyles.rowBorder]}>
            <View style={fieldStyles.iconWrap}>
                <Text style={fieldStyles.icon}>{icon}</Text>
            </View>
            <View style={fieldStyles.textWrap}>
                <Text style={fieldStyles.label}>{label}</Text>
                {editing ? (
                    <TextInput
                        style={[fieldStyles.input, multiline && { height: 70 }]}
                        value={value}
                        onChangeText={onChangeText}
                        multiline={multiline}
                        keyboardType={keyboardType}
                        placeholderTextColor="#aaa"
                        placeholder={`Enter ${label.toLowerCase()}`}
                    />
                ) : (
                    <Text style={fieldStyles.value}>{value || "—"}</Text>
                )}
            </View>
        </View>
    );
}

function InfoRow({ icon, label, value, valueColor, last }: {
    icon: string; label: string; value: string;
    valueColor?: string; last?: boolean;
}) {
    return (
        <View style={[fieldStyles.row, !last && fieldStyles.rowBorder]}>
            <View style={fieldStyles.iconWrap}>
                <Text style={fieldStyles.icon}>{icon}</Text>
            </View>
            <View style={fieldStyles.textWrap}>
                <Text style={fieldStyles.label}>{label}</Text>
                <Text style={[fieldStyles.value, valueColor ? { color: valueColor } : {}]}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

const fieldStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 13,
        gap: 12,
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: "#F5F5F5" },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    icon: { fontSize: 16 },
    textWrap: { flex: 1 },
    label: { fontSize: 12, color: "#888", fontWeight: "500", marginBottom: 2 },
    value: { fontSize: 14, color: "#1A1A1A", fontWeight: "600" },
    input: {
        fontSize: 14,
        color: "#1A1A1A",
        borderWidth: 1,
        borderColor: PURPLE,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: PURPLE_LIGHT,
    },
});

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    center: { justifyContent: "center", alignItems: "center" },
    header: {
        backgroundColor: PURPLE,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 18,
    },
    headerTitle: { fontSize: 20, fontWeight: "800", color: "#fff" },
    editBtn: {
        backgroundColor: "rgba(255,255,255,0.2)",
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.4)",
        minWidth: 60,
        alignItems: "center",
    },
    editBtnText: { fontSize: 14, fontWeight: "700", color: "#fff" },

    content: { padding: 16, gap: 14, paddingBottom: 40 },

    // Avatar section
    avatarSection: { alignItems: "center", paddingVertical: 10, gap: 6 },
    avatarCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 6,
    },
    avatarLetter: { fontSize: 34, fontWeight: "800", color: "#fff" },
    businessNameText: { fontSize: 20, fontWeight: "800", color: "#1A1A1A", marginTop: 4 },
    slugText: { fontSize: 12, color: "#888" },
    subBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        marginTop: 4,
    },
    subDot: { width: 8, height: 8, borderRadius: 4 },
    subBadgeText: { fontSize: 13, fontWeight: "700" },

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
    cardTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#888",
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: 4,
    },

    // Buttons
    activateBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
        elevation: 5,
    },
    activateBtnText: { fontSize: 15, fontWeight: "800", color: "#fff" },
    storeBtn: {
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: PURPLE,
        backgroundColor: PURPLE_LIGHT,
    },
    storeBtnText: { fontSize: 15, fontWeight: "700", color: PURPLE },
    logoutBtn: {
        borderRadius: 30,
        paddingVertical: 15,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
        backgroundColor: "#fff",
    },
    logoutBtnText: { fontSize: 15, fontWeight: "600", color: "#E85252" },
});

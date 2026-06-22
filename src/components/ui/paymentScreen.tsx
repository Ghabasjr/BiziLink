import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Clipboard,
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
    amount?: string;
    accountName?: string;
    bankName?: string;
    accountNo?: string;
    onSubmit?: (receipt: string | null) => void;
    onBackToHome?: () => void;
    isSubmitting?: boolean;
}

export default function PaymentScreen({
    amount = "₦800",
    accountName = "Bizilink Tech Ng",
    bankName = "Access Bank, Plc",
    accountNo = "1221244910",
    onSubmit,
    onBackToHome,
    isSubmitting = false,
}: Props) {
    const [receiptUri, setReceiptUri] = useState<string | null>(null);

    const handleCopyDetails = () => {
        const details = `Account Name: ${accountName}\nBank Name: ${bankName}\nAccount No: ${accountNo}`;
        Clipboard.setString(details);
        Alert.alert("Copied!", "Bank details copied to clipboard.");
    };

    const handlePickReceipt = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow access to your photo library.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setReceiptUri(result.assets[0].uri);
        }
    };

    const handleSubmit = () => {
        if (!receiptUri) {
            Alert.alert("Receipt required", "Please upload your payment receipt before submitting.");
            return;
        }
        onSubmit?.(receiptUri);
    };

    const paymentRows = [
        { icon: "🏦", label: "Account Name:", value: accountName },
        { icon: "💰", label: "Bank Name:", value: bankName },
        { icon: "💳", label: "Account No.", value: accountNo },
    ];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#5B2ECC" />

            {/* ── Subscription Amount Banner ── */}
            <View style={styles.amountBanner}>
                <Text style={styles.amountLabel}>Subscription Amount</Text>
                <View style={styles.amountRow}>
                    <Text style={styles.amountValue}>{amount}</Text>
                    <Text style={styles.amountPer}> / month</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Payment Details Card ── */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardIconCircle}>
                            <Text style={styles.cardIconText}>🏛</Text>
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>Payment Details</Text>
                            <Text style={styles.cardSub}>Send the payment to the details below</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.paymentRows}>
                        {paymentRows.map((row, i) => (
                            <View
                                key={row.label}
                                style={[
                                    styles.paymentRow,
                                    i < paymentRows.length - 1 && styles.paymentRowBorder,
                                ]}
                            >
                                <View style={styles.paymentRowLeft}>
                                    <View style={styles.rowIconCircle}>
                                        <Text style={styles.rowIconText}>{row.icon}</Text>
                                    </View>
                                    <Text style={styles.rowLabel}>{row.label}</Text>
                                </View>
                                <Text style={styles.rowValue} numberOfLines={1}>{row.value}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.copyBtn} onPress={handleCopyDetails} activeOpacity={0.8}>
                        <Text style={styles.copyBtnIcon}>⧉</Text>
                        <Text style={styles.copyBtnText}>Copy Details</Text>
                    </TouchableOpacity>
                </View>

                {/* ── Instruction ── */}
                <Text style={styles.instruction}>
                    Copy the account the details above and Pay {amount}, upload your receipt, and our team
                    will verify and activate your subscription.
                </Text>

                {/* ── Upload Receipt Card ── */}
                <View style={styles.uploadCard}>
                    <Text style={styles.uploadTitle}>Please, upload your payment{"\n"}receipt here</Text>

                    <TouchableOpacity
                        style={[styles.uploadZone, receiptUri && styles.uploadZoneFilled]}
                        onPress={handlePickReceipt}
                        activeOpacity={0.7}
                    >
                        {receiptUri ? (
                            <Text style={styles.uploadDoneText}>✓ Receipt selected</Text>
                        ) : (
                            <>
                                <View style={styles.cloudIconWrap}>
                                    <Text style={styles.cloudIcon}>☁</Text>
                                    <Text style={styles.cloudArrow}>↑</Text>
                                </View>
                                <Text style={styles.uploadZoneText}>Upload your receipt</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* ── Footer ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                    onPress={handleSubmit}
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                >
                    <Text style={styles.submitBtnText}>
                        {isSubmitting ? "Submitting..." : "Submit Receipt"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={onBackToHome}
                    activeOpacity={0.8}
                    disabled={isSubmitting}
                >
                    <Text style={styles.backBtnText}>Back to Home</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";
const CARD_RADIUS = 16;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },

    // Amount Banner
    amountBanner: {
        backgroundColor: PURPLE,
        paddingHorizontal: 22,
        paddingTop: Platform.OS === "android" ? 20 : 14,
        paddingBottom: 24,
    },
    amountLabel: {
        fontSize: 13,
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
        marginBottom: 4,
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "flex-end",
    },
    amountValue: {
        fontSize: 36,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },
    amountPer: {
        fontSize: 16,
        fontWeight: "500",
        color: "rgba(255,255,255,0.75)",
        marginBottom: 5,
        marginLeft: 3,
    },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingBottom: 8,
        gap: 14,
    },

    // Payment Details Card
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 16,
    },
    cardIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    cardIconText: { fontSize: 20 },
    cardTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#1A1A1A",
    },
    cardSub: {
        fontSize: 12,
        color: "#888",
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginBottom: 14,
    },

    // Payment rows
    paymentRows: {
        marginBottom: 16,
    },
    paymentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 13,
    },
    paymentRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F5F5F5",
    },
    paymentRowLeft: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    rowIconCircle: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    rowIconText: { fontSize: 15 },
    rowLabel: {
        fontSize: 13,
        color: "#555",
        fontWeight: "500",
    },
    rowValue: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1A1A1A",
        maxWidth: 160,
    },

    // Copy button
    copyBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 13,
        gap: 8,
        marginTop: 4,
    },
    copyBtnIcon: {
        fontSize: 16,
        color: PURPLE,
    },
    copyBtnText: {
        fontSize: 14,
        fontWeight: "700",
        color: PURPLE,
    },

    // Instruction
    instruction: {
        fontSize: 13,
        color: "#666",
        lineHeight: 20,
        paddingHorizontal: 2,
    },

    // Upload Card
    uploadCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: CARD_RADIUS,
        padding: 18,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    uploadTitle: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
        lineHeight: 21,
        marginBottom: 14,
    },
    uploadZone: {
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderStyle: "dashed",
        borderRadius: 12,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 32,
        gap: 8,
    },
    uploadZoneFilled: {
        backgroundColor: "#E8F5E9",
        borderColor: "#25C16F",
    },
    cloudIconWrap: {
        position: "relative",
        width: 48,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    cloudIcon: {
        fontSize: 38,
        color: PURPLE,
        lineHeight: 42,
    },
    cloudArrow: {
        position: "absolute",
        bottom: 0,
        fontSize: 15,
        fontWeight: "900",
        color: PURPLE,
    },
    uploadZoneText: {
        fontSize: 13,
        color: PURPLE,
        fontWeight: "600",
    },
    uploadDoneText: {
        fontSize: 14,
        color: "#25C16F",
        fontWeight: "700",
    },

    // Footer
    footer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 28 : 16,
        gap: 10,
        backgroundColor: "#F7F7F9",
    },
    submitBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    submitBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    backBtn: {
        borderRadius: 30,
        paddingVertical: 16,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: "#E0E0E0",
        backgroundColor: "#FFFFFF",
    },
    backBtnText: {
        color: PURPLE,
        fontSize: 15,
        fontWeight: "700",
    },
});
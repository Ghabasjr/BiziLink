import { AppButton } from "@/components/ui/app-button";
import { AppTextInput } from "@/components/ui/app-text-input";
import { useState } from "react";
import {
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";


interface Props {
    onBack?: () => void;
    onContinue?: (value: string) => void;
}

export default function ForgotPasswordScreen({ onBack, onContinue }: Props) {
    const [value, setValue] = useState("");

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F8" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backIcon} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backIconText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Forgot Password</Text>
                {/* spacer keeps title centered */}
                <View style={styles.backIcon} />
            </View>

            {/* ── Body ── */}
            <View style={styles.body}>
                {/* Icon circle */}
                <View style={styles.iconCircle}>
                    {/* Document with check — drawn with nested Views + Text */}
                    <View style={styles.docIcon}>
                        {/* document body */}
                        <View style={styles.docBody}>
                            {/* lines on doc */}
                            <View style={[styles.docLine, { width: 18, marginTop: 6 }]} />
                            <View style={[styles.docLine, { width: 14, marginTop: 4 }]} />
                        </View>
                        {/* check badge */}
                        <View style={styles.checkBadge}>
                            <Text style={styles.checkMark}>✓</Text>
                        </View>
                    </View>
                </View>

                {/* Heading */}
                <Text style={styles.title}>Retrieve your password</Text>
                <Text style={styles.subtitle}>Let help you retrieve your password</Text>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Input */}
                <AppTextInput
                    style={styles.input}
                    placeholder="Email/Phone number"
                    placeholderTextColor="#AAAAAA"
                    value={value}
                    onChangeText={setValue}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* ── Footer ── */}
            <View style={styles.footer}>
                {/* <TouchableOpacity
                    style={[styles.continueBtn, !value && styles.continueBtnDisabled]}
                    onPress={() => value && onContinue?.(value)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity> */}
                <AppButton title="Continue" />

                <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "rgba(107,63,231,0.12)";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5F8",
    },

    // ── Header ─
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 12,
        backgroundColor: "#F5F5F8",
    },
    backIcon: {
        width: 38,
        height: 38,
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
    backIconText: {
        fontSize: 24,
        color: "#333",
        lineHeight: 28,
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "600",
        color: "#1A1A1A",
        letterSpacing: 0.2,
    },

    // ── Body ────
    body: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 24,
        paddingTop: 40,
    },

    // Icon circle
    iconCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 2,
        borderColor: PURPLE,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    docIcon: {
        width: 36,
        height: 40,
        position: "relative",
    },
    docBody: {
        width: 30,
        height: 36,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: PURPLE,
        backgroundColor: "#fff",
        paddingHorizontal: 5,
        position: "absolute",
        left: 0,
        top: 4,
    },
    docLine: {
        height: 2.5,
        borderRadius: 2,
        backgroundColor: PURPLE_LIGHT,
    },
    checkBadge: {
        position: "absolute",
        right: -4,
        bottom: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
    },
    checkMark: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        lineHeight: 13,
    },

    // Text
    title: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1A1A1A",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#888888",
        textAlign: "center",
        marginBottom: 24,
    },

    divider: {
        width: "70%",
        height: 1,
        backgroundColor: "#E0E0E0",
        marginBottom: 32,
    },

    // Input
    input: {
        width: "100%",
        height: 56,
        borderRadius: 12,
        backgroundColor: "#EBEBEB",
        paddingHorizontal: 18,
        fontSize: 15,
        color: "#1A1A1A",
    },

    // ── Footer ──
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === "android" ? 28 : 16,
        alignItems: "center",
        gap: 14,
    },
    continueBtn: {
        width: "100%",
        height: 58,
        borderRadius: 999,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    continueBtnDisabled: {
        opacity: 0.7,
    },
    continueBtnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    backText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#1A1A1A",
        paddingVertical: 4,
    },
});
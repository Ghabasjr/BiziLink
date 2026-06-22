import { useEffect, useState } from "react";
import {
    Animated,
    Platform,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
    onGoHome?: () => void;
}

export default function PaymentSuccessScreen({ onGoHome }: Props) {
    const [scaleAnim] = useState(() => new Animated.Value(0));
    const [fadeAnim] = useState(() => new Animated.Value(0));
    const [sparkleAnim] = useState(() => new Animated.Value(0));

    useEffect(() => {
        // Circle pop-in
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Text + button fade-in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            delay: 350,
            useNativeDriver: true,
        }).start();

        // Sparkle gentle pulse loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(sparkleAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
                Animated.timing(sparkleAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
            ])
        ).start();
    }, [scaleAnim, fadeAnim, sparkleAnim]);

    const sparkleOpacity = sparkleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 1],
    });

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5F8" />

            {/* ── Illustration ── */}
            <View style={styles.illustrationWrap}>

                {/* Sparkle decorations */}
                <Animated.View style={[styles.sparkleRing, { opacity: sparkleOpacity }]}>
                    {/* top-left small circle */}
                    <View style={[styles.dot, { top: 30, left: 55, width: 8, height: 8 }]} />
                    {/* top-right dash */}
                    <View style={[styles.dash, { top: 34, right: 32, transform: [{ rotate: "45deg" }] }]} />
                    {/* right dot */}
                    <View style={[styles.dot, { top: "44%", right: 16, width: 6, height: 6 }]} />
                    {/* bottom-right dot */}
                    <View style={[styles.dot, { bottom: 44, right: 48, width: 7, height: 7 }]} />
                    {/* bottom-left dash */}
                    <View style={[styles.dash, { bottom: 38, left: 34, transform: [{ rotate: "-45deg" }] }]} />
                    {/* left star */}
                    <Text style={[styles.star, { left: 12, top: "40%" }]}>✦</Text>
                    {/* top-right star */}
                    <Text style={[styles.star, { top: 56, right: 52 }]}>✦</Text>
                    {/* bottom-center small star */}
                    <Text style={[styles.star, { bottom: 60, left: "46%", fontSize: 8 }]}>✦</Text>
                </Animated.View>

                {/* Main check circle */}
                <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
                    <Text style={styles.checkMark}>✓</Text>
                </Animated.View>

                {/* Ground shadow ellipse */}
                <View style={styles.ellipse} />
            </View>

            {/* ── Text + CTA ── */}
            <Animated.View style={[styles.bottom, { opacity: fadeAnim }]}>
                <Text style={styles.title}>Payment Submitted</Text>
                <Text style={styles.subtitle}>
                    Your receipt has been received. Our admin will verify your payment and activate your
                    account shortly.
                </Text>

                <TouchableOpacity style={styles.btn} onPress={onGoHome} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Go to Home</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5F8",
    },

    // Illustration container
    illustrationWrap: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    // Sparkle container — same size as the decorative area around the circle
    sparkleRing: {
        position: "absolute",
        width: 270,
        height: 270,
        alignItems: "center",
        justifyContent: "center",
    },

    // Reusable sparkle shapes
    dot: {
        position: "absolute",
        borderRadius: 99,
        backgroundColor: PURPLE,
    },
    dash: {
        position: "absolute",
        width: 18,
        height: 4,
        borderRadius: 2,
        backgroundColor: PURPLE,
    },
    star: {
        position: "absolute",
        fontSize: 13,
        color: PURPLE,
        fontWeight: "700",
    },

    // Purple check circle
    checkCircle: {
        width: 132,
        height: 132,
        borderRadius: 66,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 10 },
        elevation: 12,
        zIndex: 1,
    },
    checkMark: {
        fontSize: 60,
        color: "#FFFFFF",
        fontWeight: "900",
        lineHeight: 72,
        marginTop: 6,
    },

    // Ellipse ground shadow
    ellipse: {
        width: 108,
        height: 14,
        borderRadius: 54,
        backgroundColor: "rgba(107,63,231,0.14)",
        marginTop: 18,
    },

    // Bottom section
    bottom: {
        paddingHorizontal: 28,
        paddingBottom: Platform.OS === "ios" ? 44 : 30,
        alignItems: "center",
    },
    title: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1A1A1A",
        textAlign: "center",
        marginBottom: 14,
    },
    subtitle: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 40,
        maxWidth: 290,
    },
    btn: {
        width: "100%",
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 7 },
        elevation: 8,
    },
    btnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});
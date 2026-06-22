import { AppButton } from "@/components/ui/app-button";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import {
    Animated,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PURPLE = "#7B2FE0";
const PURPLE_LIGHT = "#EEE6FF";
const BG = "#F0EBFF";

// ── Badge icon (shield/star shape via borderRadius trick) ──────────────────────
function BadgeIcon() {
    const [scale] = useState(() => new Animated.Value(0.4));
    const [opacity] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        ]).start();
    }, [scale, opacity]);

    return (
        <Animated.View style={[styles.badgeContainer, { opacity, transform: [{ scale }] }]}>
            {/* Decorative dots & dashes */}
            <View style={[styles.dot, { top: 8, left: 28 }]} />
            <View style={[styles.dot, { top: 18, right: 16 }]} />
            <View style={[styles.dot, { bottom: 20, right: 30 }]} />
            <View style={[styles.dot, { bottom: 10, left: 18 }]} />
            <View style={[styles.dash, { top: 14, right: 38, transform: [{ rotate: "70deg" }] }]} />
            <View style={[styles.dash, { bottom: 22, left: 38, transform: [{ rotate: "70deg" }] }]} />

            {/* Sparkles */}
            <Sparkle style={{ top: 30, left: 10 }} size={10} />
            <Sparkle style={{ top: 30, right: 10 }} size={10} />
            <Sparkle style={{ bottom: 28, left: 16 }} size={7} />

            {/* Badge shape */}
            <View style={styles.badge}>
                {/* Checkmark */}
                <View style={styles.checkLeft} />
                <View style={styles.checkRight} />
            </View>

            {/* Shadow */}
            <View style={styles.badgeShadow} />
        </Animated.View>
    );
}

function Sparkle({ style, size }: { style: object; size: number }) {
    return (
        <View style={[{ position: "absolute", width: size, height: size }, style]}>
            <View style={{ position: "absolute", width: size, height: size * 0.22, top: size * 0.39, backgroundColor: PURPLE, borderRadius: 2 }} />
            <View style={{ position: "absolute", width: size * 0.22, height: size, left: size * 0.39, top: 0, backgroundColor: PURPLE, borderRadius: 2 }} />
        </View>
    );
}

// ── Feature row ────────────────────────────────────────────────────────────────
type FeatureProps = { icon: string; title: string; subtitle: string; last?: boolean };

function FeatureRow({ icon, title, subtitle, last }: FeatureProps) {
    return (
        <View style={[styles.featureRow, !last && styles.featureRowBorder]}>
            <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{icon}</Text>
            </View>
            <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
            <Text style={styles.featureCheck}>✓</Text>
        </View>
    );
}

// ── Main Screen ────────────────────────────────────────────────────────────────
export default function BusinessRegisteredScreen() {
    const [textOpacity] = useState(() => new Animated.Value(0));
    const [textY] = useState(() => new Animated.Value(18));
    const [cardOpacity] = useState(() => new Animated.Value(0));
    const [cardY] = useState(() => new Animated.Value(18));
    const [btnOpacity] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.timing(textOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(textY, { toValue: 0, friction: 7, useNativeDriver: true }),
            ]),
            Animated.parallel([
                Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(cardY, { toValue: 0, friction: 7, useNativeDriver: true }),
            ]),
            Animated.timing(btnOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
    }, [textOpacity, textY, cardOpacity, cardY, btnOpacity]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={BG} />
            <ScrollView
                contentContainerStyle={styles.scroll}
                showsVerticalScrollIndicator={false}
            >
                {/* Badge illustration */}
                <BadgeIcon />

                {/* Headline */}
                <Animated.View style={[styles.headlineWrap, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
                    <Text style={styles.headlineBlack}>Your Business is</Text>
                    <Text style={styles.headlinePurple}>Registered</Text>
                    <Text style={styles.headlineSub}>
                        You are all set! To start adding product and share your catalog. Activate your account.
                    </Text>
                </Animated.View>

                {/* Subscription card */}
                <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}>
                    {/* Card header */}
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Text style={styles.cardTitle}>Access Everything{"\n"}With BiziLink</Text>
                            <Text style={styles.cardDesc}>Get access to all features and{"\n"}grow your business with ease</Text>
                        </View>
                        <View style={styles.priceBadge}>
                            <Text style={styles.priceAmount}>₦1500</Text>
                            <Text style={styles.pricePer}>Per month</Text>
                        </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Features */}
                    <FeatureRow
                        icon="🛍️"
                        title="Add Unlimited Products"
                        subtitle="Showcase all your products"
                    />
                    <FeatureRow
                        icon="🔗"
                        title="Get Unique Store Link"
                        subtitle="Share your catalog with anyone"
                    />
                    <FeatureRow
                        icon="📊"
                        title="Track Views & Customer Interest"
                        subtitle="See how customers engage with your store"
                        last
                    />
                </Animated.View>

                {/* How it works hint */}
                <Animated.View style={[styles.howRow, { opacity: cardOpacity }]}>
                    <View style={styles.howIconWrap}>
                        <Text style={styles.howIcon}>ℹ</Text>
                    </View>
                    <View>
                        <Text style={styles.howTitle}>How It Work</Text>
                        <Text style={styles.howSub}>Pay ₦899 now to activate your account</Text>
                    </View>
                </Animated.View>

                {/* Spacer */}
                <View style={{ height: 24 }} />
            </ScrollView>

            {/* Footer buttons */}
            <Animated.View style={[styles.footer, { opacity: btnOpacity }]}>
                <AppButton title="Proceed to Pay" onPress={() => router.push('/payment')} />
                <TouchableOpacity style={styles.laterBtn} onPress={() => router.push('/(tabs)/index' as any)} activeOpacity={0.7}>
                    <Text style={styles.laterText}>May be later</Text>
                </TouchableOpacity>
            </Animated.View>
        </SafeAreaView>
    );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: BG,
    },
    scroll: {
        flexGrow: 1,
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 36,
        paddingBottom: 16,
    },

    // Badge
    badgeContainer: {
        width: 180,
        height: 180,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    badge: {
        width: 110,
        height: 110,
        backgroundColor: PURPLE,
        borderRadius: 28,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ rotate: "0deg" }],
        // squircle-ish via shadow for depth
        shadowColor: "#5B00CC",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 12,
        // notched shape via extra corners — approximated with scaleX
    },
    badgeShadow: {
        position: "absolute",
        bottom: 10,
        width: 80,
        height: 12,
        borderRadius: 50,
        backgroundColor: "#C9A0F5",
        opacity: 0.3,
    },
    checkLeft: {
        position: "absolute",
        width: 5,
        height: 22,
        backgroundColor: "white",
        borderRadius: 3,
        bottom: 34,
        left: 34,
        transform: [{ rotate: "45deg" }],
    },
    checkRight: {
        position: "absolute",
        width: 5,
        height: 36,
        backgroundColor: "white",
        borderRadius: 3,
        bottom: 32,
        right: 28,
        transform: [{ rotate: "-40deg" }],
    },
    dot: {
        position: "absolute",
        width: 6,
        height: 6,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: PURPLE,
        backgroundColor: "transparent",
    },
    dash: {
        position: "absolute",
        width: 14,
        height: 3,
        backgroundColor: PURPLE,
        borderRadius: 2,
    },

    // Headline
    headlineWrap: {
        alignItems: "center",
        marginBottom: 24,
        paddingHorizontal: 12,
    },
    headlineBlack: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1A1A2E",
        textAlign: "center",
    },
    headlinePurple: {
        fontSize: 24,
        fontWeight: "700",
        color: PURPLE,
        textAlign: "center",
        marginBottom: 12,
    },
    headlineSub: {
        fontSize: 14,
        color: "#888",
        textAlign: "center",
        lineHeight: 22,
    },

    // Card
    card: {
        width: "100%",
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 20,
        marginBottom: 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    cardHeaderLeft: {
        flex: 1,
        paddingRight: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 6,
        lineHeight: 22,
    },
    cardDesc: {
        fontSize: 12,
        color: "#9B9BAD",
        lineHeight: 18,
    },
    priceBadge: {
        backgroundColor: PURPLE_LIGHT,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        minWidth: 90,
    },
    priceAmount: {
        fontSize: 20,
        fontWeight: "700",
        color: PURPLE,
    },
    pricePer: {
        fontSize: 11,
        color: PURPLE,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: "#F0F0F0",
        marginBottom: 4,
    },

    // Feature rows
    featureRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
    },
    featureRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F4F4F4",
    },
    featureIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    featureIcon: {
        fontSize: 18,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 13,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 2,
    },
    featureSubtitle: {
        fontSize: 12,
        color: "#9B9BAD",
    },
    featureCheck: {
        fontSize: 16,
        color: PURPLE,
        fontWeight: "700",
        marginLeft: 8,
    },

    // How it works
    howRow: {
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        gap: 12,
    },
    howIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: "#D0C0F0",
        alignItems: "center",
        justifyContent: "center",
    },
    howIcon: {
        fontSize: 14,
        color: PURPLE,
    },
    howTitle: {
        fontSize: 13,
        fontWeight: "600",
        color: "#1A1A2E",
        marginBottom: 2,
    },
    howSub: {
        fontSize: 12,
        color: "#9B9BAD",
    },

    // Footer
    footer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === "ios" ? 12 : 24,
        paddingTop: 10,
        backgroundColor: BG,
        gap: 10,
    },
    laterBtn: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 50,
        borderWidth: 1.5,
        borderColor: "#E5D8FF",
        backgroundColor: "#fff",
    },
    laterText: {
        fontSize: 15,
        fontWeight: "600",
        color: PURPLE,
    },
});
import { useEffect, useState } from "react";
import {
    Animated,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Sparkle positions around the circle
const SPARKLES = [
    { top: -30, left: 10, size: 8, delay: 0 },
    { top: -10, right: -20, size: 5, delay: 100 },
    { top: 20, right: -35, size: 6, delay: 200 },
    { bottom: -10, right: -10, size: 5, delay: 300 },
    { bottom: -30, left: 20, size: 8, delay: 150 },
    { bottom: 10, left: -35, size: 6, delay: 250 },
    { top: 10, left: -30, size: 5, delay: 50 },
];

// Dashes around the circle
const DASHES = [
    { top: -45, left: 60, rotate: "0deg", delay: 80 },
    { top: 5, right: -50, rotate: "90deg", delay: 180 },
    { bottom: -40, right: 50, rotate: "0deg", delay: 280 },
    { bottom: 10, left: -48, rotate: "90deg", delay: 130 },
];

function Sparkle({
    style,
    size,
    delay,
}: {
    style: object;
    size: number;
    delay: number;
}) {
    const [opacity] = useState(() => new Animated.Value(0));
    const [scale] = useState(() => new Animated.Value(0.3));

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.parallel([
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [opacity, scale, delay]);

    return (
        <Animated.View
            style={[
                styles.sparkle,
                style,
                { width: size, height: size, opacity, transform: [{ scale }] },
            ]}
        >
            {/* 4-pointed star shape */}
            <View
                style={[
                    styles.starArm,
                    { width: size, height: size * 0.25, top: size * 0.375 },
                ]}
            />
            <View
                style={[
                    styles.starArm,
                    {
                        width: size * 0.25,
                        height: size,
                        left: size * 0.375,
                        top: 0,
                    },
                ]}
            />
        </Animated.View>
    );
}

function Dash({ style, rotate, delay }: { style: object; rotate: string; delay: number }) {
    const [opacity] = useState(() => new Animated.Value(0));

    useEffect(() => {
        Animated.sequence([
            Animated.delay(delay),
            Animated.timing(opacity, {
                toValue: 0.7,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, [opacity, delay]);

    return (
        <Animated.View
            style={[
                styles.dash,
                style,
                { opacity, transform: [{ rotate }] },
            ]}
        />
    );
}

export default function AccountCreatedScreen() {
    // Animations
    const [circleScale] = useState(() => new Animated.Value(0));
    const [circleOpacity] = useState(() => new Animated.Value(0));
    const [checkOpacity] = useState(() => new Animated.Value(0));
    const [shadowScale] = useState(() => new Animated.Value(0));
    const [textOpacity] = useState(() => new Animated.Value(0));
    const [textTranslateY] = useState(() => new Animated.Value(20));
    const [buttonOpacity] = useState(() => new Animated.Value(0));
    const [buttonTranslateY] = useState(() => new Animated.Value(20));

    useEffect(() => {
        Animated.sequence([
            // Circle pops in
            Animated.parallel([
                Animated.spring(circleScale, {
                    toValue: 1,
                    friction: 5,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(circleOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(shadowScale, {
                    toValue: 1,
                    friction: 6,
                    useNativeDriver: true,
                }),
            ]),
            // Checkmark fades in
            Animated.timing(checkOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
            // Text slides up
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                }),
                Animated.spring(textTranslateY, {
                    toValue: 0,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
            // Button slides up
            Animated.parallel([
                Animated.timing(buttonOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(buttonTranslateY, {
                    toValue: 0,
                    friction: 7,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [
        circleScale,
        circleOpacity,
        checkOpacity,
        shadowScale,
        textOpacity,
        textTranslateY,
        buttonOpacity,
        buttonTranslateY,
    ]);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5FA" />
            <View style={styles.container}>
                {/* Illustration area */}
                <View style={styles.illustrationArea}>
                    {/* Shadow ellipse */}
                    <Animated.View
                        style={[styles.shadow, { transform: [{ scaleX: shadowScale }] }]}
                    />

                    {/* Outer circle container for decorations */}
                    <View style={styles.decorContainer}>
                        {/* Sparkles */}
                        {SPARKLES.map((s, i) => {
                            const { size, delay, ...pos } = s;
                            return (
                                <Sparkle key={i} style={pos} size={size} delay={delay} />
                            );
                        })}

                        {/* Dashes */}
                        {DASHES.map((d, i) => {
                            const { rotate, delay, ...pos } = d;
                            return (
                                <Dash key={i} style={pos} rotate={rotate} delay={delay} />
                            );
                        })}

                        {/* Main purple circle */}
                        <Animated.View
                            style={[
                                styles.circle,
                                {
                                    opacity: circleOpacity,
                                    transform: [{ scale: circleScale }],
                                },
                            ]}
                        >
                            {/* Checkmark SVG-like using Views */}
                            <Animated.View style={[styles.checkWrapper, { opacity: checkOpacity }]}>
                                <View style={styles.checkLeft} />
                                <View style={styles.checkRight} />
                            </Animated.View>
                        </Animated.View>
                    </View>
                </View>

                {/* Text content */}
                <Animated.View
                    style={[
                        styles.textContent,
                        {
                            opacity: textOpacity,
                            transform: [{ translateY: textTranslateY }],
                        },
                    ]}
                >
                    <Text style={styles.title}>Account Created!</Text>
                    <Text style={styles.subtitle}>
                        Your account has been created successfully. Now add your business
                        information for a smoother experience.
                    </Text>
                </Animated.View>

                {/* Continue button */}
                <Animated.View
                    style={[
                        styles.buttonWrapper,
                        {
                            opacity: buttonOpacity,
                            transform: [{ translateY: buttonTranslateY }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.85}
                        onPress={() => { }}
                    >
                        <Text style={styles.buttonText}>Continue</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#7B2FE0";
const CIRCLE_SIZE = 130;

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    container: {
        flex: 1,
        backgroundColor: "#F5F5FA",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
        paddingTop: 60,
        paddingBottom: 36,
    },

    // Illustration
    illustrationArea: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    shadow: {
        position: "absolute",
        bottom: -14,
        width: CIRCLE_SIZE * 0.85,
        height: 16,
        borderRadius: 50,
        backgroundColor: "#C9A0F5",
        opacity: 0.35,
    },
    decorContainer: {
        width: CIRCLE_SIZE + 80,
        height: CIRCLE_SIZE + 80,
        alignItems: "center",
        justifyContent: "center",
    },

    // Main circle
    circle: {
        width: CIRCLE_SIZE,
        height: CIRCLE_SIZE,
        borderRadius: CIRCLE_SIZE / 2,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
    },

    // Checkmark (two rotated rectangles)
    checkWrapper: {
        width: 52,
        height: 52,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    checkLeft: {
        position: "absolute",
        width: 4.5,
        height: 20,
        backgroundColor: "white",
        borderRadius: 3,
        bottom: 8,
        left: 12,
        transform: [{ rotate: "45deg" }],
    },
    checkRight: {
        position: "absolute",
        width: 4.5,
        height: 34,
        backgroundColor: "white",
        borderRadius: 3,
        bottom: 6,
        right: 8,
        transform: [{ rotate: "-40deg" }],
    },

    // Sparkles
    sparkle: {
        position: "absolute",
    },
    starArm: {
        position: "absolute",
        backgroundColor: PURPLE,
        borderRadius: 2,
    },

    // Dashes
    dash: {
        position: "absolute",
        width: 14,
        height: 3.5,
        backgroundColor: PURPLE,
        borderRadius: 2,
    },

    // Text
    textContent: {
        alignItems: "center",
        paddingHorizontal: 10,
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 14,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 15,
        color: "#6B6B80",
        textAlign: "center",
        lineHeight: 23,
        fontWeight: "400",
    },

    // Button
    buttonWrapper: {
        width: "100%",
    },
    button: {
        backgroundColor: PURPLE,
        borderRadius: 50,
        paddingVertical: 18,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: PURPLE,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
        letterSpacing: 0.3,
    },
});
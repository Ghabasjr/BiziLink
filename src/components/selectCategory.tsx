import { useState } from "react";
import {
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Category {
    id: string;
    name: string;
    productCount: number;
    image: any; // use require("../../assets/...") or { uri: "..." }
}

interface Props {
    categories?: Category[];
    onBack?: () => void;
    onContinue?: (selectedCategory: Category) => void;
}

const DEFAULT_CATEGORIES: Category[] = [
    { id: "1", name: "Ankara", productCount: 0, image: { uri: "https://via.placeholder.com/60x60/8B5CF6/fff?text=A" } },
    { id: "2", name: "Textiles (Men)", productCount: 0, image: { uri: "https://via.placeholder.com/60x60/3B82F6/fff?text=T" } },
    { id: "3", name: "Caps (Men)", productCount: 0, image: { uri: "https://via.placeholder.com/60x60/10B981/fff?text=C" } },
    { id: "4", name: "Shoes", productCount: 0, image: { uri: "https://via.placeholder.com/60x60/F59E0B/fff?text=S" } },
    { id: "5", name: "Sneakers", productCount: 0, image: { uri: "https://via.placeholder.com/60x60/EF4444/fff?text=S" } },
];

export default function SelectCategoryScreen({
    categories = DEFAULT_CATEGORIES,
    onBack,
    onContinue,
}: Props) {
    const [selectedId, setSelectedId] = useState<string>(categories[0]?.id ?? "");

    const selectedCategory = categories.find((c) => c.id === selectedId);

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Product</Text>
                {/* spacer to keep title centred */}
                <View style={styles.backBtn} />
            </View>

            {/* ── Category List ── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionLabel}>Select Category</Text>

                <View style={styles.list}>
                    {categories.map((cat, index) => {
                        const isSelected = cat.id === selectedId;
                        const isLast = index === categories.length - 1;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                style={[styles.row, !isLast && styles.rowBorder]}
                                onPress={() => setSelectedId(cat.id)}
                                activeOpacity={0.7}
                            >
                                {/* Thumbnail */}
                                <Image source={cat.image} style={styles.thumb} />

                                {/* Name + count */}
                                <View style={styles.rowText}>
                                    <Text style={styles.catName}>{cat.name}</Text>
                                    <Text style={styles.catCount}>{cat.productCount} Products</Text>
                                </View>

                                {/* Radio */}
                                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                    {isSelected && <View style={styles.radioDot} />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* ── Continue Button ── */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.continueBtn, !selectedId && styles.continueBtnDisabled]}
                    onPress={() => selectedCategory && onContinue?.(selectedCategory)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },

    // ── Header ────────────────────────────────────────────
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
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
    backIcon: {
        fontSize: 24,
        color: "#333",
        lineHeight: 28,
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },

    // ── Scroll ────────────────────────────────────────────
    scroll: { flex: 1 },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 16,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 14,
    },

    // ── List card ─────────────────────────────────────────
    list: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        gap: 14,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: "#F3F3F3",
    },

    // Thumbnail
    thumb: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#EEE",
    },

    // Text
    rowText: {
        flex: 1,
    },
    catName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    catCount: {
        fontSize: 12,
        color: "#999",
        marginTop: 3,
    },

    // Radio button
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#DEDEDE",
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: {
        borderColor: PURPLE,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PURPLE,
    },

    // ── Footer ────────────────────────────────────────────
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        backgroundColor: "#F7F7F9",
    },
    continueBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 6,
    },
    continueBtnDisabled: {
        opacity: 0.6,
    },
    continueBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});
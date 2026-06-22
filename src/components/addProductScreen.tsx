import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
    categoryName?: string;
    onBack?: () => void;
    onSaveDraft?: (data: ProductForm) => void;
    onPublish?: (data: ProductForm) => void;
    onAddMore?: (data: ProductForm) => void;
    isSubmitting?: boolean;
}

interface ProductForm {
    images: string[];
    category: string;
    brandName: string;
    productPrice: string;
    stockStatus: "IN_STOCK" | "OUT_OF_STOCK" | null;
}

const BRAND_OPTIONS = ["Nike", "Adidas", "Puma", "Zara", "H&M", "Local Brand", "Other"];

export default function AddProductScreen({
    categoryName = "Ankara",
    onBack,
    onSaveDraft,
    onPublish,
    onAddMore,
    isSubmitting = false,
}: Props) {
    const [images, setImages] = useState<string[]>([]);
    const [brandName, setBrandName] = useState("");
    const [brandDropOpen, setBrandDropOpen] = useState(false);
    const [productPrice, setProductPrice] = useState("");
    const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "OUT_OF_STOCK" | null>(null);

    const getForm = (): ProductForm => ({
        images,
        category: categoryName,
        brandName,
        productPrice,
        stockStatus,
    });

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow access to your photo library.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            const uris = result.assets.map((a) => a.uri);
            setImages((prev) => [...prev, ...uris]);
        }
    };

    const handlePublish = () => {
        if (!brandName || !productPrice || !stockStatus) {
            Alert.alert("Missing fields", "Please fill in all required fields before publishing.");
            return;
        }
        onPublish?.(getForm());
    };

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Product</Text>
                <TouchableOpacity onPress={() => onSaveDraft?.(getForm())} activeOpacity={0.7}>
                    <Text style={styles.saveDraft}>Save draft</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Product Images ── */}
                <View style={styles.imagesSection}>
                    <View style={styles.imagesSectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>Product Images</Text>
                            <Text style={styles.sectionSub}>You can add unlimited images</Text>
                        </View>
                        <View style={styles.imageCountBadge}>
                            <Text style={styles.imageCountText}>{images.length}</Text>
                        </View>
                    </View>

                    {/* Upload zone */}
                    <TouchableOpacity style={styles.uploadZone} onPress={handlePickImage} activeOpacity={0.7}>
                        {images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagePreviewScroll}>
                                {images.map((uri, i) => (
                                    <Image key={i} source={{ uri }} style={styles.previewThumb} />
                                ))}
                                <TouchableOpacity style={styles.addMoreThumb} onPress={handlePickImage}>
                                    <Text style={styles.addMoreThumbText}>＋</Text>
                                </TouchableOpacity>
                            </ScrollView>
                        ) : (
                            <>
                                {/* Cloud upload icon */}
                                <View style={styles.cloudWrap}>
                                    <Text style={styles.cloudIcon}>☁</Text>
                                    <Text style={styles.cloudArrow}>↑</Text>
                                </View>
                                <Text style={styles.uploadTitle}>Upload product image</Text>
                                <Text style={styles.uploadSub}>Please upload quality and clearer images</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* ── Category (read-only, pre-filled) ── */}
                <View style={styles.inputBox}>
                    <Text style={styles.inputText}>{categoryName}</Text>
                </View>

                {/* ── Brand Name dropdown ── */}
                <TouchableOpacity
                    style={styles.inputBox}
                    onPress={() => setBrandDropOpen((v) => !v)}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.inputText, !brandName && styles.placeholder]}>
                        {brandName || "Brand Name"}
                    </Text>
                    <Text style={[styles.dropArrow, brandDropOpen && styles.dropArrowUp]}>∨</Text>
                </TouchableOpacity>

                {brandDropOpen && (
                    <View style={styles.dropdown}>
                        {BRAND_OPTIONS.map((opt) => (
                            <TouchableOpacity
                                key={opt}
                                style={styles.dropOption}
                                onPress={() => { setBrandName(opt); setBrandDropOpen(false); }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.dropOptionText, brandName === opt && styles.dropOptionActive]}>
                                    {opt}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* ── Product Price ── */}
                <View style={styles.inputBox}>
                    <TextInput
                        style={styles.input}
                        placeholder="Product Price"
                        placeholderTextColor="#AAAAAA"
                        value={productPrice}
                        onChangeText={setProductPrice}
                        keyboardType="numeric"
                    />
                </View>

                {/* ── Stock Status ── */}
                <View style={styles.stockSection}>
                    <Text style={styles.stockTitle}>Stock Status</Text>
                    <View style={styles.stockRow}>
                        <TouchableOpacity
                            style={styles.stockOption}
                            onPress={() => setStockStatus("IN_STOCK")}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.radio, stockStatus === "IN_STOCK" && styles.radioSelected]}>
                                {stockStatus === "IN_STOCK" && <View style={styles.radioDot} />}
                            </View>
                            <Text style={styles.stockLabel}>In stock</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.stockOption}
                            onPress={() => setStockStatus("OUT_OF_STOCK")}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.radio, stockStatus === "OUT_OF_STOCK" && styles.radioSelected]}>
                                {stockStatus === "OUT_OF_STOCK" && <View style={styles.radioDot} />}
                            </View>
                            <Text style={styles.stockLabel}>Out of Stock</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {/* ── Footer Buttons ── */}
            <View style={styles.footer}>
                <TouchableOpacity 
                    style={[styles.publishBtn, isSubmitting && { opacity: 0.7 }]} 
                    onPress={handlePublish} 
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                >
                    <Text style={styles.publishBtnText}>
                        {isSubmitting ? "Publishing..." : "Publish"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.addMoreBtn, isSubmitting && { opacity: 0.7 }]} 
                    onPress={() => onAddMore?.(getForm())} 
                    activeOpacity={0.85}
                    disabled={isSubmitting}
                >
                    <Text style={styles.addMoreBtnText}>
                        {isSubmitting ? "Please wait..." : "Add More"}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#F7F7F9" },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, gap: 12 },

    // ── Header ────────────────────────────────────────────
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 14,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#FFF",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    backIcon: { fontSize: 24, color: "#333", lineHeight: 28, marginTop: -2 },
    headerTitle: { fontSize: 17, fontWeight: "700", color: "#1A1A1A" },
    saveDraft: { fontSize: 14, fontWeight: "700", color: PURPLE },

    // ── Images section ────────────────────────────────────
    imagesSection: {
        backgroundColor: "#FFF",
        borderRadius: 16,
        padding: 16,
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    imagesSectionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
    sectionSub: { fontSize: 12, color: "#999", marginTop: 2 },
    imageCountBadge: {
        width: 44,
        height: 36,
        borderRadius: 10,
        backgroundColor: "#F0F0F0",
        alignItems: "center",
        justifyContent: "center",
    },
    imageCountText: { fontSize: 16, fontWeight: "700", color: "#1A1A1A" },

    // Upload zone
    uploadZone: {
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderStyle: "dashed",
        borderRadius: 14,
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 28,
        minHeight: 120,
        gap: 6,
    },
    cloudWrap: {
        position: "relative",
        width: 48,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    cloudIcon: { fontSize: 38, color: PURPLE, lineHeight: 42 },
    cloudArrow: { position: "absolute", bottom: 0, fontSize: 15, fontWeight: "900", color: PURPLE },
    uploadTitle: { fontSize: 14, fontWeight: "700", color: "#1A1A1A", marginTop: 2 },
    uploadSub: { fontSize: 12, color: "#888", textAlign: "center" },

    // Image previews
    imagePreviewScroll: { paddingHorizontal: 4 },
    previewThumb: { width: 72, height: 72, borderRadius: 10, marginRight: 8 },
    addMoreThumb: {
        width: 72,
        height: 72,
        borderRadius: 10,
        backgroundColor: PURPLE_LIGHT,
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    addMoreThumbText: { fontSize: 24, color: PURPLE, fontWeight: "700" },

    // ── Input boxes ───────────────────────────────────────
    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#EFEFEF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
    },
    inputText: { flex: 1, fontSize: 15, color: "#1A1A1A", fontWeight: "500" },
    placeholder: { color: "#AAAAAA", fontWeight: "400" },
    input: { flex: 1, fontSize: 15, color: "#1A1A1A", padding: 0, margin: 0 },
    dropArrow: { fontSize: 18, color: "#888", marginLeft: 8 },
    dropArrowUp: { transform: [{ rotate: "180deg" }] },

    // Dropdown
    dropdown: {
        backgroundColor: "#FFF",
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
        marginTop: -8,
    },
    dropOption: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F3F3",
    },
    dropOptionText: { fontSize: 14, color: "#555", fontWeight: "500" },
    dropOptionActive: { color: PURPLE, fontWeight: "700" },

    // ── Stock Status ──────────────────────────────────────
    stockSection: { paddingTop: 8 },
    stockTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A1A", marginBottom: 14 },
    stockRow: { flexDirection: "row", gap: 32 },
    stockOption: { flexDirection: "row", alignItems: "center", gap: 10 },
    radio: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: "#DEDEDE",
        alignItems: "center",
        justifyContent: "center",
    },
    radioSelected: { borderColor: PURPLE },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PURPLE },
    stockLabel: { fontSize: 14, color: "#333", fontWeight: "500" },

    // ── Footer ────────────────────────────────────────────
    footer: {
        paddingHorizontal: 18,
        paddingTop: 10,
        paddingBottom: Platform.OS === "ios" ? 32 : 18,
        gap: 10,
        backgroundColor: "#F7F7F9",
    },
    publishBtn: {
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
    publishBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
    addMoreBtn: {
        backgroundColor: "#1A1A2E",
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    addMoreBtnText: { color: "#FFF", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
});
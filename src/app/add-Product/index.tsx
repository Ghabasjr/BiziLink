import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { auth, db, storage } from "@/lib/firebase";

interface CategoryOption {
    id: string;
    name: string;
    image: string;
    defaultCount: number;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
    { id: "textiles_men", name: "Textiles (Men)", image: "https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=300&auto=format&fit=crop", defaultCount: 6 },
    { id: "kashmeir", name: "Kashmeir", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop", defaultCount: 8 },
    { id: "bazin", name: "Bazin", image: "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?q=80&w=300&auto=format&fit=crop", defaultCount: 8 },
    { id: "shoes", name: "Shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=300&auto=format&fit=crop", defaultCount: 0 },
    { id: "sneakers", name: "Sneakers", image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=300&auto=format&fit=crop", defaultCount: 0 },
];

export default function AddProductWizard() {
    const router = useRouter();

    // Steps: 1 (Brand Input & Category), 2 (Details & Upload), 3 (Success)
    const [step, setStep] = useState(1);

    // Step 1: Yard Name / Brand Input & Selected Category
    const [brandInput, setBrandInput] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("Textiles (Men)");
    const [categoryProductCounts, setCategoryProductCounts] = useState<Record<string, number>>({});

    // Step 2: Images & Details
    const [images, setImages] = useState<string[]>([]);
    const [productPrice, setProductPrice] = useState("");
    const [productColor, setProductColor] = useState("");
    const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "OUT_OF_STOCK" | null>("IN_STOCK");

    // Submission & Store Info
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storeSlug, setStoreSlug] = useState("");
    const [businessName, setBusinessName] = useState("");

    // Fetch store info & category product counts
    useEffect(() => {
        const fetchStoreInfo = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setStoreSlug(data.storeSlug || "");
                    setBusinessName(data.businessName || "");
                }

                const q = query(collection(db, "products"), where("storeId", "==", user.uid));
                const snap = await getDocs(q);
                const counts: Record<string, number> = {};
                snap.forEach((docSnap) => {
                    const prod = docSnap.data();
                    const cat = prod.category || prod.brandName || "";
                    if (cat) {
                        counts[cat] = (counts[cat] || 0) + 1;
                    }
                });
                setCategoryProductCounts(counts);
            } catch (e) {
                console.error("Error fetching store info:", e);
            }
        };
        fetchStoreInfo();
    }, []);

    // Handle Image Selection
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
            const pickedUris = result.assets.map((a) => a.uri);
            setImages((prev) => [...prev, ...pickedUris]);
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Save Draft or Publish Now
    const handlePublish = async (isDraft: boolean) => {
        const finalBrand = brandInput.trim() || selectedCategory;

        if (!finalBrand) {
            Alert.alert("Missing field", "Please enter a yard name or brand.");
            return;
        }
        if (!productPrice) {
            Alert.alert("Missing field", "Please enter a product price.");
            return;
        }
        if (!stockStatus) {
            Alert.alert("Missing field", "Please select a stock status.");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Authentication required", "You must be logged in.");
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. Upload Images to Storage
            const uploadedImageUrls = await Promise.all(
                images.map(async (uri: string, idx: number) => {
                    const blob: any = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest();
                        xhr.onload = function () {
                            resolve(xhr.response);
                        };
                        xhr.onerror = function (e) {
                            console.error(e);
                            reject(new TypeError("Network request failed"));
                        };
                        xhr.responseType = "blob";
                        xhr.open("GET", uri, true);
                        xhr.send(null);
                    });

                    try {
                        const imageRef = ref(storage, `products/${user.uid}/${Date.now()}_${idx}`);
                        await uploadBytes(imageRef, blob);
                        return await getDownloadURL(imageRef);
                    } finally {
                        if (blob && typeof blob.close === "function") {
                            blob.close();
                        }
                    }
                })
            );

            // 2. Add product document to Firestore
            await addDoc(collection(db, "products"), {
                storeId: user.uid,
                name: finalBrand,
                brandName: finalBrand,
                category: selectedCategory,
                price: parseFloat(productPrice),
                color: productColor.trim(),
                images: uploadedImageUrls,
                isOutOfStock: stockStatus === "OUT_OF_STOCK",
                status: isDraft ? "draft" : "published",
                createdAt: new Date().toISOString(),
            });

            if (isDraft) {
                Alert.alert("Success", "Draft saved successfully!");
                router.replace("/(tabs)/home" as any);
            } else {
                setStep(3);
            }
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to publish product.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleShareStore = async () => {
        if (!storeSlug) return;
        try {
            await Share.share({
                message: `Check out my store "${businessName || "my store"}" on BiziLink! https://bizi-link.vercel.app/store/${storeSlug}`,
                url: `https://bizi-link.vercel.app/store/${storeSlug}`,
            });
        } catch (error) {
            console.error("Failed to share store link:", error);
        }
    };

    // Step 1: Input Brand / Yard Name & Select Recent Category
    const renderStep1 = () => {
        const canContinue = brandInput.trim().length > 0 || selectedCategory.length > 0;

        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Product</Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    <Text style={styles.welcomeHeading}>
                        Welcome, Please What is The Name of the Yard You To Add
                    </Text>

                    {/* Brand Name Input Field */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Enter Yard Name/Brand"
                            placeholderTextColor="#888888"
                            value={brandInput}
                            onChangeText={setBrandInput}
                        />
                    </View>

                    <Text style={styles.subCategoryTitle}>Select From Recent Category</Text>

                    {/* Categories List */}
                    <View style={styles.categoryList}>
                        {CATEGORY_OPTIONS.map((cat) => {
                            const isSelected = selectedCategory === cat.name;
                            const count = categoryProductCounts[cat.name] ?? cat.defaultCount;

                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                                    onPress={() => {
                                        setSelectedCategory(cat.name);
                                        if (!brandInput.trim()) {
                                            setBrandInput(cat.name);
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Image source={{ uri: cat.image }} style={styles.categoryThumb} />
                                    <View style={styles.categoryTextWrap}>
                                        <Text style={styles.categoryName}>{cat.name}</Text>
                                        <Text style={styles.categoryCount}>{count} Products</Text>
                                    </View>
                                    <View style={[styles.radio, isSelected && styles.radioSelected]}>
                                        {isSelected && <View style={styles.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.purpleBtn, !canContinue && styles.btnDisabled]}
                        onPress={() => canContinue && setStep(2)}
                        activeOpacity={0.85}
                        disabled={!canContinue}
                    >
                        <Text style={styles.purpleBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    };

    // Step 2: Product Images & Details
    const renderStep2 = () => {
        const finalBrand = brandInput.trim() || selectedCategory;

        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Product</Text>
                    <TouchableOpacity onPress={() => handlePublish(true)} activeOpacity={0.7} disabled={isSubmitting}>
                        <Text style={styles.saveDraftLink}>Save draft</Text>
                    </TouchableOpacity>
                </View>

                {isSubmitting ? (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#6B3FE7" />
                        <Text style={styles.loaderText}>Publishing product...</Text>
                    </View>
                ) : (
                    <>
                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Product Images Section */}
                            <View style={styles.imagesCard}>
                                <View style={styles.imagesHeader}>
                                    <View>
                                        <Text style={styles.sectionTitle}>Product Images</Text>
                                        <Text style={styles.sectionSub}>You can add unlimited images</Text>
                                    </View>
                                    <View style={styles.imageBadge}>
                                        <Text style={styles.imageBadgeText}>{images.length}</Text>
                                    </View>
                                </View>

                                {/* Image Selector / Previews */}
                                <View style={styles.uploadRow}>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                        {/* Upload Box */}
                                        <TouchableOpacity style={styles.uploadBox} onPress={handlePickImage} activeOpacity={0.7}>
                                            <View style={styles.cloudIconWrap}>
                                                <Text style={styles.cloudIcon}>☁</Text>
                                                <Text style={styles.cloudArrow}>↑</Text>
                                            </View>
                                            <Text style={styles.uploadBoxText}>Upload image</Text>
                                        </TouchableOpacity>

                                        {/* Thumbnails */}
                                        {images.map((uri, idx) => (
                                            <View key={idx} style={styles.previewWrap}>
                                                <Image source={{ uri }} style={styles.previewImage} />
                                                <TouchableOpacity
                                                    style={styles.removeBtn}
                                                    onPress={() => handleRemoveImage(idx)}
                                                    activeOpacity={0.7}
                                                >
                                                    <Text style={styles.removeBtnText}>×</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            </View>

                            {/* Category Field (Read-only grey box) */}
                            <View style={styles.greyBox}>
                                <Text style={styles.greyBoxText}>{selectedCategory}</Text>
                            </View>

                            {/* Brand / Yard Name Field (Read-only grey box) */}
                            <View style={styles.greyBox}>
                                <Text style={styles.greyBoxText}>{finalBrand}</Text>
                            </View>

                            {/* Price Field with Per Yard Badge */}
                            <View style={styles.priceContainer}>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="Enter Price"
                                    placeholderTextColor="#888888"
                                    value={productPrice}
                                    onChangeText={setProductPrice}
                                    keyboardType="numeric"
                                />
                                <View style={styles.perYardBadge}>
                                    <Text style={styles.perYardText}>Per Yard</Text>
                                </View>
                            </View>

                            {/* Color Field */}
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Yard Color"
                                    placeholderTextColor="#888888"
                                    value={productColor}
                                    onChangeText={setProductColor}
                                />
                            </View>

                            {/* Stock Status */}
                            <View style={styles.stockSection}>
                                <Text style={styles.stockSectionTitle}>Stock Status</Text>
                                <View style={styles.stockCardContainer}>
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

                        {/* Footer Action Buttons */}
                        <View style={styles.footerButtons}>
                            <TouchableOpacity
                                style={styles.purpleBtn}
                                onPress={() => handlePublish(false)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.purpleBtnText}>Publish Now</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.navyBtn}
                                onPress={() => handlePublish(true)}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.navyBtnText}>Save to Draft</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </SafeAreaView>
        );
    };

    // Step 3: Success Screen
    const renderStep3 = () => (
        <SafeAreaView style={styles.safeWhite}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.successContainer}>
                <View style={styles.checkmarkWrapper}>
                    <Text style={[styles.sparkle, styles.sp1]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sp2]}>✨</Text>
                    <Text style={[styles.sparkle, styles.sp3]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sp4]}>✧</Text>
                    <Text style={[styles.sparkle, styles.sp5]}>✨</Text>

                    <View style={styles.successDottedCircle}>
                        <View style={styles.successInnerCircle}>
                            <Text style={styles.successCheckmark}>✓</Text>
                        </View>
                    </View>
                </View>

                <Text style={styles.successTitle}>Published Successfully</Text>
                <Text style={styles.successSub}>
                    Your product has been added to your catalog and is now visible to customers. Start sharing your store link and receive inquiries directly on WhatsApp.
                </Text>
            </View>

            <View style={styles.successFooter}>
                <TouchableOpacity
                    style={styles.purpleBtn}
                    onPress={() => router.replace("/(tabs)/home" as any)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.purpleBtnText}>Go To Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.navyBtn}
                    onPress={handleShareStore}
                    activeOpacity={0.85}
                >
                    <Text style={styles.navyBtnText}>Share store link</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    switch (step) {
        case 1:
            return renderStep1();
        case 2:
            return renderStep2();
        case 3:
            return renderStep3();
        default:
            return renderStep1();
    }
}

const PURPLE = "#9D4EDD";
const PURPLE_PRIMARY = "#8B42FC";
const PURPLE_BG = "#F4E8FF";
const DARK_NAVY = "#13132B";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },
    safeWhite: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 18,
        paddingTop: Platform.OS === "android" ? 16 : 8,
        paddingBottom: 14,
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    backIcon: {
        fontSize: 24,
        color: "#1A1A1A",
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    backBtnPlaceholder: {
        width: 38,
    },
    saveDraftLink: {
        fontSize: 14,
        fontWeight: "700",
        color: PURPLE_PRIMARY,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 24,
        gap: 16,
    },
    welcomeHeading: {
        fontSize: 24,
        fontWeight: "800",
        color: "#1A1A1A",
        lineHeight: 32,
        marginBottom: 4,
    },
    inputContainer: {
        backgroundColor: "#F5F5FA",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        borderWidth: 1,
        borderColor: "#EAEAEA",
        justifyContent: "center",
    },
    textInput: {
        fontSize: 15,
        color: "#1A1A1A",
        padding: 0,
        margin: 0,
        fontWeight: "500",
    },
    subCategoryTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
        marginTop: 8,
    },
    categoryList: {
        gap: 12,
    },
    categoryCard: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 14,
    },
    categoryCardSelected: {
        borderColor: PURPLE_PRIMARY,
    },
    categoryThumb: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },
    categoryTextWrap: {
        flex: 1,
    },
    categoryName: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    categoryCount: {
        fontSize: 12,
        color: "#999999",
        marginTop: 3,
    },
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
        borderColor: PURPLE_PRIMARY,
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: PURPLE_PRIMARY,
    },
    imagesCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    imagesHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: 14,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    sectionSub: {
        fontSize: 12,
        color: "#999999",
        marginTop: 2,
    },
    imageBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: "#F0F0F0",
    },
    imageBadgeText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    uploadRow: {
        paddingVertical: 4,
    },
    uploadBox: {
        width: 84,
        height: 84,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: PURPLE_PRIMARY,
        borderStyle: "dashed",
        backgroundColor: PURPLE_BG,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        gap: 2,
    },
    cloudIconWrap: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },
    cloudIcon: {
        fontSize: 22,
        color: PURPLE_PRIMARY,
    },
    cloudArrow: {
        position: "absolute",
        bottom: -2,
        fontSize: 9,
        fontWeight: "900",
        color: PURPLE_PRIMARY,
    },
    uploadBoxText: {
        fontSize: 9,
        fontWeight: "700",
        color: PURPLE_PRIMARY,
    },
    previewWrap: {
        position: "relative",
        marginRight: 10,
    },
    previewImage: {
        width: 84,
        height: 84,
        borderRadius: 14,
    },
    removeBtn: {
        position: "absolute",
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "#FFFFFF",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    removeBtnText: {
        fontSize: 14,
        color: "#1A1A1A",
        fontWeight: "bold",
        lineHeight: 18,
    },
    greyBox: {
        backgroundColor: "#EFEFEF",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    greyBoxText: {
        fontSize: 15,
        color: "#1A1A1A",
        fontWeight: "500",
    },
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5FA",
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 8,
        minHeight: 56,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    priceInput: {
        flex: 1,
        fontSize: 15,
        color: "#1A1A1A",
        padding: 0,
        margin: 0,
        fontWeight: "500",
    },
    perYardBadge: {
        backgroundColor: DARK_NAVY,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    perYardText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },
    stockSection: {
        gap: 12,
    },
    stockSectionTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    stockCardContainer: {
        flexDirection: "row",
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 18,
        borderWidth: 1,
        borderColor: "#EFEFEF",
        gap: 32,
    },
    stockOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    stockLabel: {
        fontSize: 14,
        color: "#1A1A1A",
        fontWeight: "500",
    },
    loaderContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
    },
    loaderText: {
        fontSize: 15,
        color: "#6B6B80",
        fontWeight: "500",
    },
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EAEAEA",
    },
    footerButtons: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EAEAEA",
        gap: 10,
    },
    purpleBtn: {
        backgroundColor: PURPLE_PRIMARY,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    btnDisabled: {
        opacity: 0.6,
    },
    purpleBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    navyBtn: {
        backgroundColor: DARK_NAVY,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    navyBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    successContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    checkmarkWrapper: {
        width: 150,
        height: 150,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    successDottedCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 2,
        borderColor: PURPLE_BG,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    successInnerCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: PURPLE_PRIMARY,
        alignItems: "center",
        justifyContent: "center",
    },
    successCheckmark: {
        fontSize: 48,
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    sparkle: {
        position: "absolute",
        color: PURPLE_PRIMARY,
        fontSize: 16,
    },
    sp1: { top: 12, left: 16, fontSize: 20 },
    sp2: { top: 20, right: 12, fontSize: 18 },
    sp3: { bottom: 18, left: 14, fontSize: 16 },
    sp4: { bottom: 22, right: 18, fontSize: 22 },
    sp5: { top: 4, right: 54, fontSize: 14 },
    successTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#1A1A1A",
        marginTop: 24,
        textAlign: "center",
    },
    successSub: {
        fontSize: 14,
        color: "#6B6B80",
        textAlign: "center",
        marginTop: 12,
        lineHeight: 22,
    },
    successFooter: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        backgroundColor: "#FFFFFF",
        gap: 10,
    },
});
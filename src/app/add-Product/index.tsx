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

interface Brand {
    id: string;
    name: string;
    image: string;
}

const BRANDS: Brand[] = [
    { id: "men_lace", name: "Men Lace", image: "https://images.unsplash.com/photo-1597484662317-c87bdb34eed9?q=80&w=300&auto=format&fit=crop" },
    { id: "gezner", name: "Gezner", image: "https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=300&auto=format&fit=crop" },
    { id: "wagambari", name: "Wagambari", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=300&auto=format&fit=crop" },
    { id: "dan_abba", name: "Dan Abba", image: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?q=80&w=300&auto=format&fit=crop" },
    { id: "bazin", name: "Bazin", image: "https://images.unsplash.com/photo-1584184924103-e310d9dc82fc?q=80&w=300&auto=format&fit=crop" },
    { id: "bazin_alt", name: "Bazin", image: "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=300&auto=format&fit=crop" },
];

export default function AddProductWizard() {
    const router = useRouter();

    // Wizard step: 1 (Brand), 2 (Image Count), 3 (Details), 4 (Success)
    const [step, setStep] = useState(1);

    // Step 1: Brand Selection
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [brandProductCounts, setBrandProductCounts] = useState<Record<string, number>>({});

    // Step 2: Image Limit
    const [imageLimitInput, setImageLimitInput] = useState("");
    const [imageLimit, setImageLimit] = useState<number>(0);

    // Step 3: Product Details & Images
    const [images, setImages] = useState<string[]>([]);
    const [productPrice, setProductPrice] = useState("");
    const [stockStatus, setStockStatus] = useState<"IN_STOCK" | "OUT_OF_STOCK" | null>("IN_STOCK");

    // Operations / Store metadata
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [storeSlug, setStoreSlug] = useState("");
    const [businessName, setBusinessName] = useState("");

    // Fetch dynamic product counts by brand & store info
    useEffect(() => {
        const fetchCountsAndStore = async () => {
            const user = auth.currentUser;
            if (!user) return;
            try {
                // Fetch user store info
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    setStoreSlug(data.storeSlug || "");
                    setBusinessName(data.businessName || "");
                }

                // Fetch counts
                const q = query(collection(db, "products"), where("storeId", "==", user.uid));
                const snap = await getDocs(q);
                const counts: Record<string, number> = {};
                snap.forEach((docSnap) => {
                    const prod = docSnap.data();
                    const brand = prod.brandName || "";
                    if (brand) {
                        counts[brand] = (counts[brand] || 0) + 1;
                    }
                });
                setBrandProductCounts(counts);
            } catch (e) {
                console.error("Error fetching counts or store info:", e);
            }
        };
        fetchCountsAndStore();
    }, []);

    // Handle Image Picker
    const handlePickImage = async () => {
        const remaining = imageLimit - images.length;
        if (remaining <= 0) {
            Alert.alert("Limit Reached", `You can only add up to ${imageLimit} images.`);
            return;
        }

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
            if (pickedUris.length > remaining) {
                Alert.alert("Limit Exceeded", `You selected ${pickedUris.length} images, but only ${remaining} are remaining before your limit is reached. We added the first ${remaining}.`);
                setImages((prev) => [...prev, ...pickedUris.slice(0, remaining)]);
            } else {
                setImages((prev) => [...prev, ...pickedUris]);
            }
        }
    };

    const handleRemoveImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    };

    // Firebase storage + firestore save
    const handlePublish = async (isDraft: boolean) => {
        if (!selectedBrand) return;
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

            // 1. Upload images
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

            // 2. Write to Firestore
            await addDoc(collection(db, "products"), {
                storeId: user.uid,
                name: selectedBrand.name,
                brandName: selectedBrand.name,
                price: parseFloat(productPrice),
                category: "Textiles (Men)",
                images: uploadedImageUrls,
                isOutOfStock: stockStatus === "OUT_OF_STOCK",
                status: isDraft ? "draft" : "published",
                createdAt: new Date().toISOString(),
            });

            // 3. Move to next step
            if (isDraft) {
                Alert.alert("Success", "Draft saved successfully!");
                router.replace("/(tabs)/home" as any);
            } else {
                setStep(4);
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
                message: `Check out my store "${businessName || "my store"}" on BiziLink! https://bizilink.ng/store/${storeSlug}`,
                url: `https://bizilink.ng/store/${storeSlug}`,
            });
        } catch (error) {
            console.error("Failed to share store link:", error);
        }
    };

    // Render step functions
    const renderStep1 = () => (
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

            {/* Content */}
            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>Select Brand to Add</Text>

                <View style={styles.brandList}>
                    {BRANDS.map((brand, idx) => {
                        const isSelected = selectedBrand?.id === brand.id;
                        const productCount = brandProductCounts[brand.name] || 0;
                        return (
                            <TouchableOpacity
                                key={`${brand.id}-${idx}`}
                                style={[styles.brandCard, isSelected && styles.brandCardSelected]}
                                onPress={() => setSelectedBrand(brand)}
                                activeOpacity={0.7}
                            >
                                <Image source={{ uri: brand.image }} style={styles.brandThumb} />
                                <View style={styles.brandTextContainer}>
                                    <Text style={styles.brandName}>{brand.name}</Text>
                                    <Text style={styles.brandCount}>{productCount} Products</Text>
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
                    style={[styles.continueBtn, !selectedBrand && styles.continueBtnDisabled]}
                    onPress={() => selectedBrand && setStep(2)}
                    activeOpacity={0.85}
                    disabled={!selectedBrand}
                >
                    <Text style={styles.continueBtnText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    const renderStep2 = () => {
        const canContinue = imageLimitInput.trim() !== "" && parseInt(imageLimitInput, 10) > 0;
        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)} activeOpacity={0.7}>
                        <Text style={styles.backIcon}>‹</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Add Product</Text>
                    <View style={styles.backBtnPlaceholder} />
                </View>

                {/* Content */}
                <View style={styles.step2Container}>
                    <Text style={styles.welcomeText}>
                        Welcome, Please how many images do you want to add
                    </Text>

                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.input}
                            placeholder="How many images"
                            placeholderTextColor="#AAAAAA"
                            value={imageLimitInput}
                            onChangeText={(val) => setImageLimitInput(val.replace(/[^0-9]/g, ""))}
                            keyboardType="number-pad"
                        />
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
                        onPress={() => {
                            if (canContinue) {
                                setImageLimit(parseInt(imageLimitInput, 10));
                                setStep(3);
                            }
                        }}
                        activeOpacity={0.85}
                        disabled={!canContinue}
                    >
                        <Text style={styles.continueBtnText}>Continue</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    };

    const renderStep3 = () => {
        const isLimitReached = images.length >= imageLimit;

        return (
            <SafeAreaView style={styles.safe}>
                <StatusBar barStyle="dark-content" backgroundColor="#F7F7F9" />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)} activeOpacity={0.7}>
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
                            {/* Images Selector */}
                            <View style={styles.imagesSection}>
                                <View style={styles.imagesSectionHeader}>
                                    <View>
                                        <Text style={styles.sectionTitle}>Product Images</Text>
                                        <Text style={styles.sectionSub}>You can add up to {imageLimit} images</Text>
                                    </View>
                                    <View style={styles.imageCountBadge}>
                                        <Text style={styles.imageCountText}>{images.length}</Text>
                                    </View>
                                </View>

                                {images.length > 0 ? (
                                    <View style={styles.uploadAreaRow}>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                            {/* Smaller dotted upload item on left if not reached limit */}
                                            {!isLimitReached && (
                                                <TouchableOpacity style={styles.uploadZoneSmall} onPress={handlePickImage} activeOpacity={0.7}>
                                                    <View style={styles.cloudWrapSmall}>
                                                        <Text style={styles.cloudIconSmall}>☁</Text>
                                                        <Text style={styles.cloudArrowSmall}>↑</Text>
                                                    </View>
                                                    <Text style={styles.uploadTitleSmall}>Upload image</Text>
                                                </TouchableOpacity>
                                            )}

                                            {images.map((uri, idx) => (
                                                <View key={idx} style={styles.previewContainer}>
                                                    <Image source={{ uri }} style={styles.previewThumb} />
                                                    <TouchableOpacity
                                                        style={styles.removeImageBtn}
                                                        onPress={() => handleRemoveImage(idx)}
                                                        activeOpacity={0.7}
                                                    >
                                                        <Text style={styles.removeImageText}>×</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </ScrollView>
                                    </View>
                                ) : (
                                    <TouchableOpacity style={styles.uploadZoneLarge} onPress={handlePickImage} activeOpacity={0.7}>
                                        <View style={styles.cloudWrapLarge}>
                                            <Text style={styles.cloudIconLarge}>☁</Text>
                                            <Text style={styles.cloudArrowLarge}>↑</Text>
                                        </View>
                                        <Text style={styles.uploadTitleLarge}>Upload product image</Text>
                                        <Text style={styles.uploadSubLarge}>Please upload quality and clearer images</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {/* Category Box */}
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyBoxText}>Textiles (Men)</Text>
                            </View>

                            {/* Brand Box */}
                            <View style={styles.readOnlyBox}>
                                <Text style={styles.readOnlyBoxText}>{selectedBrand?.name || "No Brand Selected"}</Text>
                            </View>

                            {/* Price Field */}
                            <View style={styles.priceContainer}>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="Enter Price"
                                    placeholderTextColor="#AAAAAA"
                                    value={productPrice}
                                    onChangeText={setProductPrice}
                                    keyboardType="numeric"
                                />
                                <View style={styles.perYardBadge}>
                                    <Text style={styles.perYardText}>Per Yard</Text>
                                </View>
                            </View>

                            {/* Stock Status Container */}
                            <View style={styles.stockSection}>
                                <Text style={styles.stockTitle}>Stock Status</Text>
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

                        {/* Footer */}
                        <View style={styles.footer}>
                            {images.length === 0 ? (
                                <TouchableOpacity
                                    style={styles.continueBtn}
                                    onPress={() => handlePublish(false)}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.continueBtnText}>Save and Continue</Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.twoButtonsRow}>
                                    <TouchableOpacity
                                        style={styles.publishBtn}
                                        onPress={() => handlePublish(false)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.publishBtnText}>Publish Now</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.saveDraftBtn}
                                        onPress={() => handlePublish(true)}
                                        activeOpacity={0.85}
                                    >
                                        <Text style={styles.saveDraftBtnText}>Save to Draft</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    </>
                )}
            </SafeAreaView>
        );
    };

    const renderStep4 = () => (
        <SafeAreaView style={styles.safeWhite}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.successContainer}>
                {/* Checkmark Sparkly Animation Circle */}
                <View style={styles.checkmarkWrapper}>
                    {/* Sparkles */}
                    <Text style={[styles.sparkle, styles.sp1]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sp2]}>✨</Text>
                    <Text style={[styles.sparkle, styles.sp3]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sp4]}>✧</Text>
                    <Text style={[styles.sparkle, styles.sp5]}>✨</Text>

                    {/* Dotted border circle */}
                    <View style={styles.successDottedCircle}>
                        {/* Outer pulse */}
                        <View style={styles.successInnerCircle}>
                            {/* Checkmark icon */}
                            <Text style={styles.successCheckmark}>✓</Text>
                        </View>
                    </View>
                </View>

                {/* Published Successfully details */}
                <Text style={styles.successTitle}>Published Successfully</Text>
                <Text style={styles.successSub}>
                    Your product has been added to your catalog and is now visible to customers. Start sharing your store link and receive inquiries directly on WhatsApp.
                </Text>
            </View>

            {/* Footer Buttons */}
            <View style={styles.successFooter}>
                <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={() => router.replace("/(tabs)/home" as any)}
                    activeOpacity={0.85}
                >
                    <Text style={styles.continueBtnText}>Go To Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.successShareBtn}
                    onPress={handleShareStore}
                    activeOpacity={0.85}
                >
                    <Text style={styles.successShareBtnText}>Share store link</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );

    // Switch case based on current wizard step
    switch (step) {
        case 1:
            return renderStep1();
        case 2:
            return renderStep2();
        case 3:
            return renderStep3();
        case 4:
            return renderStep4();
        default:
            return renderStep1();
    }
}

const PURPLE = "#6B3FE7";
const PURPLE_LIGHT = "#EDE8FC";
const DARK_NAVY = "#121223";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F7F7F9",
    },
    safeWhite: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },

    // Header Styles
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
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    backIcon: {
        fontSize: 24,
        color: "#1A1A1A",
        lineHeight: 28,
        marginTop: -2,
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    backBtnPlaceholder: {
        width: 36,
    },
    saveDraftLink: {
        fontSize: 14,
        fontWeight: "700",
        color: PURPLE,
    },

    // Scroll / Global
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 18,
        paddingTop: 8,
        paddingBottom: 24,
        gap: 14,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 14,
    },

    // Step 1: Brands list
    brandList: {
        gap: 12,
    },
    brandCard: {
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
    brandCardSelected: {
        borderColor: PURPLE,
    },
    brandThumb: {
        width: 58,
        height: 58,
        borderRadius: 12,
        backgroundColor: "#F0F0F0",
    },
    brandTextContainer: {
        flex: 1,
    },
    brandName: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },
    brandCount: {
        fontSize: 12,
        color: "#999999",
        marginTop: 3,
    },

    // Step 2: Image Limit Screen
    step2Container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingTop: 24,
        gap: 20,
    },
    welcomeText: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1A1A1A",
        lineHeight: 32,
    },

    // Input Boxes (Step 2 and Details Fields)
    inputBox: {
        backgroundColor: "#F5F5FA",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        borderWidth: 1,
        borderColor: "#EAEAEA",
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#1A1A1A",
        padding: 0,
        margin: 0,
        fontWeight: "500",
    },

    // Step 3: Product Details & Images
    imagesSection: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EFEFEF",
    },
    imagesSectionHeader: {
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
    imageCountBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: "#F0F0F0",
        alignItems: "center",
        justifyContent: "center",
    },
    imageCountText: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
    },

    // Upload Zones (Details Screen)
    uploadZoneLarge: {
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
    cloudWrapLarge: {
        position: "relative",
        width: 48,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
    },
    cloudIconLarge: {
        fontSize: 38,
        color: PURPLE,
        lineHeight: 42,
    },
    cloudArrowLarge: {
        position: "absolute",
        bottom: 0,
        fontSize: 15,
        fontWeight: "900",
        color: PURPLE,
    },
    uploadTitleLarge: {
        fontSize: 14,
        fontWeight: "700",
        color: "#1A1A1A",
        marginTop: 2,
    },
    uploadSubLarge: {
        fontSize: 12,
        color: "#888888",
        textAlign: "center",
    },

    // Horizontal List upload zone
    uploadAreaRow: {
        paddingVertical: 4,
    },
    uploadZoneSmall: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: PURPLE,
        borderStyle: "dashed",
        backgroundColor: PURPLE_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },
    cloudWrapSmall: {
        position: "relative",
        width: 28,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    cloudIconSmall: {
        fontSize: 24,
        color: PURPLE,
        lineHeight: 26,
    },
    cloudArrowSmall: {
        position: "absolute",
        bottom: -1,
        fontSize: 10,
        fontWeight: "900",
        color: PURPLE,
    },
    uploadTitleSmall: {
        fontSize: 9,
        fontWeight: "700",
        color: PURPLE,
        textAlign: "center",
        marginTop: 2,
    },

    // Previews
    previewContainer: {
        position: "relative",
        marginRight: 10,
    },
    previewThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    removeImageBtn: {
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
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    removeImageText: {
        fontSize: 14,
        color: "#1A1A1A",
        fontWeight: "bold",
        lineHeight: 18,
    },

    // Read Only Box Detail Fields
    readOnlyBox: {
        backgroundColor: "#EFEFEF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
        minHeight: 56,
        justifyContent: "center",
    },
    readOnlyBoxText: {
        fontSize: 15,
        color: "#1A1A1A",
        fontWeight: "500",
    },

    // Price Container
    priceContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F5F5FA",
        borderRadius: 12,
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
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    perYardText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "700",
    },

    // Stock Status
    stockSection: {
        gap: 12,
    },
    stockTitle: {
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

    // Radio
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

    // Loading overlay
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

    // Step 4: Success Screen
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
        borderColor: PURPLE_LIGHT,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
    },
    successInnerCircle: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: PURPLE,
        alignItems: "center",
        justifyContent: "center",
    },
    successCheckmark: {
        fontSize: 48,
        color: "#FFFFFF",
        fontWeight: "bold",
        lineHeight: 52,
    },
    sparkle: {
        position: "absolute",
        color: PURPLE,
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

    // Footers
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        borderTopWidth: 1,
        borderTopColor: "#EAEAEA",
        backgroundColor: "#FFFFFF",
    },
    twoButtonsRow: {
        flexDirection: "column",
        gap: 10,
    },
    publishBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    publishBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    saveDraftBtn: {
        backgroundColor: DARK_NAVY,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    saveDraftBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
    continueBtn: {
        backgroundColor: PURPLE,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
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
    successFooter: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: Platform.OS === "ios" ? 32 : 20,
        backgroundColor: "#FFFFFF",
        gap: 10,
    },
    successShareBtn: {
        backgroundColor: DARK_NAVY,
        borderRadius: 30,
        paddingVertical: 17,
        alignItems: "center",
    },
    successShareBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: 0.3,
    },
});
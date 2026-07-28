import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { auth, db } from '@/lib/firebase';
import { Country, State } from 'country-state-city';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';

const PURPLE = "#7B2FE0";

type DropdownProps = {
    label: string;
    value: string;
    options: string[];
    onSelect: (val: string) => void;
    disabled?: boolean;
};

function DropdownField({ label, value, options, onSelect, disabled }: DropdownProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <TouchableOpacity
                style={[styles.dropdown, disabled && styles.dropdownDisabled]}
                onPress={() => !disabled && setOpen(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholder]}>
                    {value || label}
                </Text>
                <Image
                    source={require('../../assets/images/arrow-down-01.png')}
                    style={[styles.chevronImage, disabled && styles.chevronDisabled]}
                    contentFit="contain"
                />
            </TouchableOpacity>

            <Modal visible={open} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.modalItem, item === value && styles.modalItemSelected]}
                                    onPress={() => {
                                        onSelect(item);
                                        setOpen(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.modalItemText, item === value && styles.modalItemTextSelected]}>
                                        {item}
                                    </Text>
                                    {item === value && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

export default function BusinessInfoScreen() {
    const [businessName, setBusinessName] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [country, setCountry] = useState("");
    const [countryCode, setCountryCode] = useState("");
    const [state, setState] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCountrySelect = (val: string) => {
        setCountry(val);
        const found = Country.getAllCountries().find(c => c.name === val);
        setCountryCode(found ? found.isoCode : "");
        setState(""); // reset state when country changes
    };

    const handleContinue = async () => {
        console.log('[BusinessInfo] Submitting business info:', { businessName, whatsapp, country, state });
        if (!businessName || !whatsapp || !country || !state) {
            console.log('[BusinessInfo] Validation failed: missing required fields');
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            console.log('[BusinessInfo] User not logged in');
            Alert.alert("Error", "You must be logged in to complete this step");
            return;
        }

        try {
            setLoading(true);
            const storeSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);
            console.log('[BusinessInfo] Saving profile to Firestore for UID:', user.uid, { storeSlug });

            await setDoc(doc(db, "users", user.uid), {
                businessName,
                whatsappNumber: whatsapp,
                country,
                state,
                storeSlug
            }, { merge: true });
            console.log('[BusinessInfo] Successfully saved profile to Firestore');

            router.push('/businessRegisterScreen');
        } catch (error: any) {
            console.error('[BusinessInfo] Error saving business info:', error);
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    const countryOptions = Country.getAllCountries().map(c => c.name);
    const stateOptions = countryCode
        ? State.getStatesOfCountry(countryCode).map(s => s.name)
        : [];

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor="#F5F5FA" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    await signOut(auth);
                                    router.replace('/' as any);
                                } catch {
                                    router.replace('/' as any);
                                }
                            }}
                            style={{ alignSelf: "flex-start", marginBottom: 20 }}
                        >
                            <Text style={{ fontSize: 18, color: PURPLE }}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.title}>Business Info.</Text>
                        <Text style={styles.subtitle}>
                            These requirements help keep our community safe and credible.
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        <AppTextInput
                            placeholder="Business Name"
                            value={businessName}
                            onChangeText={setBusinessName}
                        />

                        <AppTextInput
                            placeholder="Business Whatsapp number"
                            value={whatsapp}
                            onChangeText={setWhatsapp}
                            keyboardType="phone-pad"
                        />

                        <DropdownField
                            label="Country"
                            value={country}
                            options={countryOptions}
                            onSelect={handleCountrySelect}
                        />

                        <DropdownField
                            label="State"
                            value={state}
                            options={stateOptions}
                            onSelect={setState}
                            disabled={!country}
                        />
                    </View>

                    {/* Continue Button */}
                    <View style={styles.footer}>
                        <AppButton
                            title={loading ? "Please wait..." : "Continue"}
                            onPress={handleContinue}
                            disabled={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 32,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1A1A1A",
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "#666666",
        lineHeight: 20,
    },
    form: {
        gap: 16,
        marginBottom: 32,
    },
    dropdown: {
        height: 52,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E5E5EA",
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    dropdownDisabled: {
        backgroundColor: "#F2F2F7",
        borderColor: "#E5E5EA",
    },
    dropdownText: {
        fontSize: 15,
        color: "#1A1A1A",
    },
    dropdownPlaceholder: {
        color: "#C7C7CC",
    },
    chevronImage: {
        width: 16,
        height: 16,
        tintColor: "#666666",
    },
    chevronDisabled: {
        tintColor: "#C7C7CC",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: "70%",
        padding: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#1A1A1A",
        marginBottom: 16,
    },
    modalItem: {
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F2F2F7",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    modalItemSelected: {
        backgroundColor: "#F5F0FF",
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    modalItemText: {
        fontSize: 15,
        color: "#1A1A1A",
    },
    modalItemTextSelected: {
        color: PURPLE,
        fontWeight: "600",
    },
    checkmark: {
        fontSize: 16,
        color: PURPLE,
        fontWeight: "bold",
    },
    footer: {
        marginTop: "auto",
        marginBottom: 16,
    },
});

import { AppButton } from '@/components/ui/app-button';
import { AppTextInput } from '@/components/ui/app-text-input';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { router } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from "react";
import { Country, State } from 'country-state-city';
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";



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
                <Text style={[styles.chevron, disabled && styles.chevronDisabled]}>
                    <img src="/images/arrow-down-01.png" alt="dropdown"/>
                </Text>
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
        if (!businessName || !whatsapp || !country || !state) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error", "You must be logged in to complete this step");
            return;
        }

        try {
            setLoading(true);
            const storeSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(Math.random() * 1000);

            await setDoc(doc(db, "users", user.uid), {
                businessName,
                whatsappNumber: whatsapp,
                country,
                state,
                storeSlug
            }, { merge: true });

            router.push('/BusinessRegisterScreen');
        } catch (error: any) {
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
                                } catch (error: any) {
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
                </ScrollView>

                {/* Footer button */}
                <View style={styles.footer}>
                    <AppButton
                        title={loading ? "Please wait..." : "Continue"}
                        onPress={handleContinue}
                        disabled={loading}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const PURPLE = "#7B2FE0";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5F5FA",
    },
    scroll: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
    },

    // Header
    header: {
        alignItems: "center",
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1A1A2E",
        marginBottom: 10,
        letterSpacing: 0.2,
    },
    subtitle: {
        fontSize: 14,
        color: "#9B9BAD",
        textAlign: "center",
        lineHeight: 21,
    },

    // Form
    form: {
        gap: 14,
    },

    // Dropdown
    dropdown: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#EFEFEF",
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 18,
    },
    dropdownDisabled: {
        opacity: 0.5,
    },
    dropdownText: {
        fontSize: 15,
        color: "#1A1A2E",
        fontWeight: "400",
    },
    dropdownPlaceholder: {
        color: "#9B9BAD",
    },
    chevron: {
        fontSize: 20,
        color: "#555",
        lineHeight: 22,
        marginTop: -4,
    },
    chevronDisabled: {
        color: "#aaa",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    modalSheet: {
        backgroundColor: "#fff",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingBottom: 36,
        maxHeight: "60%",
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#1A1A2E",
        textAlign: "center",
        marginBottom: 12,
        paddingHorizontal: 24,
    },
    modalItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
    },
    modalItemSelected: {
        backgroundColor: "#F3EAFF",
    },
    modalItemText: {
        fontSize: 15,
        color: "#1A1A2E",
    },
    modalItemTextSelected: {
        color: PURPLE,
        fontWeight: "600",
    },
    checkmark: {
        fontSize: 16,
        color: PURPLE,
        fontWeight: "700",
    },

    // Footer
    footer: {
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === "ios" ? 8 : 58,
        paddingTop: 12,
        backgroundColor: "#F5F5FA",
    },
});
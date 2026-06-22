import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

import { auth, db, storage } from "@/lib/firebase";
import PaymentScreen from "@/components/ui/paymentScreen";

export default function PaymentPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (receiptUri: string | null) => {
        if (!receiptUri) {
            Alert.alert("Error", "Please upload a receipt first.");
            return;
        }

        const user = auth.currentUser;
        if (!user) {
            Alert.alert("Error", "You must be logged in.");
            return;
        }

        try {
            setIsSubmitting(true);

            // Upload receipt to Firebase Storage
            const response = await fetch(receiptUri);
            const blob = await response.blob();
            const receiptRef = ref(storage, `receipts/${user.uid}/${Date.now()}`);
            await uploadBytes(receiptRef, blob);
            const receiptUrl = await getDownloadURL(receiptRef);

            // Update subscription status to 'pending' in Firestore
            await updateDoc(doc(db, "users", user.uid), {
                subscriptionStatus: "pending",
                receiptUrl,
                receiptSubmittedAt: new Date().toISOString(),
            });

            router.push("/pendingScreen");
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PaymentScreen
            amount="₦800"
            accountName="Bizilink Tech Ng"
            bankName="Access Bank, Plc"
            accountNo="1221244910"
            onSubmit={handleSubmit}
            onBackToHome={() => router.push("/(tabs)/index" as any)}
            isSubmitting={isSubmitting}
        />
    );
}
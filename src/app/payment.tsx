import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { Alert } from "react-native";

import PaymentScreen from "@/components/ui/paymentScreen";
import { auth, db, storage } from "@/lib/firebase";

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

            // Convert local file URI to Blob using XMLHttpRequest
            const blob: any = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response);
                };
                xhr.onerror = function (e) {
                    console.log(e);
                    reject(new TypeError("Network request failed"));
                };
                xhr.responseType = "blob";
                xhr.open("GET", receiptUri, true);
                xhr.send(null);
            });

            try {
                // Upload receipt to Firebase Storage
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
            } finally {
                if (blob && typeof blob.close === "function") {
                    blob.close();
                }
            }
        } catch (error: any) {
            Alert.alert("Error", error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PaymentScreen
            amount="₦1000"
            accountName="Bizilink Tech Ng"
            bankName="Access Bank, Plc"
            accountNo="1221244910"
            onSubmit={handleSubmit}
            onBackToHome={() => router.push("/(tabs)/home" as any)}
            isSubmitting={isSubmitting}
        />
    );
}
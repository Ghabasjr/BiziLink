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

            // 1. Fetch file uri to blob (with XHR fallback)
            let blob: Blob;
            try {
                const res = await fetch(receiptUri);
                blob = await res.blob();
            } catch (fetchErr) {
                console.warn("fetch blob failed, trying XHR fallback...", fetchErr);
                blob = await new Promise((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.onload = () => resolve(xhr.response as Blob);
                    xhr.onerror = () => reject(new TypeError("Network request failed — could not read receipt file."));
                    xhr.responseType = "blob";
                    xhr.open("GET", receiptUri, true);
                    xhr.send(null);
                });
            }

            try {
                const mimeType = blob.type || "image/jpeg";
                const receiptRef = ref(storage, `receipts/${user.uid}/${Date.now()}`);

                // Upload using uploadBytes for robust single-request upload in React Native
                await uploadBytes(receiptRef, blob, { contentType: mimeType });

                const receiptUrl = await getDownloadURL(receiptRef);

                // Update subscription status to 'pending' in Firestore
                await updateDoc(doc(db, "users", user.uid), {
                    subscriptionStatus: "pending",
                    receiptUrl,
                    receiptSubmittedAt: new Date().toISOString(),
                });

                router.push("/pendingScreen");
            } finally {
                if (blob && typeof (blob as any).close === "function") {
                    (blob as any).close();
                }
            }
        } catch (error: any) {
            console.error("Receipt upload failure details:", {
                code: error?.code,
                message: error?.message,
                serverResponse: error?.serverResponse,
                customData: error?.customData,
            });

            const codeStr = error?.code ? ` (${error.code})` : "";
            const detailStr = error?.serverResponse || error?.message || "An unexpected error occurred.";
            Alert.alert("Upload Error", `Upload failed${codeStr}: ${detailStr}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PaymentScreen
            amount="₦500"
            accountName="SHUAIBU ALIYU"
            bankName="OPay"
            accountNo=" 6450393378"
            onSubmit={handleSubmit}
            onBackToHome={() => router.push("/(tabs)/home" as any)}
            isSubmitting={isSubmitting}
        />
    );
}

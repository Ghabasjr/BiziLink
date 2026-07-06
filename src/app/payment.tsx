import { useRouter } from "expo-router";
import { doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
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
            const blob: Blob = await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    resolve(xhr.response as Blob);
                };
                xhr.onerror = function () {
                    reject(new TypeError("Network request failed — could not read receipt file."));
                };
                xhr.responseType = "blob";
                xhr.open("GET", receiptUri, true);
                xhr.send(null);
            });

            try {
                // Determine MIME type from blob (fall back to image/jpeg)
                // A missing content-type is a common cause of storage/unknown errors
                const mimeType = blob.type || "image/jpeg";

                // Upload receipt to Firebase Storage with an explicit content-type
                const receiptRef = ref(storage, `receipts/${user.uid}/${Date.now()}`);
                const uploadTask = uploadBytesResumable(blob, { contentType: mimeType });

                await new Promise<void>((resolve, reject) => {
                    uploadTask.on(
                        "state_changed",
                        null, // no progress tracking needed
                        (error) => {
                            console.error("Upload error:", error.code, error.message);
                            reject(error);
                        },
                        () => resolve()
                    );
                });

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
            // Surface the Firebase error code when available for easier diagnosis
            const message = error?.code
                ? `Upload failed (${error.code}): ${error.message}`
                : error?.message || "An unexpected error occurred.";
            Alert.alert("Upload Error", message);
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
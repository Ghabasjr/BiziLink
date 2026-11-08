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
                console.log("[Payment] Blob info:", {
                    size: blob.size,
                    type: blob.type,
                    mimeTypeUsed: mimeType,
                });

                const storagePath = `receipts/${user.uid}/${Date.now()}`;
                const receiptRef = ref(storage, storagePath);
                console.log("[Payment] Uploading to path:", storagePath);

                // Upload using uploadBytes for robust single-request upload in React Native
                await uploadBytes(receiptRef, blob, { contentType: mimeType });
                console.log("[Payment] uploadBytes succeeded.");

                const receiptUrl = await getDownloadURL(receiptRef);
                console.log("[Payment] Download URL obtained:", receiptUrl);

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
            // ── Full error dump so we can identify the storage/unknown cause ──
            console.error("[Payment] ❌ Receipt upload FAILED — full error object:", error);
            console.error("[Payment] Error code:", error?.code);
            console.error("[Payment] Error message:", error?.message);
            console.error("[Payment] Error stack:", error?.stack);
            console.error("[Payment] customData:", JSON.stringify(error?.customData, null, 2));
            console.error("[Payment] serverResponse:", error?.serverResponse);
            // Firebase Storage attaches the raw HTTP response body in customData._baseMessage or similar
            console.error("[Payment] customData._baseMessage:", error?.customData?._baseMessage);
            console.error("[Payment] customData.serverResponse:", error?.customData?.serverResponse);

            const codeStr = error?.code ? ` (${error.code})` : "";
            const detailStr = error?.serverResponse
                ?? error?.customData?.serverResponse
                ?? error?.message
                ?? "An unexpected error occurred.";
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


//  WARN  [2026-08-26T04:54:28.823Z]  @firebase/firestore: Firestore (12.15.0): WebChannelConnection RPC 'Listen' stream 0x27d76f6f transport errored. Name: undefined Message: undefined
//  ERROR  [Payment] ❌ Receipt upload FAILED — full error object: [FirebaseError: Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown)] FirebaseError: Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown)
//  ERROR  [Payment] Error code: storage/unknown 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] Error message: Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown) 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] Error stack: FirebaseError: Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown) 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] customData: {} 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] serverResponse: undefined 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] customData._baseMessage: undefined 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)
//  ERROR  [Payment] customData.serverResponse: undefined 

// Call Stack
//   apply (<native>)
//   NamelessError (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   captureCurrentStack (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   HMRClient.log (node_modules\@expo\metro-runtime\src\metroServerLogs.native.ts)
//   console.level (node_modules\react-native\Libraries\Core\setUpDeveloperTools.js)
//   handleSubmit (src\app\payment.tsx)
//   throw (<native>)
//   anonymous (address at (InternalBytecode.js:1:8791)
//   step (address at (InternalBytecode.js:1:6505)
//   anonymous (address at (InternalBytecode.js:1:7697)
//   tryCallOne (address at (InternalBytecode.js:1:1274)
//   anonymous (address at (InternalBytecode.js:1:4865)

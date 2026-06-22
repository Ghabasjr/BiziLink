import { useState } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

import { auth, db, storage } from "@/lib/firebase";
import AddProductScreen from "@/components/addProductScreen";

export default function AddProductDetailsPage() {
  const router = useRouter();
  const { categoryName } = useLocalSearchParams<{ categoryName: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async (data: any) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "You must be logged in.");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload images to Firebase Storage
      const uploadedImageUrls = await Promise.all(
        data.images.map(async (uri: string, index: number) => {
          const response = await fetch(uri);
          const blob = await response.blob();
          const imageRef = ref(storage, `products/${user.uid}/${Date.now()}_${index}`);
          await uploadBytes(imageRef, blob);
          return await getDownloadURL(imageRef);
        })
      );

      // Save product to Firestore
      await addDoc(collection(db, "products"), {
        storeId: user.uid,
        name: data.brandName, // Using brandName as the product name for now
        price: parseFloat(data.productPrice),
        category: data.category,
        images: uploadedImageUrls,
        isOutOfStock: data.stockStatus === "OUT_OF_STOCK",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Product added successfully!");
      router.replace("/(tabs)/index" as any);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AddProductScreen
      categoryName={categoryName}
      isSubmitting={isSubmitting}
      onBack={() => router.back()}
      onSaveDraft={(data) => {
        Alert.alert("Notice", "Drafts are not fully implemented yet.");
      }}
      onPublish={handlePublish}
      onAddMore={async (data) => {
         await handlePublish(data);
         // If successful, navigate back to add another
         router.replace("/add-Product/index" as any);
      }}
    />
  );
}
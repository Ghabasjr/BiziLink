import SelectCategoryScreen from "@/components/selectCategory";
import { useRouter } from "expo-router";

export default function AddProductPage() {
    const router = useRouter();
    return (
        <SelectCategoryScreen
            onBack={() => router.back()}
            onContinue={(category) => {
                router.push({
                    pathname: "/add-product/details",
                    params: { categoryId: category.id, categoryName: category.name },
                });
            }}
        />
    );
}
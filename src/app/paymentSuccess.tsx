import PaymentSuccessScreen from "@/components/ui/paymentSucccess";
import { useRouter } from "expo-router";

export default function PaymentSuccessPage() {
    const router = useRouter();
    return <PaymentSuccessScreen onGoHome={() => router.replace("/(tabs)")} />;
}
import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../firebase/config";
import { doc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";

const PremiumContext = createContext();

export const usePremium = () => useContext(PremiumContext);

// Free features (accessible without premium)
export const FREE_FEATURES = ["/vasiyet", "/borclar", "/helallik", "/hayir-vasiyetleri", "/dashboard", "/profil", "/gizlilik", "/ilham", "/onboarding"];

export const PLANS = [
    {
        id: "basic",
        name: "Temel Plan",
        monthlyPrice: 99,
        annualPrice: 999,
        currency: "₺",
        features: ["Tüm modüllere erişim", "PDF dışa aktarma", "Sınırsız kayıt", "E-posta desteği"],
        hasAnnual: true,
        popular: true,
    },
    {
        id: "pro",
        name: "Pro Plan",
        monthlyPrice: 149,
        annualPrice: null,
        currency: "₺",
        features: ["Tüm Temel Plan özellikleri", "Öncelikli destek", "Gelişmiş raporlama", "Aile hesabı (yakında)"],
        hasAnnual: false,
        popular: false,
    }
];

export const PremiumProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        const unsub = onSnapshot(doc(db, "subscriptions", currentUser.uid), (snap) => {
            if (snap.exists()) {
                setSubscription(snap.data());
            } else {
                setSubscription(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Subscription listener error:", error);
            setLoading(false);
        });

        return unsub;
    }, [currentUser]);

    const isPremium = (() => {
        if (!subscription) return false;
        if (subscription.status === "active") return true;
        // Check trial
        if (subscription.status === "trial" && subscription.trialEnd) {
            const trialEnd = subscription.trialEnd.toDate ? subscription.trialEnd.toDate() : new Date(subscription.trialEnd);
            return new Date() < trialEnd;
        }
        // Check reward (from sharing)
        if (subscription.status === "rewarded" && subscription.rewardEnd) {
            const rewardEnd = subscription.rewardEnd.toDate ? subscription.rewardEnd.toDate() : new Date(subscription.rewardEnd);
            return new Date() < rewardEnd;
        }
        return false;
    })();

    const isFeatureLocked = (path) => {
        if (isPremium) return false;
        return !FREE_FEATURES.includes(path);
    };

    const startTrial = async () => {
        if (!currentUser) return;
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3); // 3 day trial
        await setDoc(doc(db, "subscriptions", currentUser.uid), {
            status: "trial",
            trialEnd: trialEnd,
            plan: null,
            startedAt: serverTimestamp()
        });
    };

    const subscribeToPlan = async (planId, billing) => {
        if (!currentUser) return;
        // In a production app, this would integrate with Stripe/RevenueCat
        // For now, we simply set the subscription status
        await setDoc(doc(db, "subscriptions", currentUser.uid), {
            status: "active",
            plan: planId,
            billing: billing, // "monthly" or "annual"
            startedAt: serverTimestamp()
        }, { merge: true });
    };

    const handleShareSuccess = async () => {
        if (!currentUser) return;
        const today = new Date().toISOString().split('T')[0];

        const currentData = subscription || {};
        const lastShareDate = currentData.lastShareDate;
        let streak = currentData.shareStreak || 0;

        if (lastShareDate === today) return; // Already shared today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastShareDate === yesterdayStr) {
            streak += 1;
        } else {
            streak = 1;
        }

        const updateData = {
            lastShareDate: today,
            shareStreak: streak,
            updatedAt: serverTimestamp()
        };

        if (streak >= 3) {
            const rewardEnd = new Date();
            rewardEnd.setHours(rewardEnd.getHours() + 24);
            updateData.status = "rewarded";
            updateData.rewardEnd = rewardEnd;
            updateData.shareStreak = 0; // Reset after reward
            toast.success("Tebrikler! 3 gün üst üste paylaşım yaptığınız için 24 saatlik Premium hediye edildi! 🎉");
        } else {
            toast.success(`Paylaşım kaydedildi! Premium hediye için ${3 - streak} gün daha paylaşın. 🔥`);
        }

        await setDoc(doc(db, "subscriptions", currentUser.uid), updateData, { merge: true });
    };

    const daysLeftInTrial = (() => {
        if (!subscription || subscription.status !== "trial" || !subscription.trialEnd) return 0;
        const trialEnd = subscription.trialEnd.toDate ? subscription.trialEnd.toDate() : new Date(subscription.trialEnd);
        const diff = trialEnd - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    })();

    const value = {
        subscription,
        isPremium,
        isFeatureLocked,
        startTrial,
        subscribeToPlan,
        handleShareSuccess,
        daysLeftInTrial,
        loading,
        PLANS
    };

    return (
        <PremiumContext.Provider value={value}>
            {children}
        </PremiumContext.Provider>
    );
};

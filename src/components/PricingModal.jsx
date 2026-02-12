import { useState } from "react";
import { usePremium } from "../context/PremiumContext";
import { FaCheck, FaTimes, FaCrown, FaStar, FaRocket } from "react-icons/fa";
import toast from "react-hot-toast";

const PricingModal = ({ isOpen, onClose }) => {
    const { startTrial, subscribeToPlan, PLANS, isPremium, daysLeftInTrial, subscription } = usePremium();
    const [selectedBilling, setSelectedBilling] = useState("annual"); // annual or monthly
    const [processing, setProcessing] = useState(false);

    if (!isOpen) return null;

    const handleStartTrial = async () => {
        setProcessing(true);
        try {
            await startTrial();
            toast.success("3 günlük ücretsiz deneme başlatıldı! 🎉");
            onClose();
        } catch {
            toast.error("Deneme başlatılamadı.");
        } finally {
            setProcessing(false);
        }
    };

    const handleSubscribe = async (planId) => {
        setProcessing(true);
        try {
            await subscribeToPlan(planId, selectedBilling);
            toast.success("Abonelik başarıyla aktifleştirildi! 🎉");
            onClose();
        } catch {
            toast.error("Abonelik işlemi başarısız.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-8 rounded-t-2xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <FaCrown className="absolute top-4 right-8 text-6xl rotate-12" />
                        <FaStar className="absolute bottom-4 left-8 text-4xl -rotate-12" />
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white transition">
                        <FaTimes className="text-xl" />
                    </button>
                    <FaCrown className="mx-auto text-yellow-400 text-4xl mb-3" />
                    <h2 className="text-2xl font-bold">Premium'a Yükselt</h2>
                    <p className="text-blue-200 mt-2">Tüm özelliklerin kilidini açın ve vasiyetinizi eksiksiz tamamlayın.</p>
                </div>

                {/* Trial Banner */}
                {!isPremium && !subscription && (
                    <div className="mx-6 mt-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-center">
                        <p className="text-emerald-800 font-semibold">🎁 3 Gün Ücretsiz Deneyin!</p>
                        <p className="text-sm text-emerald-600 mt-1">Kredi kartı gerekmez. Tüm özellikleri 3 gün boyunca ücretsiz kullanın.</p>
                        <button
                            onClick={handleStartTrial}
                            disabled={processing}
                            className="mt-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60"
                        >
                            {processing ? "İşleniyor..." : "Ücretsiz Denemeyi Başlat"}
                        </button>
                    </div>
                )}

                {/* Billing Toggle */}
                <div className="flex justify-center mt-6">
                    <div className="bg-gray-100 rounded-xl p-1 flex">
                        <button
                            onClick={() => setSelectedBilling("monthly")}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${selectedBilling === "monthly" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
                        >
                            Aylık
                        </button>
                        <button
                            onClick={() => setSelectedBilling("annual")}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${selectedBilling === "annual" ? "bg-white shadow text-gray-800" : "text-gray-500"}`}
                        >
                            Yıllık <span className="text-emerald-600 text-xs ml-1">Tasarruf!</span>
                        </button>
                    </div>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                    {PLANS.map((plan) => {
                        const price = selectedBilling === "annual" && plan.hasAnnual
                            ? (plan.annualPrice / 12).toFixed(2)
                            : plan.monthlyPrice.toFixed(2);
                        const totalAnnual = plan.hasAnnual ? plan.annualPrice : null;

                        return (
                            <div key={plan.id} className={`border-2 rounded-2xl p-6 relative transition-all hover:-translate-y-1 hover:shadow-lg ${plan.popular ? "border-blue-500 bg-blue-50/30" : "border-gray-200"}`}>
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                        EN POPÜLER
                                    </div>
                                )}
                                <h3 className="text-lg font-bold text-gray-800">{plan.name}</h3>
                                <div className="mt-3">
                                    <span className="text-3xl font-black text-gray-900">{plan.currency}{price}</span>
                                    <span className="text-gray-500 text-sm">/ay</span>
                                </div>
                                {selectedBilling === "annual" && plan.hasAnnual && (
                                    <p className="text-sm text-emerald-600 mt-1">
                                        Yıllık {plan.currency}{totalAnnual} — ayda {plan.currency}{price}
                                    </p>
                                )}
                                {selectedBilling === "annual" && !plan.hasAnnual && (
                                    <p className="text-sm text-gray-400 mt-1">Yıllık plan mevcut değil</p>
                                )}
                                <ul className="mt-4 space-y-2">
                                    {plan.features.map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <FaCheck className="text-emerald-500 flex-shrink-0" />
                                            {feat}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={processing || isPremium}
                                    className={`w-full mt-5 py-3 rounded-xl font-bold transition-all hover:-translate-y-0.5 shadow-md disabled:opacity-60 min-h-[48px] ${plan.popular
                                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                                        : "bg-gray-800 hover:bg-gray-900 text-white"
                                        }`}
                                >
                                    <FaRocket className="inline mr-2" />
                                    {isPremium ? "Aktif Abonelik" : processing ? "İşleniyor..." : "Abone Ol"}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 text-center">
                    <p className="text-xs text-gray-400">
                        İstediğiniz zaman iptal edebilirsiniz. Abonelik otomatik yenilenir.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;

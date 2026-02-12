import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
    FaMosque, FaPray, FaMoon, FaHandHoldingHeart, FaSave, FaInfoCircle
} from "react-icons/fa";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { formatCurrency } from "../utils/formatters";
import { handleFirebaseError } from "../utils/errorHandler";

const defaultData = {
    prayers: { sabah: 0, ogle: 0, ikindi: 0, aksam: 0, yatsi: 0 },
    fasting: { count: 0 },
    financial: { fidye: 0, zekat: 0, kurban: 0 }
};

const ReligiousObligations = () => {
    const { currentUser } = useAuth();
    const [data, setData] = useState(defaultData);
    const [loading, setLoading] = useState(true);
    const [savingSection, setSavingSection] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, "religious_obligations", currentUser.uid));
                if (docSnap.exists()) {
                    const d = docSnap.data();
                    setData({
                        prayers: d.prayers || defaultData.prayers,
                        fasting: d.fasting || defaultData.fasting,
                        financial: d.financial || defaultData.financial
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentUser]);

    const saveSection = async (section) => {
        if (!currentUser) return;
        setSavingSection(section);
        try {
            await setDoc(doc(db, "religious_obligations", currentUser.uid), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success("Başarıyla güncellendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setSavingSection(null);
        }
    };

    const updatePrayer = (key, value) => {
        setData(prev => ({ ...prev, prayers: { ...prev.prayers, [key]: Math.max(0, parseInt(value) || 0) } }));
    };

    const totalPrayers = Object.values(data.prayers).reduce((sum, v) => sum + v, 0);

    const prayerFields = [
        { key: "sabah", label: "Sabah", emoji: "🌅" },
        { key: "ogle", label: "Öğle", emoji: "☀️" },
        { key: "ikindi", label: "İkindi", emoji: "🌤️" },
        { key: "aksam", label: "Akşam", emoji: "🌇" },
        { key: "yatsi", label: "Yatsı", emoji: "🌙" },
    ];

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div><div className="h-40 bg-gray-200 rounded"></div></Card>
                <Card className="p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div><div className="h-20 bg-gray-200 rounded"></div></Card>
                <Card className="p-6 animate-pulse"><div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div><div className="h-32 bg-gray-200 rounded"></div></Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-emerald-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaMosque className="text-emerald-600" /> Dini Yükümlülükler
                    </h1>
                    <p className="text-gray-500 mt-1">Kaza ibadetlerinizi ve dini mali yükümlülüklerinizi takip edin.</p>
                </div>
            </Card>

            {/* Info Banner */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-start gap-3">
                <FaInfoCircle className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                    Kaza ibadetlerinizi buradan takip edebilirsiniz. Veriler otomatik olarak kaydedilmez;
                    her bölümü güncelledikten sonra <strong>"Güncelle"</strong> butonuna basınız.
                </p>
            </div>

            {/* Section 1: Kaza Namazlar */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaPray className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Kaza Namazları</h2>
                            <p className="text-blue-200 text-sm">Kılınmamış namaz sayılarınızı giriniz.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                        {prayerFields.map(p => (
                            <div key={p.key} className="text-center">
                                <span className="text-2xl">{p.emoji}</span>
                                <label className="block text-sm font-medium text-gray-600 mt-1 mb-2">{p.label}</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={data.prayers[p.key]}
                                    onChange={e => updatePrayer(p.key, e.target.value)}
                                    className="w-full text-center text-xl font-bold py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 min-h-[44px]"
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="bg-blue-50 px-4 py-2 rounded-lg">
                            <span className="text-sm text-gray-500">Toplam Kaza: </span>
                            <span className="text-xl font-bold text-blue-700">{totalPrayers}</span>
                        </div>
                        <Button onClick={() => saveSection("prayers")} disabled={savingSection === "prayers"} variant="primary" className="flex items-center gap-2">
                            <FaSave /> {savingSection === "prayers" ? "Kaydediliyor..." : "Güncelle"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Section 2: Kaza Oruçlar */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-700 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaMoon className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Kaza Oruçları</h2>
                            <p className="text-orange-200 text-sm">Tutulmamış oruç sayınızı giriniz.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="max-w-xs">
                        <label className="block text-sm font-medium text-gray-600 mb-2">Tutulmamış Oruç Sayısı</label>
                        <input
                            type="number"
                            min="0"
                            value={data.fasting.count}
                            onChange={e => setData(prev => ({ ...prev, fasting: { count: Math.max(0, parseInt(e.target.value) || 0) } }))}
                            className="w-full text-center text-2xl font-bold py-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 min-h-[44px]"
                        />
                    </div>
                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                        <Button onClick={() => saveSection("fasting")} disabled={savingSection === "fasting"} variant="primary" className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
                            <FaSave /> {savingSection === "fasting" ? "Kaydediliyor..." : "Güncelle"}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Section 3: Fidye / Zekat / Kurban */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaHandHoldingHeart className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Fidye, Zekat & Kurban</h2>
                            <p className="text-emerald-200 text-sm">Mali ibadet yükümlülüklerinizi takip edin.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Fidye Borcu (₺)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.financial.fidye}
                                onChange={e => setData(prev => ({ ...prev, financial: { ...prev.financial, fidye: parseFloat(e.target.value) || 0 } }))}
                                className="w-full text-lg font-bold py-3 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 min-h-[44px]"
                            />
                            <p className="text-xs text-gray-400 mt-1">{formatCurrency(data.financial.fidye)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Zekat Borcu (₺)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={data.financial.zekat}
                                onChange={e => setData(prev => ({ ...prev, financial: { ...prev.financial, zekat: parseFloat(e.target.value) || 0 } }))}
                                className="w-full text-lg font-bold py-3 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 min-h-[44px]"
                            />
                            <p className="text-xs text-gray-400 mt-1">{formatCurrency(data.financial.zekat)}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Kurban Borcu (Adet)</label>
                            <input
                                type="number"
                                min="0"
                                value={data.financial.kurban}
                                onChange={e => setData(prev => ({ ...prev, financial: { ...prev.financial, kurban: Math.max(0, parseInt(e.target.value) || 0) } }))}
                                className="w-full text-lg font-bold py-3 px-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 min-h-[44px]"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end mt-6 pt-4 border-t border-gray-100">
                        <Button onClick={() => saveSection("financial")} disabled={savingSection === "financial"} variant="primary" className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                            <FaSave /> {savingSection === "financial" ? "Kaydediliyor..." : "Güncelle"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ReligiousObligations;

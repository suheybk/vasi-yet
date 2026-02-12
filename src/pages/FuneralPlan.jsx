import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
    FaMosque, FaMapMarkerAlt, FaPray, FaInfoCircle,
    FaSave, FaCheckSquare, FaBook
} from "react-icons/fa";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { handleFirebaseError } from "../utils/errorHandler";

const defaultData = {
    burial: { location: "", graveyard: "", shroudWish: "" },
    prayer: { mosque: "", imam: "", specialRequest: "" },
    ceremony: { mevlit: false, meal: false, otherWishes: "" }
};

const FuneralPlan = () => {
    const { currentUser } = useAuth();
    const [data, setData] = useState(defaultData);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, "funeral_plan", currentUser.uid));
                if (docSnap.exists()) {
                    const d = docSnap.data();
                    setData({
                        burial: d.burial || defaultData.burial,
                        prayer: d.prayer || defaultData.prayer,
                        ceremony: d.ceremony || defaultData.ceremony
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

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "funeral_plan", currentUser.uid), {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
            toast.success("Cenaze planı güncellendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setSaving(false);
        }
    };

    const updateBurial = (key, value) => setData(prev => ({ ...prev, burial: { ...prev.burial, [key]: value } }));
    const updatePrayer = (key, value) => setData(prev => ({ ...prev, prayer: { ...prev.prayer, [key]: value } }));
    const updateCeremony = (key, value) => setData(prev => ({ ...prev, ceremony: { ...prev.ceremony, [key]: value } }));

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="p-6 animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-10 bg-gray-200 rounded"></div>
                            <div className="h-10 bg-gray-200 rounded"></div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaMosque className="text-gray-700" /> Cenaze Planı
                    </h1>
                    <p className="text-gray-500 mt-1">Cenaze merasimi için isteklerinizi kaydedin.</p>
                </div>
            </Card>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <FaInfoCircle className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-700">
                    Cenaze planınız yalnızca bilgilendirme amaçlıdır. Tüm alanlar isteğe bağlıdır;
                    doldurmak istediğiniz bölümleri doldurabilirsiniz.
                </p>
            </div>

            {/* Section 1: Defin İstekleri */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaMapMarkerAlt className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Defin İstekleri</h2>
                            <p className="text-gray-300 text-sm">Defnedilmek istediğiniz yer ve mezar bilgileri.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <Input
                        label="Defnedilmek İstediğiniz Yer"
                        value={data.burial.location}
                        onChange={e => updateBurial("location", e.target.value)}
                        placeholder="Örn: İstanbul, Karacaahmet Mezarlığı"
                    />
                    <Input
                        label="Mezar Yeri"
                        value={data.burial.graveyard}
                        onChange={e => updateBurial("graveyard", e.target.value)}
                        placeholder="Örn: Aile kabristanı, belirli bir ada/parsel"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kefen İsteği</label>
                        <textarea
                            value={data.burial.shroudWish}
                            onChange={e => updateBurial("shroudWish", e.target.value)}
                            placeholder="Kefen ile ilgili özel isteğiniz varsa belirtiniz..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300 min-h-[80px] resize-y"
                        ></textarea>
                    </div>
                </div>
            </Card>

            {/* Section 2: Cenaze Namazı */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaPray className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Cenaze Namazı</h2>
                            <p className="text-emerald-200 text-sm">Cenaze namazının kılınması ile ilgili istekleriniz.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <Input
                        label="Kılınacağı Yer"
                        value={data.prayer.mosque}
                        onChange={e => updatePrayer("mosque", e.target.value)}
                        placeholder="Örn: Fatih Camii, Sultanahmet Camii"
                    />
                    <Input
                        label="Kıldırmak İstediğiniz Kişi (Opsiyonel)"
                        value={data.prayer.imam}
                        onChange={e => updatePrayer("imam", e.target.value)}
                        placeholder="Örn: Mahalle imamı, belirli bir hoca"
                    />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Özel İstek</label>
                        <textarea
                            value={data.prayer.specialRequest}
                            onChange={e => updatePrayer("specialRequest", e.target.value)}
                            placeholder="Cenaze namazı ile ilgili özel istekleriniz..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 min-h-[80px] resize-y"
                        ></textarea>
                    </div>
                </div>
            </Card>

            {/* Section 3: Tören Detayları */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-800 p-5 text-white">
                    <div className="flex items-center gap-3">
                        <FaBook className="text-2xl" />
                        <div>
                            <h2 className="text-xl font-bold">Tören Detayları</h2>
                            <p className="text-amber-200 text-sm">Mevlit, yemek ve diğer tören istekleriniz.</p>
                        </div>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="mevlit"
                            checked={data.ceremony.mevlit}
                            onChange={e => updateCeremony("mevlit", e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="mevlit" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                            <FaCheckSquare className="text-amber-500" /> Mevlit okutulsun
                        </label>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="meal"
                            checked={data.ceremony.meal}
                            onChange={e => updateCeremony("meal", e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="meal" className="text-sm font-medium text-gray-700 cursor-pointer flex items-center gap-2">
                            <FaCheckSquare className="text-amber-500" /> Yemek verilsin
                        </label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Diğer İstekler</label>
                        <textarea
                            value={data.ceremony.otherWishes}
                            onChange={e => updateCeremony("otherWishes", e.target.value)}
                            placeholder="Cenaze töreni ile ilgili diğer istekleriniz..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-300 min-h-[100px] resize-y"
                        ></textarea>
                    </div>
                </div>
            </Card>

            {/* Save Button */}
            <Card className="p-6">
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving} variant="primary" className="flex items-center gap-2 px-8 py-3 text-lg bg-gray-800 hover:bg-gray-900">
                        <FaSave /> {saving ? "Kaydediliyor..." : "Güncelle"}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default FuneralPlan;

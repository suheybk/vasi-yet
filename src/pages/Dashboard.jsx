import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot } from "firebase/firestore";
import {
    FaCoins, FaGem, FaScroll, FaUserFriends, FaQuoteRight,
    FaChartLine, FaPercentage, FaCalendarAlt, FaBuilding,
    FaBoxOpen, FaArrowRight, FaPlus, FaShieldAlt
} from "react-icons/fa";
import Card from "../components/ui/Card";
import { formatCurrency } from "../utils/formatters";

const Dashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        debtsCount: 0, creditsCount: 0, hasTestament: false, contactsCount: 0,
        totalDebt: 0, totalCredit: 0, paidDebts: 0, paidCredits: 0,
        totalDebts: 0, totalCredits: 0, nearestDueCredit: null,
        assetsCount: 0, totalAssetValue: 0, trustsCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState({ text: "", source: "" });

    const quotes = [
        { text: "Her nefis ölümü tadacaktır. Sizi bir imtihan olarak hayır ile de şer ile de deniyoruz. Ancak bize döndürüleceksiniz.", source: "Enbiyâ Suresi, 35. Ayet" },
        { text: "Ey iman edenler! Allah'tan korkun ve herkes, yarına ne hazırladığına baksın. Allah'tan korkun, çünkü Allah yaptıklarınızdan haberdardır.", source: "Haşr Suresi, 18. Ayet" },
        { text: "O gün ne mal fayda verir ne de evlat. Ancak Allah'a selim bir kalp ile gelenler (o günde fayda bulur).", source: "Şuarâ Suresi, 88-89. Ayet" },
        { text: "Dünya hayatı bir oyun ve eğlenceden ibarettir. Ahiret yurdu ise, Allah'tan korkanlar için daha hayırlıdır. Hâlâ akıllanmayacak mısınız?", source: "En'âm Suresi, 32. Ayet" },
        { text: "Şüphesiz biz Allah'tan geldik ve şüphesiz dönüşümüz O'nadır.", source: "Bakara Suresi, 156. Ayet" }
    ];

    useEffect(() => {
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);

        if (!currentUser) return;
        setLoading(true);

        let loadedCount = 0;
        const totalToLoad = 6;
        const checkLoaded = () => { loadedCount++; if (loadedCount >= totalToLoad) setLoading(false); };

        const unsubDebts = onSnapshot(collection(db, "debts", currentUser.uid, "items"), (snapshot) => {
            const items = snapshot.docs.map(d => d.data());
            const unpaid = items.filter(i => !i.isPaid);
            const totalDebt = unpaid.reduce((sum, i) => sum + (i.amount || 0), 0);
            const paidDebts = items.filter(i => i.isPaid).length;
            setStats(prev => ({ ...prev, debtsCount: unpaid.length, totalDebt, paidDebts, totalDebts: items.length }));
            checkLoaded();
        });

        const unsubCredits = onSnapshot(collection(db, "credits", currentUser.uid, "items"), (snapshot) => {
            const items = snapshot.docs.map(d => d.data());
            const unpaid = items.filter(i => !i.isPaid);
            const totalCredit = unpaid.reduce((sum, i) => sum + (i.amount || 0), 0);
            const paidCredits = items.filter(i => i.isPaid).length;
            const today = new Date().toISOString().split('T')[0];
            const upcoming = unpaid.filter(i => i.date && i.date >= today).sort((a, b) => a.date.localeCompare(b.date));
            const nearestDueCredit = upcoming.length > 0 ? upcoming[0] : null;
            setStats(prev => ({ ...prev, creditsCount: unpaid.length, totalCredit, paidCredits, totalCredits: items.length, nearestDueCredit }));
            checkLoaded();
        });

        const unsubTestament = onSnapshot(collection(db, "testaments", currentUser.uid, "items"), (snapshot) => {
            let hasContent = false;
            snapshot.docs.forEach(d => { if (d.data().text && d.data().text.trim().length > 0) hasContent = true; });
            setStats(prev => ({ ...prev, hasTestament: hasContent }));
            checkLoaded();
        });

        const unsubContacts = onSnapshot(collection(db, "contacts", currentUser.uid, "items"), (snapshot) => {
            setStats(prev => ({ ...prev, contactsCount: snapshot.size }));
            checkLoaded();
        });

        const unsubAssets = onSnapshot(collection(db, "assets", currentUser.uid, "items"), (snapshot) => {
            const items = snapshot.docs.map(d => d.data());
            const totalAssetValue = items.reduce((sum, i) => sum + (i.value || 0), 0);
            setStats(prev => ({ ...prev, assetsCount: items.length, totalAssetValue }));
            checkLoaded();
        });

        const unsubTrusts = onSnapshot(collection(db, "trusts", currentUser.uid, "items"), (snapshot) => {
            setStats(prev => ({ ...prev, trustsCount: snapshot.size }));
            checkLoaded();
        });

        return () => { unsubDebts(); unsubCredits(); unsubTestament(); unsubContacts(); unsubAssets(); unsubTrusts(); };
    }, [currentUser]);

    const debtPaymentPercent = stats.totalDebts > 0 ? Math.round((stats.paidDebts / stats.totalDebts) * 100) : 0;
    const creditPaymentPercent = stats.totalCredits > 0 ? Math.round((stats.paidCredits / stats.totalCredits) * 100) : 0;

    const StatCard = ({ title, value, icon, colorClass, onClick }) => (
        <Card className={`p-6 border-l-4 ${colorClass} hover:-translate-y-1 cursor-pointer transition-transform duration-200`} onClick={onClick}>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace('500', '100')}`}>
                    <span className={`text-2xl ${colorClass.replace('border-', 'text-')}`}>{icon}</span>
                </div>
            </div>
        </Card>
    );

    const SkeletonCard = () => (
        <Card className="p-6 animate-pulse">
            <div className="flex justify-between items-center">
                <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            </div>
        </Card>
    );

    const quickActions = [
        { label: "Borç Ekle", icon: <FaCoins />, path: "/borclar", color: "bg-red-500 hover:bg-red-600" },
        { label: "Alacak Ekle", icon: <FaGem />, path: "/alacaklar", color: "bg-green-500 hover:bg-green-600" },
        { label: "Vasiyet Yaz", icon: <FaScroll />, path: "/vasiyet", color: "bg-purple-500 hover:bg-purple-600" },
        { label: "Varlık Ekle", icon: <FaBuilding />, path: "/varliklar", color: "bg-yellow-500 hover:bg-yellow-600" },
        { label: "Emanet Ekle", icon: <FaBoxOpen />, path: "/emanetler", color: "bg-indigo-500 hover:bg-indigo-600" },
        { label: "Kişi Ekle", icon: <FaUserFriends />, path: "/kisiler", color: "bg-blue-500 hover:bg-blue-600" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                    <FaQuoteRight size={150} />
                </div>
                <h1 className="text-3xl font-bold relative z-10">Hoşgeldiniz, {userProfile?.displayName || currentUser?.displayName || currentUser?.email}</h1>
                <p className="mt-2 text-blue-100 relative z-10 max-w-2xl">
                    Bugün vasiyetinizi güncellemek veya mali durumunuzu gözden geçirmek için güzel bir gün.
                </p>
                <div className="mt-6 pt-6 border-t border-blue-400/30 relative z-10">
                    <p className="font-serif italic text-lg text-yellow-500">"{quote.text}"</p>
                    <p className="text-sm text-blue-200 mt-2">— {quote.source}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
                ) : (
                    <>
                        <StatCard title="Borçlarım" value={stats.debtsCount} icon={<FaCoins />} colorClass="border-red-500" onClick={() => navigate('/borclar')} />
                        <StatCard title="Alacaklarım" value={stats.creditsCount} icon={<FaGem />} colorClass="border-green-500" onClick={() => navigate('/alacaklar')} />
                        <StatCard title="Mal Varlığı" value={stats.assetsCount} icon={<FaBuilding />} colorClass="border-yellow-500" onClick={() => navigate('/varliklar')} />
                        <StatCard title="Emanetler" value={stats.trustsCount} icon={<FaBoxOpen />} colorClass="border-indigo-500" onClick={() => navigate('/emanetler')} />
                    </>
                )}
            </div>

            {/* Advanced Stats */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-5 bg-red-50 border border-red-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaChartLine className="text-red-500" />
                            <span className="text-sm font-medium text-gray-600">Toplam Borç</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalDebt)}</p>
                    </Card>
                    <Card className="p-5 bg-green-50 border border-green-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaChartLine className="text-green-500" />
                            <span className="text-sm font-medium text-gray-600">Toplam Alacak</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalCredit)}</p>
                    </Card>
                    <Card className="p-5 bg-amber-50 border border-amber-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaBuilding className="text-amber-600" />
                            <span className="text-sm font-medium text-gray-600">Toplam Varlık Değeri</span>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.totalAssetValue)}</p>
                    </Card>
                    <Card className="p-5 bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaPercentage className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-600">Ödeme Yüzdesi</span>
                        </div>
                        <p className="text-lg font-bold text-blue-700">
                            Borç: %{debtPaymentPercent} · Alacak: %{creditPaymentPercent}
                        </p>
                    </Card>
                </div>
            )}

            {/* Second Row: Status Cards */}
            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-5 bg-purple-50 border border-purple-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FaScroll className="text-purple-500" />
                                    <span className="text-sm font-medium text-gray-600">Vasiyet Durumu</span>
                                </div>
                                <p className={`text-xl font-bold ${stats.hasTestament ? 'text-green-600' : 'text-gray-400'}`}>
                                    {stats.hasTestament ? "✓ Oluşturulmuş" : "Henüz yazılmadı"}
                                </p>
                            </div>
                            <button onClick={() => navigate('/vasiyet')} className="p-3 bg-purple-100 hover:bg-purple-200 rounded-lg transition min-h-[44px] min-w-[44px]">
                                <FaArrowRight className="text-purple-600" />
                            </button>
                        </div>
                    </Card>
                    <Card className="p-5 bg-yellow-50 border border-yellow-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaCalendarAlt className="text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">En Yakın Vade</span>
                        </div>
                        {stats.nearestDueCredit ? (
                            <div>
                                <p className="text-lg font-bold text-yellow-800">{new Date(stats.nearestDueCredit.date).toLocaleDateString('tr-TR')}</p>
                                <p className="text-sm text-gray-500">{stats.nearestDueCredit.personName} – {formatCurrency(stats.nearestDueCredit.amount)}</p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold text-gray-400">Yaklaşan vade yok</p>
                        )}
                    </Card>
                    <Card className="p-5 bg-teal-50 border border-teal-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <FaUserFriends className="text-teal-500" />
                                    <span className="text-sm font-medium text-gray-600">Güvenilir Kişiler</span>
                                </div>
                                <p className="text-xl font-bold text-teal-700">{stats.contactsCount} kişi</p>
                            </div>
                            <button onClick={() => navigate('/kisiler')} className="p-3 bg-teal-100 hover:bg-teal-200 rounded-lg transition min-h-[44px] min-w-[44px]">
                                <FaArrowRight className="text-teal-600" />
                            </button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Quick Actions */}
            {!loading && (
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">Hızlı İşlemler</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        {quickActions.map((action, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(action.path)}
                                className={`${action.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 transition-transform hover:-translate-y-1 hover:shadow-lg min-h-[80px]`}
                            >
                                <span className="text-xl">{action.icon}</span>
                                <span className="text-xs font-medium">{action.label}</span>
                            </button>
                        ))}
                    </div>
                </Card>
            )}

            {/* Security Badge */}
            {!loading && (
                <Card className="p-4 bg-green-50 border border-green-200">
                    <div className="flex items-center gap-3">
                        <FaShieldAlt className="text-green-600 text-xl flex-shrink-0" />
                        <p className="text-sm text-green-700">
                            <strong>Verileriniz güvende.</strong> Tüm bilgileriniz 256-bit şifreleme ile korunmakta olup hiçbir koşulda üçüncü şahıslarla paylaşılmamaktadır.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default Dashboard;

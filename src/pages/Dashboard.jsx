import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import {
    FaCoins,
    FaGem,
    FaScroll,
    FaUserFriends,
    FaQuoteRight,
    FaChartLine,
    FaPercentage,
    FaCalendarAlt
} from "react-icons/fa";
import Card from "../components/ui/Card";
import { formatCurrency } from "../utils/formatters";

const Dashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        debtsCount: 0,
        creditsCount: 0,
        hasTestament: false,
        contactsCount: 0,
        totalDebt: 0,
        totalCredit: 0,
        paidDebts: 0,
        paidCredits: 0,
        totalDebts: 0,
        totalCredits: 0,
        nearestDueCredit: null
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
        const checkLoaded = () => { loadedCount++; if (loadedCount >= 4) setLoading(false); };

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
            // Find nearest due credit
            const today = new Date().toISOString().split('T')[0];
            const upcoming = unpaid
                .filter(i => i.date && i.date >= today)
                .sort((a, b) => a.date.localeCompare(b.date));
            const nearestDueCredit = upcoming.length > 0 ? upcoming[0] : null;
            setStats(prev => ({ ...prev, creditsCount: unpaid.length, totalCredit, paidCredits, totalCredits: items.length, nearestDueCredit }));
            checkLoaded();
        });

        const unsubTestament = onSnapshot(collection(db, "testaments", currentUser.uid, "items"), (snapshot) => {
            let hasContent = false;
            snapshot.docs.forEach(d => {
                if (d.data().text && d.data().text.trim().length > 0) hasContent = true;
            });
            setStats(prev => ({ ...prev, hasTestament: hasContent }));
            checkLoaded();
        });

        const unsubContacts = onSnapshot(collection(db, "contacts", currentUser.uid, "items"), (snapshot) => {
            setStats(prev => ({ ...prev, contactsCount: snapshot.size }));
            checkLoaded();
        });

        return () => {
            unsubDebts();
            unsubCredits();
            unsubTestament();
            unsubContacts();
        };
    }, [currentUser]);

    const debtPaymentPercent = stats.totalDebts > 0 ? Math.round((stats.paidDebts / stats.totalDebts) * 100) : 0;
    const creditPaymentPercent = stats.totalCredits > 0 ? Math.round((stats.paidCredits / stats.totalCredits) * 100) : 0;

    const StatCard = ({ title, value, icon, colorClass, onClick }) => (
        <Card className={`p - 6 border - l - 4 ${colorClass} hover: translate - y - [-4px] cursor - pointer`} onClick={onClick}>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                </div>
                <div className={`p - 3 rounded - full bg - opacity - 20 ${colorClass.replace('border-', 'bg-').replace('500', '100')} `}>
                    <span className={`text - 2xl ${colorClass.replace('border-', 'text-')} `}>{icon}</span>
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
                        <StatCard title="Vasiyet Durumu" value={stats.hasTestament ? "Mevcut" : "Oluştur"} icon={<FaScroll />} colorClass="border-purple-500" onClick={() => navigate('/vasiyet')} />
                        <StatCard title="Güvenilir Kişiler" value={stats.contactsCount} icon={<FaUserFriends />} colorClass="border-blue-500" onClick={() => navigate('/kisiler')} />
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
                    <Card className="p-5 bg-blue-50 border border-blue-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaPercentage className="text-blue-500" />
                            <span className="text-sm font-medium text-gray-600">Ödeme Yüzdesi</span>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                            Borç: %{debtPaymentPercent} · Alacak: %{creditPaymentPercent}
                        </p>
                    </Card>
                    <Card className="p-5 bg-yellow-50 border border-yellow-100">
                        <div className="flex items-center gap-3 mb-2">
                            <FaCalendarAlt className="text-yellow-600" />
                            <span className="text-sm font-medium text-gray-600">En Yakın Vade</span>
                        </div>
                        {stats.nearestDueCredit ? (
                            <div>
                                <p className="text-lg font-bold text-yellow-800">{stats.nearestDueCredit.date}</p>
                                <p className="text-sm text-gray-500">{stats.nearestDueCredit.personName} – {formatCurrency(stats.nearestDueCredit.amount)}</p>
                            </div>
                        ) : (
                            <p className="text-lg font-bold text-gray-400">Vade yok</p>
                        )}
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {!loading && stats.debtsCount === 0 && stats.creditsCount === 0 && !stats.hasTestament && (
                <Card className="p-8 text-center bg-gray-50 border-dashed border-2 border-gray-200 shadow-none">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Henüz bir kayıt bulunmuyor</h3>
                    <p className="text-gray-500 mb-6">Başlamak için sol menüden bir işlem seçin.</p>
                </Card>
            )}
        </div>
    );
};

export default Dashboard;

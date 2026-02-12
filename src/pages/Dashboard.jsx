import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
    FaFileInvoiceDollar,
    FaHandHoldingUsd,
    FaScroll,
    FaUserFriends,
    FaQuoteRight
} from "react-icons/fa";
import Card from "../components/ui/Card";

const Dashboard = () => {
    const { currentUser } = useAuth();
    const [stats, setStats] = useState({
        debtsCount: 0,
        creditsCount: 0,
        hasTestament: false,
        contactsCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState({ text: "", source: "" });

    // Islamic Quotes / Ayats
    const quotes = [
        { text: "Her nefis ölümü tadacaktır. Sizi bir imtihan olarak hayır ile de şer ile de deniyoruz. Ancak bize döndürüleceksiniz.", source: "Enbiyâ Suresi, 35. Ayet" },
        { text: "Ey iman edenler! Allah'tan korkun ve herkes, yarına ne hazırladığına baksın. Allah'tan korkun, çünkü Allah yaptıklarınızdan haberdardır.", source: "Haşr Suresi, 18. Ayet" },
        { text: "O gün ne mal fayda verir ne de evlat. Ancak Allah'a selim bir kalp ile gelenler (o günde fayda bulur).", source: "Şuarâ Suresi, 88-89. Ayet" },
        { text: "Dünya hayatı bir oyun ve eğlenceden ibarettir. Ahiret yurdu ise, Allah'tan korkanlar için daha hayırlıdır. Hâlâ akıllanmayacak mısınız?", source: "En'âm Suresi, 32. Ayet" },
        { text: "Şüphesiz biz Allah'tan geldik ve şüphesiz dönüşümüz O'nadır.", source: "Bakara Suresi, 156. Ayet" }
    ];

    useEffect(() => {
        // Random quote logic
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setQuote(randomQuote);

        if (!currentUser) return;

        setLoading(true);

        const qDebts = collection(db, "debts", currentUser.uid, "items");
        const qCredits = collection(db, "credits", currentUser.uid, "items");
        const qTestament = collection(db, "testaments", currentUser.uid, "items");
        const qContacts = collection(db, "contacts", currentUser.uid, "items");

        const unsubDebts = onSnapshot(qDebts, (snapshot) => {
            setStats(prev => ({ ...prev, debtsCount: snapshot.size }));
        });

        const unsubCredits = onSnapshot(qCredits, (snapshot) => {
            setStats(prev => ({ ...prev, creditsCount: snapshot.size }));
        });

        const unsubTestament = onSnapshot(qTestament, (snapshot) => {
            setStats(prev => ({ ...prev, hasTestament: snapshot.size > 0 }));
        });

        const unsubContacts = onSnapshot(qContacts, (snapshot) => {
            setStats(prev => ({ ...prev, contactsCount: snapshot.size }));
            setLoading(false);
        });

        return () => {
            unsubDebts();
            unsubCredits();
            unsubTestament();
            unsubContacts();
        };
    }, [currentUser]);

    const StatCard = ({ title, value, icon, colorClass }) => (
        <Card className={`p-6 border-l-4 ${colorClass} hover:translate-y-[-4px] cursor-pointer`}>
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                </div>
                <div className={`p-3 rounded-full bg-opacity-20 ${colorClass.replace('border-', 'bg-').replace('500', '100')}`}>
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

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                    <FaQuoteRight size={150} />
                </div>
                <h1 className="text-3xl font-bold relative z-10">Hoşgeldiniz, {currentUser?.email}</h1>
                <p className="mt-2 text-blue-100 relative z-10 max-w-2xl">
                    Bugün vasiyetinizi güncellemek veya mali durumunuzu gözden geçirmek için güzel bir gün.
                </p>

                {/* Daily Quote */}
                <div className="mt-6 pt-6 border-t border-blue-400/30 relative z-10">
                    <p className="font-serif italic text-lg text-yellow-500">"{quote.text}"</p>
                    <p className="text-sm text-blue-200 mt-2">— {quote.source}</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    <>
                        <StatCard
                            title="Borçlarım"
                            value={stats.debtsCount}
                            icon={<FaFileInvoiceDollar />}
                            colorClass="border-red-500"
                        />
                        <StatCard
                            title="Alacaklarım"
                            value={stats.creditsCount}
                            icon={<FaHandHoldingUsd />}
                            colorClass="border-green-500"
                        />
                        <StatCard
                            title="Vasiyet Durumu"
                            value={stats.hasTestament ? "Mevcut" : "Oluştur"}
                            icon={<FaScroll />}
                            colorClass="border-purple-500"
                        />
                        <StatCard
                            title="Güvenilir Kişiler"
                            value={stats.contactsCount}
                            icon={<FaUserFriends />}
                            colorClass="border-blue-500"
                        />
                    </>
                )}
            </div>

            {/* Empty State / CTA */}
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

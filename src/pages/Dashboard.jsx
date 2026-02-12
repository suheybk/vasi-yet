import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import {
    FaCoins, FaGem, FaScroll, FaUserFriends, FaQuoteRight,
    FaChartLine, FaCalendarAlt, FaBuilding,
    FaBoxOpen, FaArrowRight, FaPlus, FaShieldAlt, FaFilePdf,
    FaMosque, FaHandshake, FaHandHoldingHeart, FaBriefcase,
    FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
    FaPray, FaBalanceScale
} from "react-icons/fa";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import Card from "../components/ui/Card";
import { formatCurrency } from "../utils/formatters";
import { generatePDF } from "../utils/pdfGenerator";
import toast from "react-hot-toast";

const CHART_COLORS = ["#ef4444", "#22c55e", "#f59e0b", "#6366f1", "#8b5cf6", "#06b6d4"];

const Dashboard = () => {
    const { currentUser, userProfile } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        debtsCount: 0, creditsCount: 0, hasTestament: false, contactsCount: 0,
        totalDebt: 0, totalCredit: 0, paidDebts: 0, paidCredits: 0,
        totalDebts: 0, totalCredits: 0, nearestDueCredit: null,
        assetsCount: 0, totalAssetValue: 0, trustsCount: 0,
        assetsByType: []
    });
    const [spiritual, setSpiritual] = useState(null);
    const [funeralPlan, setFuneralPlan] = useState(null);
    const [guardianCount, setGuardianCount] = useState(0);
    const [forgivenessCount, setForgivenessCount] = useState(0);
    const [charityCount, setCharityCount] = useState(0);
    const [projectCount, setProjectCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [quote, setQuote] = useState({ text: "", source: "" });
    const [pdfLoading, setPdfLoading] = useState(false);

    const handlePdfDownload = async () => {
        setPdfLoading(true);
        try {
            await generatePDF(currentUser, userProfile);
            toast.success("PDF indirildi ✓");
        } catch (error) {
            console.error(error);
            toast.error("PDF oluşturulurken hata oluştu.");
        } finally {
            setPdfLoading(false);
        }
    };

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
        const totalToLoad = 11;
        const checkLoaded = () => { loadedCount++; if (loadedCount >= totalToLoad) setLoading(false); };

        const assetTypeLabels = { gayrimenkul: "Gayrimenkul", arac: "Araç", altin: "Altın", nakit: "Nakit", hisse: "Hisse/Fon", diger: "Diğer" };

        const unsubDebts = onSnapshot(collection(db, "debts", currentUser.uid, "items"), (snap) => {
            const items = snap.docs.map(d => d.data());
            const unpaid = items.filter(i => !i.isPaid);
            const totalDebt = unpaid.reduce((sum, i) => sum + (i.amount || 0), 0);
            const paidDebts = items.filter(i => i.isPaid).length;
            setStats(prev => ({ ...prev, debtsCount: unpaid.length, totalDebt, paidDebts, totalDebts: items.length }));
            checkLoaded();
        });

        const unsubCredits = onSnapshot(collection(db, "credits", currentUser.uid, "items"), (snap) => {
            const items = snap.docs.map(d => d.data());
            const unpaid = items.filter(i => !i.isPaid);
            const totalCredit = unpaid.reduce((sum, i) => sum + (i.amount || 0), 0);
            const paidCredits = items.filter(i => i.isPaid).length;
            const today = new Date().toISOString().split('T')[0];
            const upcoming = unpaid.filter(i => i.date && i.date >= today).sort((a, b) => a.date.localeCompare(b.date));
            const nearestDueCredit = upcoming.length > 0 ? upcoming[0] : null;
            setStats(prev => ({ ...prev, creditsCount: unpaid.length, totalCredit, paidCredits, totalCredits: items.length, nearestDueCredit }));
            checkLoaded();
        });

        const unsubTestament = onSnapshot(collection(db, "testaments", currentUser.uid, "items"), (snap) => {
            let hasContent = false;
            snap.docs.forEach(d => { if (d.data().text && d.data().text.trim().length > 0) hasContent = true; });
            setStats(prev => ({ ...prev, hasTestament: hasContent }));
            checkLoaded();
        });

        const unsubContacts = onSnapshot(collection(db, "contacts", currentUser.uid, "items"), (snap) => {
            setStats(prev => ({ ...prev, contactsCount: snap.size }));
            checkLoaded();
        });

        const unsubAssets = onSnapshot(collection(db, "assets", currentUser.uid, "items"), (snap) => {
            const items = snap.docs.map(d => d.data());
            const totalAssetValue = items.reduce((sum, i) => sum + (i.value || 0), 0);
            // Group by type for pie chart
            const typeMap = {};
            items.forEach(i => {
                const type = assetTypeLabels[i.type] || i.type || "Diğer";
                typeMap[type] = (typeMap[type] || 0) + (i.value || 0);
            });
            const assetsByType = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
            setStats(prev => ({ ...prev, assetsCount: items.length, totalAssetValue, assetsByType }));
            checkLoaded();
        });

        const unsubTrusts = onSnapshot(collection(db, "trusts", currentUser.uid, "items"), (snap) => {
            setStats(prev => ({ ...prev, trustsCount: snap.size }));
            checkLoaded();
        });

        const unsubForgiveness = onSnapshot(collection(db, "forgiveness_requests", currentUser.uid, "items"), (snap) => {
            setForgivenessCount(snap.size);
            checkLoaded();
        });

        const unsubCharity = onSnapshot(collection(db, "charity_wills", currentUser.uid, "items"), (snap) => {
            setCharityCount(snap.size);
            checkLoaded();
        });

        const unsubProjects = onSnapshot(collection(db, "projects", currentUser.uid, "items"), (snap) => {
            setProjectCount(snap.size);
            checkLoaded();
        });

        const unsubGuardian = onSnapshot(collection(db, "guardianship", currentUser.uid, "items"), (snap) => {
            setGuardianCount(snap.size);
            checkLoaded();
        });

        // Single doc fetches
        getDoc(doc(db, "religious_obligations", currentUser.uid)).then(snap => {
            if (snap.exists()) setSpiritual(snap.data());
            checkLoaded();
        }).catch(() => checkLoaded());

        getDoc(doc(db, "funeral_plan", currentUser.uid)).then(snap => {
            if (snap.exists()) setFuneralPlan(snap.data());
        }).catch(() => { });

        return () => {
            unsubDebts(); unsubCredits(); unsubTestament(); unsubContacts();
            unsubAssets(); unsubTrusts(); unsubForgiveness(); unsubCharity();
            unsubProjects(); unsubGuardian();
        };
    }, [currentUser]);

    // Completion calculation
    const completionItems = [
        { label: "Vasiyet yazıldı", done: stats.hasTestament, path: "/vasiyet" },
        { label: "Borçlar kaydedildi", done: stats.totalDebts > 0, path: "/borclar" },
        { label: "Mal varlığı listelendi", done: stats.assetsCount > 0, path: "/varliklar" },
        { label: "Güvenilir kişiler eklendi", done: stats.contactsCount > 0, path: "/kisiler" },
        { label: "Vasi atandı", done: guardianCount > 0, path: "/vasi-atama" },
        { label: "Cenaze planı tamamlandı", done: !!funeralPlan, path: "/cenaze-plani" },
        { label: "Helallik listesi oluşturuldu", done: forgivenessCount > 0, path: "/helallik" },
        { label: "Hayır vasiyetleri eklendi", done: charityCount > 0, path: "/hayir-vasiyetleri" },
    ];
    const completedCount = completionItems.filter(i => i.done).length;
    const completionPercent = Math.round((completedCount / completionItems.length) * 100);

    // Net financial
    const netFinancial = stats.totalCredit - stats.totalDebt;

    // Spiritual totals
    const totalPrayers = spiritual ? Object.values(spiritual.prayers || {}).reduce((s, v) => s + (v || 0), 0) : 0;
    const fastingCount = spiritual?.fasting?.count || 0;
    const fidyeZekat = (spiritual?.financial?.fidye || 0) + (spiritual?.financial?.zekat || 0);

    // Chart data
    const debtCreditData = [
        { name: "Borç", value: stats.totalDebt },
        { name: "Alacak", value: stats.totalCredit },
    ];

    // Action items
    const actionItems = completionItems.filter(i => !i.done);

    const quickActions = [
        { label: "Borç Ekle", icon: <FaCoins />, path: "/borclar", color: "bg-red-500 hover:bg-red-600" },
        { label: "Alacak Ekle", icon: <FaGem />, path: "/alacaklar", color: "bg-green-500 hover:bg-green-600" },
        { label: "Vasiyet Yaz", icon: <FaScroll />, path: "/vasiyet", color: "bg-purple-500 hover:bg-purple-600" },
        { label: "Varlık Ekle", icon: <FaBuilding />, path: "/varliklar", color: "bg-yellow-500 hover:bg-yellow-600" },
        { label: "Emanet Ekle", icon: <FaBoxOpen />, path: "/emanetler", color: "bg-indigo-500 hover:bg-indigo-600" },
        { label: "Kişi Ekle", icon: <FaUserFriends />, path: "/kisiler", color: "bg-blue-500 hover:bg-blue-600" },
    ];

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
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                    <FaQuoteRight size={150} />
                </div>
                <h1 className="text-3xl font-bold relative z-10">Hoşgeldiniz, {userProfile?.displayName || currentUser?.displayName || currentUser?.email}</h1>
                <p className="mt-2 text-blue-100 relative z-10 max-w-2xl">
                    Bugün vasiyetinizi güncellemek veya mali durumunuzu gözden geçirmek için güzel bir gün.
                </p>
                <div className="mt-6 pt-6 border-t border-blue-400/30 relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                    <div>
                        <p className="font-serif italic text-lg text-yellow-500">"{quote.text}"</p>
                        <p className="text-sm text-blue-200 mt-2">— {quote.source}</p>
                    </div>
                    <button
                        onClick={handlePdfDownload}
                        disabled={pdfLoading}
                        className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold px-6 py-3 rounded-xl transition-all hover:-translate-y-0.5 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px] flex-shrink-0"
                    >
                        <FaFilePdf className="text-lg" />
                        {pdfLoading ? "PDF Hazırlanıyor..." : "PDF İndir"}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                    <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
                </div>
            ) : (
                <>
                    {/* ═══ Completion Progress ═══ */}
                    <Card className="p-6 overflow-hidden">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">Vasiyet Tamamlama Durumu</h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {completedCount}/{completionItems.length} bölüm tamamlandı
                                </p>
                            </div>
                            <div className="text-right">
                                <span className={`text-3xl font-black ${completionPercent === 100 ? 'text-green-600' : completionPercent >= 50 ? 'text-blue-600' : 'text-amber-600'}`}>
                                    %{completionPercent}
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                            <div
                                className={`h-4 rounded-full transition-all duration-700 ease-out ${completionPercent === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' : completionPercent >= 50 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-amber-400 to-amber-600'}`}
                                style={{ width: `${completionPercent}%` }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {completionItems.map((item, i) => (
                                <button key={i} onClick={() => navigate(item.path)}
                                    className={`flex items-center gap-2 text-xs p-2 rounded-lg transition min-h-[36px] ${item.done ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500 hover:bg-amber-50 hover:text-amber-700'}`}>
                                    {item.done ? <FaCheckCircle className="flex-shrink-0 text-green-500" /> : <FaTimesCircle className="flex-shrink-0 text-gray-300" />}
                                    <span className="truncate">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </Card>

                    {/* ═══ Financial Summary ═══ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-5 bg-red-50 border border-red-100 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/borclar')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-red-100 rounded-lg"><FaCoins className="text-red-500" /></div>
                                <span className="text-sm font-medium text-gray-600">Toplam Borç</span>
                            </div>
                            <p className="text-2xl font-bold text-red-700">{formatCurrency(stats.totalDebt)}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.debtsCount} ödenmemiş borç</p>
                        </Card>
                        <Card className="p-5 bg-green-50 border border-green-100 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/alacaklar')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-green-100 rounded-lg"><FaGem className="text-green-500" /></div>
                                <span className="text-sm font-medium text-gray-600">Toplam Alacak</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalCredit)}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.creditsCount} tahsil edilmemiş</p>
                        </Card>
                        <Card className={`p-5 border cursor-pointer hover:-translate-y-1 transition-transform ${netFinancial >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`} onClick={() => navigate('/borclar')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`p-2 rounded-lg ${netFinancial >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
                                    <FaBalanceScale className={netFinancial >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                                </div>
                                <span className="text-sm font-medium text-gray-600">Net Mali Durum</span>
                            </div>
                            <p className={`text-2xl font-bold ${netFinancial >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {netFinancial >= 0 ? '+' : ''}{formatCurrency(netFinancial)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{netFinancial >= 0 ? 'Alacak fazlası' : 'Borç fazlası'}</p>
                        </Card>
                        <Card className="p-5 bg-amber-50 border border-amber-100 cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/varliklar')}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-amber-100 rounded-lg"><FaBuilding className="text-amber-600" /></div>
                                <span className="text-sm font-medium text-gray-600">Mal Varlığı</span>
                            </div>
                            <p className="text-2xl font-bold text-amber-700">{formatCurrency(stats.totalAssetValue)}</p>
                            <p className="text-xs text-gray-400 mt-1">{stats.assetsCount} varlık kaydı</p>
                        </Card>
                    </div>

                    {/* ═══ Charts Row ═══ */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pie Chart - Asset Distribution */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaBuilding className="text-amber-500" /> Varlık Dağılımı
                            </h3>
                            {stats.assetsByType.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={stats.assetsByType} cx="50%" cy="50%"
                                            outerRadius={90} innerRadius={50}
                                            dataKey="value" nameKey="name"
                                            label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}
                                            labelLine={false}
                                        >
                                            {stats.assetsByType.map((_, i) => (
                                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <FaBuilding className="mx-auto text-3xl mb-2" />
                                        <p className="text-sm">Henüz varlık kaydı yok</p>
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Bar Chart - Debt vs Credit */}
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaChartLine className="text-blue-500" /> Borç / Alacak Karşılaştırma
                            </h3>
                            {(stats.totalDebt > 0 || stats.totalCredit > 0) ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={debtCreditData} barSize={60}>
                                        <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                            <Cell fill="#ef4444" />
                                            <Cell fill="#22c55e" />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[250px] flex items-center justify-center text-gray-400">
                                    <div className="text-center">
                                        <FaChartLine className="mx-auto text-3xl mb-2" />
                                        <p className="text-sm">Borç/alacak kaydı yok</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* ═══ Spiritual Overview ═══ */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaMosque className="text-emerald-600" /> Dini Yükümlülükler Özeti
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/dini-yukumlulukler')}>
                                <FaPray className="mx-auto text-2xl text-emerald-500 mb-2" />
                                <p className="text-sm text-gray-500">Kaza Namaz Toplamı</p>
                                <p className="text-3xl font-black text-emerald-700 mt-1">{totalPrayers}</p>
                                <p className="text-xs text-gray-400 mt-1">vakit</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/dini-yukumlulukler')}>
                                <FaCalendarAlt className="mx-auto text-2xl text-blue-500 mb-2" />
                                <p className="text-sm text-gray-500">Kaza Oruç Sayısı</p>
                                <p className="text-3xl font-black text-blue-700 mt-1">{fastingCount}</p>
                                <p className="text-xs text-gray-400 mt-1">gün</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-center cursor-pointer hover:-translate-y-1 transition-transform" onClick={() => navigate('/dini-yukumlulukler')}>
                                <FaCoins className="mx-auto text-2xl text-amber-500 mb-2" />
                                <p className="text-sm text-gray-500">Fidye/Zekat Borcu</p>
                                <p className="text-3xl font-black text-amber-700 mt-1">{formatCurrency(fidyeZekat)}</p>
                                <p className="text-xs text-gray-400 mt-1">toplam</p>
                            </div>
                        </div>
                    </Card>

                    {/* ═══ Action Items ═══ */}
                    {actionItems.length > 0 && (
                        <Card className="p-6 border-l-4 border-amber-400">
                            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <FaExclamationTriangle className="text-amber-500" /> Yapılacaklar
                            </h2>
                            <div className="space-y-2">
                                {actionItems.map((item, i) => (
                                    <button key={i} onClick={() => navigate(item.path)}
                                        className="w-full flex items-center justify-between p-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition group min-h-[44px]">
                                        <div className="flex items-center gap-3">
                                            <FaTimesCircle className="text-amber-400 flex-shrink-0" />
                                            <span className="text-sm text-gray-700">{item.label}</span>
                                        </div>
                                        <FaArrowRight className="text-gray-300 group-hover:text-amber-500 transition flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </Card>
                    )}

                    {/* ═══ Module Stats Row ═══ */}
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {[
                            { label: "Vasiyet", icon: <FaScroll />, done: stats.hasTestament, path: "/vasiyet", color: "purple" },
                            { label: "Emanetler", icon: <FaBoxOpen />, count: stats.trustsCount, path: "/emanetler", color: "indigo" },
                            { label: "Helallik", icon: <FaHandshake />, count: forgivenessCount, path: "/helallik", color: "teal" },
                            { label: "Hayır", icon: <FaHandHoldingHeart />, count: charityCount, path: "/hayir-vasiyetleri", color: "pink" },
                            { label: "Projeler", icon: <FaBriefcase />, count: projectCount, path: "/projeler", color: "cyan" },
                            { label: "Kişiler", icon: <FaUserFriends />, count: stats.contactsCount, path: "/kisiler", color: "blue" },
                        ].map((mod, i) => (
                            <Card key={i} onClick={() => navigate(mod.path)}
                                className={`p-4 text-center cursor-pointer hover:-translate-y-1 transition-transform bg-${mod.color}-50 border border-${mod.color}-100`}>
                                <span className={`text-2xl text-${mod.color}-500 inline-block mb-1`}>{mod.icon}</span>
                                <p className="text-xs text-gray-500 mb-1">{mod.label}</p>
                                <p className={`text-xl font-bold text-${mod.color}-700`}>
                                    {mod.done !== undefined ? (mod.done ? "✓" : "—") : mod.count}
                                </p>
                            </Card>
                        ))}
                    </div>

                    {/* ═══ Quick Actions ═══ */}
                    <Card className="p-6">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPlus className="text-blue-500" /> Hızlı İşlemler
                        </h2>
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

                    {/* ═══ Security Badge ═══ */}
                    <Card className="p-4 bg-green-50 border border-green-200">
                        <div className="flex items-center gap-3">
                            <FaShieldAlt className="text-green-600 text-xl flex-shrink-0" />
                            <p className="text-sm text-green-700">
                                <strong>Verileriniz güvende.</strong> Tüm bilgileriniz 256-bit şifreleme ile korunmakta olup hiçbir koşulda üçüncü şahıslarla paylaşılmamaktadır.
                            </p>
                        </div>
                    </Card>
                </>
            )}
        </div>
    );
};

export default Dashboard;

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp, query, onSnapshot } from "firebase/firestore";
import { FaBookOpen, FaHeart, FaShareAlt, FaCopy, FaQuoteLeft } from "react-icons/fa";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import ilhamData from "../data/ilhamData.json";

const Ilham = () => {
    const { currentUser } = useAuth();
    const [activeCategory, setActiveCategory] = useState("all");
    const [favorites, setFavorites] = useState([]);
    const [randomDaily, setRandomDaily] = useState(null);

    useEffect(() => {
        // Set a random quote for the day (using date as seed)
        const allItems = [...ilhamData.ayetler, ...ilhamData.hadisler, ...ilhamData.hikmetler];
        const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
        const index = dayOfYear % allItems.length;
        setRandomDaily(allItems[index]);
    }, []);

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(query(collection(db, "favorites", currentUser.uid, "items")), (snap) => {
            setFavorites(snap.docs.map(d => d.data().itemId));
        });
        return unsub;
    }, [currentUser]);

    const handleFavorite = async (item) => {
        if (!currentUser) return;
        const isFav = favorites.includes(item.id);
        if (isFav) {
            toast("Favori yönetimi detaylı profilden yapılabilir.", { icon: "ℹ️" });
            return;
        }

        try {
            await addDoc(collection(db, "favorites", currentUser.uid, "items"), {
                itemId: item.id,
                text: item.text,
                source: item.source,
                timestamp: serverTimestamp()
            });
            toast.success("Favorilere eklendi ✓");
        } catch (error) {
            toast.error("Favorilere eklenirken hata oluştu.");
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Panoya kopyalandı ✓");
    };

    const categories = [
        { id: "all", label: "Hepsi", icon: <FaBookOpen /> },
        { id: "ayetler", label: "Ayetler", icon: <FaBookOpen /> },
        { id: "hadisler", label: "Hadisler", icon: <FaBookOpen /> },
        { id: "hikmetler", label: "Hikmetli Sözler", icon: <FaBookOpen /> }
    ];

    const getItems = () => {
        if (activeCategory === "all") return [...ilhamData.ayetler, ...ilhamData.hadisler, ...ilhamData.hikmetler];
        return ilhamData[activeCategory] || [];
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-indigo-700 bg-clip-text text-transparent">
                    İlham ve Hikmet
                </h1>
                <p className="text-gray-500">Güne anlam katan, vasiyet yolculuğunuza ışık tutan sözler.</p>
            </div>

            {/* Daily Quote */}
            {randomDaily && (
                <Card className="p-8 bg-gradient-to-br from-blue-900 to-indigo-900 text-white relative overflow-hidden shadow-xl border-none">
                    <FaQuoteLeft className="absolute -top-4 -left-4 text-8xl text-white/5" />
                    <div className="relative z-10 text-center space-y-6">
                        <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-blue-200">
                            Günün Mesajı
                        </div>
                        <p className="text-xl md:text-2xl font-serif italic leading-relaxed">
                            "{randomDaily.text}"
                        </p>
                        <div className="text-blue-300 font-medium">
                            — {randomDaily.source}
                        </div>
                        <div className="flex justify-center gap-4 pt-4">
                            <button onClick={() => handleFavorite(randomDaily)} className={`p-3 rounded-full transition ${favorites.includes(randomDaily.id) ? "bg-red-500 text-white" : "bg-white/10 hover:bg-white/20"}`}>
                                <FaHeart />
                            </button>
                            <button onClick={() => handleCopy(randomDaily.text)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition">
                                <FaCopy />
                            </button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Categories */}
            <div className="flex justify-center gap-2 flex-wrap">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition min-h-[44px] ${activeCategory === cat.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"}`}
                    >
                        {cat.icon}
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getItems().map((item, i) => (
                    <Card key={i} className="p-6 hover:shadow-lg transition flex flex-col justify-between group">
                        <div className="space-y-4">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-1 rounded">
                                    {item.category}
                                </span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button onClick={() => handleFavorite(item)} className={`p-2 rounded-lg transition ${favorites.includes(item.id) ? "text-red-500" : "text-gray-400 hover:text-red-500"}`}>
                                        <FaHeart />
                                    </button>
                                    <button onClick={() => handleCopy(item.text)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg transition">
                                        <FaCopy />
                                    </button>
                                </div>
                            </div>
                            <p className="text-gray-700 leading-relaxed font-medium">"{item.text}"</p>
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-50 text-right text-xs text-gray-400 italic">
                            {item.source}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default Ilham;

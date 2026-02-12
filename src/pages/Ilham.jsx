import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../context/PremiumContext";
import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp, query, onSnapshot } from "firebase/firestore";
import { FaBookOpen, FaHeart, FaShareAlt, FaCopy, FaQuoteLeft, FaDownload, FaWhatsapp } from "react-icons/fa";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import ilhamData from "../data/ilhamData.json";
import html2canvas from "html2canvas";

const Ilham = () => {
    const { currentUser } = useAuth();
    const { handleShareSuccess } = usePremium();
    const [activeCategory, setActiveCategory] = useState("all");
    const [favorites, setFavorites] = useState([]);
    const [randomDaily, setRandomDaily] = useState(null);
    const cardRefs = useRef({});

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

    const handleDownload = async (id, text) => {
        const element = cardRefs.current[id];
        if (!element) return;

        const toastId = toast.loading("Resim hazırlanıyor...");
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: "#ffffff",
                scale: 2,
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    // Critical: html2canvas v1.x doesn't support OKLCH colors used by Tailwind 4.
                    // We must find and replace them in the cloned DOM before rendering.
                    const allElements = clonedDoc.getElementsByTagName("*");
                    for (let i = 0; i < allElements.length; i++) {
                        const el = allElements[i];
                        const style = window.getComputedStyle(el);

                        // Check common color properties
                        ['color', 'backgroundColor', 'borderColor', 'outlineColor'].forEach(prop => {
                            const val = style[prop];
                            if (val && val.includes('oklch')) {
                                // Fallback to a safe color if oklch is detected
                                if (prop === 'color') el.style[prop] = '#1f2937';
                                if (prop === 'backgroundColor' && val !== 'rgba(0, 0, 0, 0)') el.style[prop] = '#ffffff';
                                if (prop === 'borderColor') el.style[prop] = '#e5e7eb';
                            }
                        });
                    }
                }
            });
            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.download = `Wasiyet-${id}.png`;
            link.href = dataUrl;
            link.click();
            toast.success("Resim indirildi ✓", { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error("Resim oluşturulurken bir hata oluştu.", { id: toastId });
        }
    };

    const handleShare = async (item) => {
        const shareData = {
            title: "Wasiyet - İlham",
            text: `"${item.text}" — ${item.source}\n\nSen de vasiyetini oluşturmak için tıkla: wasiyet.com`,
            url: "https://wasiyet.com"
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
                handleShareSuccess();
                toast.success("Paylaşıldı ✓");
            } else {
                // Fallback to WhatsApp
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareData.text)}`;
                window.open(whatsappUrl, "_blank");
                handleShareSuccess();
            }
        } catch (error) {
            console.error("Share failed", error);
        }
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
                <div ref={el => cardRefs.current['daily'] = el}>
                    <Card
                        style={{ background: 'linear-gradient(to bottom right, #1e3a8a, #312e81)' }}
                        className="p-8 text-white relative overflow-hidden shadow-xl border-none"
                    >
                        <FaQuoteLeft className="absolute -top-4 -left-4 text-8xl text-white/5" />
                        <div className="relative z-10 text-center space-y-6">
                            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest" style={{ color: '#bfdbfe' }}>
                                Günün Mesajı
                            </div>
                            <p className="text-xl md:text-2xl font-serif italic leading-relaxed" style={{ color: '#ffffff' }}>
                                "{randomDaily.text}"
                            </p>
                            <div style={{ color: '#bfdbfe' }} className="font-medium">
                                — {randomDaily.source}
                            </div>
                            <div className="flex justify-center gap-4 pt-4 no-canvas">
                                <button onClick={() => handleFavorite(randomDaily)} className="p-3 rounded-full transition" style={{ backgroundColor: favorites.includes(randomDaily.id) ? "#ef4444" : "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                                    <FaHeart />
                                </button>
                                <button onClick={() => handleDownload('daily', randomDaily.text)} className="p-3 rounded-full transition" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                                    <FaDownload />
                                </button>
                                <button onClick={() => handleShare(randomDaily)} className="p-3 rounded-full transition" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                                    <FaShareAlt />
                                </button>
                                <button onClick={() => handleCopy(randomDaily.text)} className="p-3 rounded-full transition" style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#ffffff" }}>
                                    <FaCopy />
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
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
                    <div key={item.id} ref={el => cardRefs.current[item.id] = el}>
                        <Card className="p-6 hover:shadow-lg transition flex flex-col justify-between group h-full bg-white">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span style={{ backgroundColor: '#eff6ff', color: '#2563eb' }} className="text-xs font-bold uppercase tracking-tighter px-2 py-1 rounded">
                                        {item.category}
                                    </span>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition no-canvas">
                                        <button onClick={() => handleFavorite(item)} className="p-2 rounded-lg transition" style={{ color: favorites.includes(item.id) ? "#ef4444" : "#9ca3af" }}>
                                            <FaHeart title="Favorilere Ekle" />
                                        </button>
                                        <button onClick={() => handleDownload(item.id, item.text)} className="p-2 rounded-lg transition" style={{ color: "#9ca3af" }}>
                                            <FaDownload title="Resim Olarak İndir" />
                                        </button>
                                        <button onClick={() => handleShare(item)} className="p-2 rounded-lg transition" style={{ color: "#9ca3af" }}>
                                            <FaShareAlt title="Paylaş" />
                                        </button>
                                        <button onClick={() => handleCopy(item.text)} className="p-2 rounded-lg transition" style={{ color: "#9ca3af" }}>
                                            <FaCopy title="Metni Kopyala" />
                                        </button>
                                    </div>
                                </div>
                                <p className="leading-relaxed font-medium" style={{ color: '#374151' }}>"{item.text}"</p>
                            </div>
                            <div className="mt-6 pt-4 text-right text-xs italic" style={{ borderTop: '1px solid #f9fafb', color: '#9ca3af' }}>
                                {item.source}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @media screen {
                    .no-canvas {
                        /* html2canvas will ignore elements with this attribute or we can omit them */
                    }
                }
            `}</style>
        </div>
    );
};

export default Ilham;

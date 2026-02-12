import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { usePremium } from "../context/PremiumContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
    FaBars,
    FaTimes,
    FaHome,
    FaCoins,
    FaGem,
    FaScroll,
    FaBuilding,
    FaBoxOpen,
    FaMosque,
    FaHandshake,
    FaHandHoldingHeart,
    FaBriefcase,
    FaUserFriends,
    FaUser,
    FaShieldAlt,
    FaSignOutAlt,
    FaCrown,
    FaExclamationCircle,
    FaLightbulb,
    FaGlobe
} from "react-icons/fa";
import PricingModal from "./PricingModal";
import toast from "react-hot-toast";
import { auth } from "../firebase/config";
import { sendEmailVerification } from "firebase/auth";

const MainLayout = ({ children }) => {
    const { currentUser, userProfile, logout } = useAuth();
    const { isPremium, isFeatureLocked, daysLeftInTrial } = usePremium();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isPricingOpen, setIsPricingOpen] = useState(false);
    const [sendingVerification, setSendingVerification] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const handleSendVerification = async () => {
        if (!auth.currentUser || sendingVerification) return;
        setSendingVerification(true);
        try {
            await sendEmailVerification(auth.currentUser);
            toast.success("Doğrulama e-postası gönderildi. Lütfen gelen kutunuzu kontrol edin.");
        } catch (error) {
            toast.error("Gönderilirken bir hata oluştu.");
        } finally {
            setSendingVerification(false);
        }
    };

    const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email;

    // Ordered as per user request: Free at top, Premium at bottom
    const navItems = [
        // Primary
        { path: "/vasiyet", label: "Vasiyetim", icon: <FaScroll />, isPrimary: true },

        // Free Features
        { path: "/dashboard", label: "Anasayfa", icon: <FaHome /> },
        { path: "/borclar", label: "Borçlarım", icon: <FaCoins /> },
        { path: "/helallik", label: "Helallik İsteği", icon: <FaHandshake /> },
        { path: "/hayir-vasiyetleri", label: "Hayır Vasiyetleri", icon: <FaHandHoldingHeart /> },
        { path: "/ilham", label: "İlham", icon: <FaLightbulb /> },
        { path: "/profil", label: "Profilim", icon: <FaUser /> },

        // Premium Features (Grouped at bottom)
        { path: "/alacaklar", label: "Alacaklarım", icon: <FaGem />, isPremium: true },
        { path: "/varliklar", label: "Mal Varlığı", icon: <FaBuilding />, isPremium: true },
        { path: "/emanetler", label: "Emanetler", icon: <FaBoxOpen />, isPremium: true },
        { path: "/dini-yukumlulukler", label: "Dini Yükümlülükler", icon: <FaMosque />, isPremium: true },
        { path: "/projeler", label: "İş ve Projeler", icon: <FaBriefcase />, isPremium: true },
        { path: "/vasi-atama", label: "Vasi Atama", icon: <FaShieldAlt />, isPremium: true },
        { path: "/cenaze-plani", label: "Cenaze Planı", icon: <FaMosque />, isPremium: true },
        { path: "/kisiler", label: "Güvenilir Kişiler", icon: <FaUserFriends />, isPremium: true },
        { path: "/dijital-miras", label: "Dijital Miras", icon: <FaGlobe />, isPremium: true },
    ];

    const isEmailVerified = currentUser?.emailVerified;

    return (
        <div className="flex flex-col h-screen bg-background relative overflow-hidden font-sans text-text">
            {/* Verification Banner */}
            {!isEmailVerified && currentUser && (
                <div className="bg-amber-600 text-white px-4 py-2 text-sm flex justify-between items-center z-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <FaExclamationCircle />
                        <span>E-posta adresiniz henüz doğrulanmadı. Bazı özellikler kısıtlı olabilir.</span>
                    </div>
                    <button
                        onClick={handleSendVerification}
                        className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition whitespace-nowrap"
                        disabled={sendingVerification}
                    >
                        {sendingVerification ? "Gönderiliyor..." : "Doğrulama Gönder"}
                    </button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231f2937' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    }}
                ></div>

                {/* Mobile Sidebar Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    ></div>
                )}

                {/* Sidebar */}
                <aside
                    className={`
                        fixed inset-y-0 left-0 z-30 w-64 bg-primary text-white transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col
                        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
                        lg:relative lg:translate-x-0
                    `}
                >
                    <div className="flex items-center justify-between h-16 px-6 bg-blue-900 shadow-md shrink-0">
                        <span className="text-2xl font-bold tracking-wider text-secondary">Wasiyet</span>
                        <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-secondary">
                            <FaTimes className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="px-6 py-4 border-b border-blue-800 shrink-0">
                        <p className="text-sm text-blue-200">Hoşgeldiniz,</p>
                        <p className="text-sm font-medium truncate" title={displayName}>{displayName}</p>
                        {isPremium ? (
                            <div className="mt-2 flex items-center gap-1.5 text-xs text-yellow-500 font-bold">
                                <FaCrown /> Premium Üye
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsPricingOpen(true)}
                                className="mt-2 text-xs bg-yellow-600 hover:bg-yellow-500 text-white px-2 py-1 rounded-md flex items-center gap-1 transition"
                            >
                                <FaCrown /> Premium'a Geç
                            </button>
                        )}
                    </div>

                    <nav className="mt-4 px-4 pb-8 space-y-1 flex-1 overflow-y-auto custom-scrollbar">
                        {navItems.map((item, index) => {
                            const isLocked = isFeatureLocked(item.path);
                            // Show separator before first premium item
                            const showPremiumLabel = item.isPremium && (index === 0 || !navItems[index - 1].isPremium);

                            return (
                                <div key={item.path}>
                                    {showPremiumLabel && (
                                        <div className="px-4 pt-6 pb-2 text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                            Premium Özellikler
                                        </div>
                                    )}
                                    <Link
                                        to={isLocked ? "#" : item.path}
                                        className={`
                                            flex items-center px-4 py-3 rounded-lg transition-all duration-200 group
                                            ${item.isPrimary ? "mb-4 border-2 border-secondary/30 ring-4 ring-secondary/5" : ""}
                                            ${location.pathname === item.path
                                                ? "bg-secondary text-primary font-bold shadow-md"
                                                : "text-blue-100 hover:bg-white/10 hover:text-white"}
                                            ${isLocked ? "opacity-60 grayscale-[0.5]" : ""}
                                        `}
                                        onClick={(e) => {
                                            if (isLocked) {
                                                e.preventDefault();
                                                setIsPricingOpen(true);
                                                toast("Bu özellik Premium üyeler içindir.", { icon: "🔒" });
                                            } else {
                                                setIsSidebarOpen(false);
                                            }
                                        }}
                                    >
                                        <span className={`text-xl mr-3 ${location.pathname === item.path ? "text-primary" : "text-blue-300 group-hover:text-secondary"}`}>
                                            {item.icon}
                                        </span>
                                        <span className="flex-1">{item.label}</span>
                                        {isLocked && <FaCrown className="text-xs text-yellow-500" />}
                                    </Link>
                                </div>
                            );
                        })}

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center px-4 py-3 mt-6 text-red-200 hover:bg-red-900/40 hover:text-red-100 rounded-lg transition-colors duration-200"
                        >
                            <span className="text-xl mr-3"><FaSignOutAlt /></span>
                            <span>Çıkış Yap</span>
                        </button>
                    </nav>

                    {/* Privacy Footer */}
                    <div className="px-4 pb-4 mt-auto shrink-0">
                        <Link
                            to="/gizlilik"
                            className="flex items-center gap-2 px-4 py-2 text-xs text-blue-300 hover:text-blue-100 transition-colors"
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <FaShieldAlt className="text-blue-400" />
                            Gizlilik & KVKK
                        </Link>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 w-full relative">
                    {/* Mobile Header */}
                    <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-primary text-white shadow-md shrink-0">
                        <button onClick={toggleSidebar} className="text-white hover:text-secondary">
                            <FaBars className="w-6 h-6" />
                        </button>
                        <span className="text-xl font-bold text-secondary">Wasiyet</span>
                        <div className="w-6"></div>
                    </header>

                    {/* Trial / Premium Notice */}
                    {!isPremium && daysLeftInTrial > 0 && (
                        <div className="absolute top-0 right-0 m-4 z-40 bg-white/90 backdrop-blur shadow-md px-3 py-1.5 rounded-full border border-emerald-100 text-xs text-emerald-700 font-medium">
                            Deneme Süresi: {daysLeftInTrial} gün kaldı
                        </div>
                    )}

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                        {children}
                    </main>
                </div>
            </div>

            <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
        </div>
    );
};

export default MainLayout;

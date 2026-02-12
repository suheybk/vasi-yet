import { useState } from "react";
import { useAuth } from "../context/AuthContext";
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
    FaUserFriends,
    FaUser,
    FaShieldAlt,
    FaSignOutAlt
} from "react-icons/fa";

const MainLayout = ({ children }) => {
    const { currentUser, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email;

    const navItems = [
        { path: "/dashboard", label: "Anasayfa", icon: <FaHome /> },
        { path: "/borclar", label: "Borçlarım", icon: <FaCoins /> },
        { path: "/alacaklar", label: "Alacaklarım", icon: <FaGem /> },
        { path: "/vasiyet", label: "Vasiyet", icon: <FaScroll /> },
        { path: "/varliklar", label: "Mal Varlığı", icon: <FaBuilding /> },
        { path: "/emanetler", label: "Emanetler", icon: <FaBoxOpen /> },
        { path: "/dini-yukumlulukler", label: "Dini Yükümlülükler", icon: <FaMosque /> },
        { path: "/helallik", label: "Helallik İsteği", icon: <FaHandshake /> },
        { path: "/kisiler", label: "Güvenilir Kişiler", icon: <FaUserFriends /> },
        { path: "/profil", label: "Profilim", icon: <FaUser /> },
    ];

    return (
        <div className="flex h-screen bg-background relative overflow-hidden font-sans text-text">
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
                <div className="flex items-center justify-between h-16 px-6 bg-blue-900 shadow-md flex-shrink-0">
                    <span className="text-2xl font-bold tracking-wider text-secondary">Vasiyetimdir</span>
                    <button onClick={toggleSidebar} className="lg:hidden text-white hover:text-secondary">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <div className="px-6 py-4 border-b border-blue-800">
                    <p className="text-sm text-blue-200">Hoşgeldiniz,</p>
                    <p className="text-sm font-medium truncate" title={displayName}>{displayName}</p>
                </div>

                <nav className="mt-6 px-4 space-y-2 flex-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`
                                flex items-center px-4 py-3 rounded-lg transition-colors duration-200
                                ${location.pathname === item.path
                                    ? "bg-secondary text-primary font-bold shadow-md"
                                    : "text-blue-100 hover:bg-blue-800 hover:text-white"}
                            `}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <span className="text-xl mr-3">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}

                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 mt-8 text-red-200 hover:bg-red-900/50 hover:text-red-100 rounded-lg transition-colors duration-200"
                    >
                        <span className="text-xl mr-3"><FaSignOutAlt /></span>
                        <span>Çıkış Yap</span>
                    </button>
                </nav>

                {/* Privacy Footer */}
                <div className="px-4 pb-4 mt-auto">
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
            <div className="flex-1 flex flex-col h-screen overflow-hidden z-10 w-full">
                {/* Mobile Header */}
                <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-primary text-white shadow-md flex-shrink-0">
                    <button onClick={toggleSidebar} className="text-white hover:text-secondary">
                        <FaBars className="w-6 h-6" />
                    </button>
                    <span className="text-xl font-bold text-secondary">Vasiyetimdir</span>
                    <div className="w-6"></div> {/* Spacer for centering */}
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;

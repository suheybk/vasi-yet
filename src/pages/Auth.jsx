import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FaUser, FaLock, FaEnvelope } from "react-icons/fa";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const Auth = () => {
    const { login, signup, resetPassword } = useAuth();
    const navigate = useNavigate();

    // Auth State: 'login', 'signup', or 'reset'
    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const isLogin = mode === "login";
    const isSignup = mode === "signup";
    const isReset = mode === "reset";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (isReset) {
            if (!email) return setError("Lütfen e-posta adresinizi girin.");
            setLoading(true);
            try {
                await resetPassword(email);
                setMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
            } catch (err) {
                setError("Hata: " + err.message);
            } finally {
                setLoading(false);
            }
            return;
        }

        // Basic validation for login/signup
        if (password.length < 6) {
            return setError("Şifre en az 6 karakter olmalıdır.");
        }

        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else if (isSignup) {
                await signup(email, password);
            }
            navigate("/");
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Bu e-posta adresi zaten kullanımda.");
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                setError("E-posta veya şifre hatalı.");
            } else {
                setError("Bir hata oluştu: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = (newMode) => {
        setMode(newMode);
        setError("");
        setMessage("");
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 z-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231f2937' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            ></div>

            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl z-10 border border-gray-100">
                <div className="text-center">
                    <h2 className="mt-2 text-3xl font-extrabold text-blue-900">
                        {isReset ? "Şifre Sıfırlama" : isLogin ? "Tekrar Hoşgeldiniz" : "Hesap Oluşturun"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {isReset ? "E-posta adresinizi girin, sıfırlama linki gönderelim" : isLogin ? "Hesabınıza giriş yapın" : "Vasiyetimdir ailesine katılın"}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div className="relative">
                            <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
                                <FaEnvelope />
                            </div>
                            <Input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="pl-6"
                                placeholder="E-posta adresi"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {!isReset && (
                            <div className="relative">
                                <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none text-gray-400 z-10">
                                    <FaLock />
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    className="pl-6"
                                    placeholder="Şifre"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    {isLogin && (
                        <div className="flex items-center justify-between">
                            <div className="text-sm">
                                <button
                                    type="button"
                                    onClick={() => toggleMode("reset")}
                                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                                >
                                    Şifremi unuttum?
                                </button>
                            </div>
                        </div>
                    )}

                    <div>
                        <Button
                            type="submit"
                            disabled={loading}
                            fullWidth
                            variant="primary"
                            className="group relative flex justify-center py-3"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {isReset ? "Sıfırlama Linki Gönder" : isLogin ? "Giriş Yap" : "Kayıt Ol"}
                        </Button>
                    </div>

                    {isReset && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => toggleMode("login")}
                                className="text-sm font-medium text-blue-600 hover:text-blue-500"
                            >
                                Giriş sayfasına dön
                            </button>
                        </div>
                    )}
                </form>

                {!isReset && (
                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            {isLogin ? "Hesabınız yok mu? " : "Zaten hesabınız var mı? "}
                            <button
                                onClick={() => toggleMode(isLogin ? "signup" : "login")}
                                className="font-medium text-yellow-600 hover:text-yellow-500 transition-colors focus:outline-none underline"
                            >
                                {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
                            </button>
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            Kayıt olarak <a href="/gizlilik" className="underline hover:text-gray-600" target="_blank" rel="noreferrer">KVKK ve Gizlilik Sözleşmesi</a>'ni kabul etmiş sayılırsınız.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Auth;

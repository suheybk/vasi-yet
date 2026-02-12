import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/config";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
    FaShieldAlt, FaArrowRight, FaArrowLeft, FaCheck,
    FaFileInvoiceDollar, FaHandHoldingUsd, FaScroll, FaUserFriends,
    FaLock, FaCheckCircle, FaRocket
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";

const KVKK_TEXT = `
KİŞİSEL VERİLERİN KORUNMASI VE GİZLİLİK SÖZLEŞMESİ

Son Güncelleme: 12 Şubat 2026 – Sürüm 1.0

1. TARAFLAR
İşbu sözleşme, wasiyet.com platformu ("Platform") ile platformu kullanan gerçek kişi ("Kullanıcı") arasında akdedilmiştir.

2. GİZLİLİK TAAHHÜDÜ
Wasiyet olarak, kullanıcılarımızın mahremiyetini en üst düzeyde korumayı taahhüt ederiz.

• Vasiyetiniz, borç/alacak kayıtlarınız ve kişisel bilgileriniz HİÇBİR KOŞULDA üçüncü şahıslarla paylaşılmaz.
• Verileriniz yalnızca sizin erişiminize açıktır.
• Güvenilir kişi olarak eklediğiniz kişiler dâhil hiç kimse, sizin açık onayınız olmadan verilerinize erişemez.
• Platform çalışanları da dâhil olmak üzere hiçbir gerçek veya tüzel kişi verilerinizi görüntüleyemez.

3. VERİ GÜVENLİĞİ
• Tüm veriler Google Firebase altyapısında, endüstri standardı şifreleme protokolleri (AES-256, TLS 1.3) ile korunmaktadır.
• Kimlik doğrulama Firebase Authentication ile güvenli şekilde yönetilmektedir.
• Firestore güvenlik kuralları ile her kullanıcı yalnızca kendi verilerine erişebilir.

4. 6698 SAYILI KVKK KAPSAMINDA HAKLARINIZ
6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:

a) Kişisel verilerinizin işlenip işlenmediğini öğrenme,
b) Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme,
c) Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,
d) Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme,
e) Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme,
f) KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme,
g) İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme.

5. TOPLANAN VERİLER
Platform aşağıdaki verileri toplar ve işler:
• E-posta adresi (kimlik doğrulama)
• Ad Soyad (profil bilgisi)
• Telefon numarası (iletişim)
• Borç/Alacak kayıtları (uygulama işlevselliği)
• Vasiyet metni (uygulama işlevselliği)
• Güvenilir kişi bilgileri (uygulama işlevselliği)

6. VERİLERİN SİLİNMESİ
Hesabınızı silmek istediğinizde, tüm kişisel verileriniz geri dönülemez şekilde silinir. Bu talep için info@wasiyet.com adresine e-posta gönderebilirsiniz.

7. ÇEREZLER VE ANALİTİK
Platform, kullanıcı deneyimini iyileştirmek amacıyla Google Analytics kullanmaktadır. Toplanan veriler anonimleştirilmiş istatistiksel verilerdir ve kişisel olarak tanımlanabilir bilgi içermez.

8. SÖZLEŞMENİN KABULÜ
Bu sözleşmeyi kabul etmekle, yukarıdaki şartları okuduğunuzu, anladığınızı ve kabul ettiğinizi beyan edersiniz.

İletişim: info@wasiyet.com
`.trim();

const Onboarding = () => {
    const { currentUser, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [saving, setSaving] = useState(false);
    const [kvkkScrolled, setKvkkScrolled] = useState(false);
    const [kvkkAccepted, setKvkkAccepted] = useState(false);
    const kvkkRef = useRef(null);

    const [formData, setFormData] = useState({
        displayName: currentUser?.displayName || "",
        phone: ""
    });

    const handleKvkkScroll = () => {
        if (!kvkkRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = kvkkRef.current;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            setKvkkScrolled(true);
        }
    };

    const handleComplete = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                displayName: formData.displayName,
                phone: formData.phone,
                email: currentUser.email,
                onboardingComplete: true,
                kvkkAcceptedAt: serverTimestamp(),
                kvkkVersion: "1.0",
                createdAt: serverTimestamp()
            });
            await refreshProfile(currentUser.uid);
            toast.success("Hoş geldiniz! Hesabınız hazır.");
            navigate("/dashboard");
        } catch (error) {
            toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const features = [
        { icon: <FaFileInvoiceDollar />, title: "Borç Takibi", desc: "Borçlarınızı güvenle kaydedin." },
        { icon: <FaHandHoldingUsd />, title: "Alacak Takibi", desc: "Alacaklarınızı takip edin." },
        { icon: <FaScroll />, title: "Dijital Vasiyet", desc: "Vasiyetinizi dijital ortamda oluşturun." },
        { icon: <FaUserFriends />, title: "Güvenilir Kişiler", desc: "Vefat durumunda bilgilendirilecek kişiler." },
    ];

    const steps = [
        // Step 0: Welcome
        <div key="welcome" className="text-center space-y-8 animate-fadeIn">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <FaShieldAlt className="text-3xl text-yellow-400" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Wasiyet'e Hoş Geldiniz</h2>
                <p className="text-gray-500 mt-3 max-w-md mx-auto">
                    Dijital vasiyetinizi oluşturun, borç ve alacaklarınızı güvenle takip edin.
                    Tüm verileriniz şifrelenmiş olarak korunur.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {features.map((f, i) => (
                    <div key={i} className="bg-blue-50 rounded-xl p-4 text-center hover:bg-blue-100 transition">
                        <div className="text-2xl text-blue-700 mb-2 flex justify-center">{f.icon}</div>
                        <h4 className="font-semibold text-gray-800 text-sm">{f.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
                    </div>
                ))}
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="flex items-center gap-2 text-green-700">
                    <FaLock />
                    <span className="font-medium text-sm">Verileriniz hiçbir koşulda 3. şahıslarla paylaşılmaz.</span>
                </div>
            </div>
        </div>,

        // Step 1: Personal Info
        <div key="info" className="space-y-6 animate-fadeIn">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Kişisel Bilgileriniz</h2>
                <p className="text-gray-500 mt-2">Size daha iyi hizmet verebilmemiz için bilgilerinizi giriniz.</p>
            </div>

            <div className="max-w-md mx-auto space-y-5">
                <Input
                    label="Ad Soyad *"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="Adınız ve soyadınız"
                    required
                />
                <Input
                    label="Telefon Numarası *"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    required
                />
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-500">
                    <FaLock className="inline mr-1 text-gray-400" />
                    Bu bilgiler yalnızca profilinizde görüntülenir ve üçüncü kişilerle paylaşılmaz.
                </div>
            </div>
        </div>,

        // Step 2: KVKK Agreement
        <div key="kvkk" className="space-y-5 animate-fadeIn">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Gizlilik Sözleşmesi</h2>
                <p className="text-gray-500 mt-2">Lütfen sözleşmeyi okuyunuz ve kabul ediniz.</p>
            </div>

            <div className="max-w-lg mx-auto">
                <div
                    ref={kvkkRef}
                    onScroll={handleKvkkScroll}
                    className="h-72 overflow-y-auto border border-gray-200 rounded-xl p-5 bg-gray-50 text-sm text-gray-700 leading-relaxed whitespace-pre-line scrollbar-thin"
                >
                    {KVKK_TEXT}
                </div>

                {!kvkkScrolled && (
                    <p className="text-xs text-amber-600 mt-2 text-center animate-pulse">
                        ↓ Sözleşmeyi sonuna kadar okuyunuz.
                    </p>
                )}

                <label className={`flex items-start gap-3 mt-4 p-4 rounded-lg border-2 cursor-pointer transition ${kvkkAccepted ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-blue-300'} ${!kvkkScrolled ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input
                        type="checkbox"
                        checked={kvkkAccepted}
                        onChange={(e) => setKvkkAccepted(e.target.checked)}
                        disabled={!kvkkScrolled}
                        className="w-5 h-5 mt-0.5 text-green-600 border-gray-300 rounded focus:ring-green-500 flex-shrink-0"
                    />
                    <span className="text-sm text-gray-700">
                        <strong>6698 sayılı KVKK</strong> kapsamında kişisel verilerimin işlenmesine ilişkin yukarıdaki sözleşmeyi okudum, anladım ve <strong>kabul ediyorum</strong>.
                    </span>
                </label>
            </div>
        </div>,

        // Step 3: Ready
        <div key="ready" className="text-center space-y-6 animate-fadeIn">
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <FaCheckCircle className="text-4xl text-white" />
            </div>
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Her Şey Hazır!</h2>
                <p className="text-gray-500 mt-3 max-w-md mx-auto">
                    Hesabınız başarıyla oluşturuldu. Artık vasiyetinizi oluşturabilir, borç ve alacaklarınızı takip edebilirsiniz.
                </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 max-w-md mx-auto space-y-3">
                <div className="flex items-center gap-3 text-left">
                    <FaCheck className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Hesabınız güvenli şekilde oluşturuldu</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                    <FaCheck className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">KVKK Gizlilik Sözleşmesi onaylandı</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                    <FaCheck className="text-green-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700">Verileriniz 256-bit şifreleme ile korunuyor</span>
                </div>
            </div>
        </div>
    ];

    const canProceed = () => {
        if (step === 1) return formData.displayName.trim() && formData.phone.trim();
        if (step === 2) return kvkkAccepted;
        return true;
    };

    const isLastStep = step === steps.length - 1;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((_, i) => (
                        <div key={i} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i < step ? 'bg-green-500 text-white' :
                                i === step ? 'bg-blue-900 text-white scale-110 shadow-lg' :
                                    'bg-gray-200 text-gray-400'
                                }`}>
                                {i < step ? <FaCheck className="text-xs" /> : i + 1}
                            </div>
                            {i < steps.length - 1 && (
                                <div className={`w-12 h-1 mx-1 rounded transition-all duration-300 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 border border-gray-100">
                    {steps[step]}

                    {/* Navigation */}
                    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition min-h-[44px] px-4"
                            >
                                <FaArrowLeft /> Geri
                            </button>
                        ) : (
                            <div></div>
                        )}

                        {isLastStep ? (
                            <Button
                                onClick={handleComplete}
                                disabled={saving}
                                variant="primary"
                                className="flex items-center gap-2 px-8 py-3"
                            >
                                {saving ? "Hazırlanıyor..." : <><FaRocket /> Başlayalım!</>}
                            </Button>
                        ) : (
                            <Button
                                onClick={() => setStep(step + 1)}
                                disabled={!canProceed()}
                                variant="primary"
                                className="flex items-center gap-2 px-8 py-3"
                            >
                                Devam Et <FaArrowRight />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-400 mt-4">
                    Wasiyet © 2026 — Tüm hakları saklıdır.
                </p>
            </div>
        </div>
    );
};

export default Onboarding;

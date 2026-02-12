import { FaArrowLeft, FaShieldAlt, FaLock, FaEnvelope } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4">
            <div className="max-w-3xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 min-h-[44px]"
                >
                    <FaArrowLeft /> Geri Dön
                </button>

                <Card className="p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
                            <FaShieldAlt className="text-xl text-yellow-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Gizlilik Politikası & KVKK</h1>
                            <p className="text-sm text-gray-500">Son güncelleme: 12 Şubat 2026 — Sürüm 1.0</p>
                        </div>
                    </div>

                    <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                                <FaLock /> Temel Güvencemiz
                            </div>
                            <p className="text-green-700 text-sm">
                                Vasiyetiniz, borç/alacak kayıtlarınız ve kişisel bilgileriniz <strong>hiçbir koşulda üçüncü şahıslarla paylaşılmaz</strong>.
                                Verileriniz yalnızca sizin erişiminize açıktır.
                            </p>
                        </div>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">1. Taraflar</h2>
                            <p>İşbu sözleşme, Vasiyetimdir platformu ("Platform") ile platformu kullanan gerçek kişi ("Kullanıcı") arasında akdedilmiştir.</p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">2. Gizlilik Taahhüdü</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Vasiyetiniz, borç/alacak kayıtlarınız ve kişisel bilgileriniz HİÇBİR KOŞULDA üçüncü şahıslarla paylaşılmaz.</li>
                                <li>Verileriniz yalnızca sizin erişiminize açıktır.</li>
                                <li>Güvenilir kişi olarak eklediğiniz kişiler dâhil hiç kimse, sizin açık onayınız olmadan verilerinize erişemez.</li>
                                <li>Platform çalışanları da dâhil olmak üzere hiçbir gerçek veya tüzel kişi verilerinizi görüntüleyemez.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">3. Veri Güvenliği</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Tüm veriler Google Firebase altyapısında, endüstri standardı şifreleme protokolleri (AES-256, TLS 1.3) ile korunmaktadır.</li>
                                <li>Kimlik doğrulama Firebase Authentication ile güvenli şekilde yönetilmektedir.</li>
                                <li>Firestore güvenlik kuralları ile her kullanıcı yalnızca kendi verilerine erişebilir.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">4. KVKK Kapsamında Haklarınız</h2>
                            <p>6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında aşağıdaki haklara sahipsiniz:</p>
                            <ol className="list-alpha pl-5 space-y-1">
                                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması hâlinde bunların düzeltilmesini isteme</li>
                                <li>KVKK'nın 7. maddesinde öngörülen şartlar çerçevesinde kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                                <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                            </ol>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">5. Toplanan Veriler</h2>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>E-posta adresi (kimlik doğrulama)</li>
                                <li>Ad Soyad (profil bilgisi)</li>
                                <li>Telefon numarası (iletişim)</li>
                                <li>Borç/Alacak kayıtları (uygulama işlevselliği)</li>
                                <li>Vasiyet metni (uygulama işlevselliği)</li>
                                <li>Güvenilir kişi bilgileri (uygulama işlevselliği)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">6. Verilerin Silinmesi</h2>
                            <p>
                                Hesabınızı silmek istediğinizde, tüm kişisel verileriniz geri dönülemez şekilde silinir.
                                Bu talep için <strong>destek@vasiyetimdir.com</strong> adresine e-posta gönderebilirsiniz.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">7. Çerezler ve Analitik</h2>
                            <p>
                                Platform, kullanıcı deneyimini iyileştirmek amacıyla Google Analytics kullanmaktadır.
                                Toplanan veriler anonimleştirilmiş istatistiksel verilerdir ve kişisel olarak tanımlanabilir bilgi içermez.
                            </p>
                        </section>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-8">
                            <div className="flex items-center gap-2 text-blue-800 font-semibold mb-2">
                                <FaEnvelope /> İletişim
                            </div>
                            <p className="text-blue-700 text-sm">
                                Sorularınız için: <strong>destek@vasiyetimdir.com</strong>
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PrivacyPolicy;

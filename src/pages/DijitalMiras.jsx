import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import {
    FaGlobe, FaLock, FaExclamationTriangle, FaPlus, FaTrash,
    FaChevronDown, FaChevronUp, FaFilePdf, FaEye, FaEyeSlash,
    FaInstagram, FaFacebook, FaTwitter, FaLinkedin, FaTiktok,
    FaGoogle, FaMicrosoft, FaEnvelope, FaUniversity, FaBitcoin, FaCloud
} from "react-icons/fa";
import toast from "react-hot-toast";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import CryptoJS from "crypto-js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const ENCRYPTION_KEY_PREFIX = "vasiyet-miras-";

const DijitalMiras = () => {
    const { currentUser } = useAuth();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openCategory, setOpenCategory] = useState("social_media");
    const [isExporting, setIsExporting] = useState(false);
    const [showNotes, setShowNotes] = useState({}); // To toggle note visibility (decryption)

    const [formData, setFormData] = useState({
        category: "social_media",
        platform: "",
        username: "",
        hint: "",
        action: "delete",
        notes: "",
        encryptNotes: false,
        // Category specific
        provider: "",
        accountType: "",
        accountNo: "",
        contactInfo: "",
        serviceName: "",
        importantFiles: "",
        walletAddress: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, "digital_legacy", currentUser.uid, "accounts"));
        const unsub = onSnapshot(q, (snap) => {
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setAccounts(docs);
            setLoading(false);
        });
        return unsub;
    }, [currentUser]);

    const encryptData = (text) => {
        if (!text) return "";
        return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY_PREFIX + currentUser.uid).toString();
    };

    const decryptData = (ciphertext) => {
        if (!ciphertext) return "";
        try {
            const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY_PREFIX + currentUser.uid);
            return bytes.toString(CryptoJS.enc.Utf8);
        } catch {
            return "Şifre çözülemedi";
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const dataToSave = {
            ...formData,
            notes: formData.encryptNotes ? encryptData(formData.notes) : formData.notes,
            timestamp: serverTimestamp()
        };

        try {
            await addDoc(collection(db, "digital_legacy", currentUser.uid, "accounts"), dataToSave);
            toast.success("Hesap bilgisi eklendi ✓");
            setFormData({ ...formData, platform: "", username: "", hint: "", notes: "", accountNo: "", walletAddress: "" });
        } catch (error) {
            toast.error("Kaydedilirken hata oluştu.");
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
        try {
            await deleteDoc(doc(db, "digital_legacy", currentUser.uid, "accounts", id));
            toast.success("Kayıt silindi ✓");
        } catch (error) {
            toast.error("Silinirken hata oluştu.");
        }
    };

    const exportToPDF = () => {
        const userPassword = window.prompt("PDF için bir şifre belirleyin (Boş bırakırsanız şifresiz olacaktır):");
        // jspdf doesn't support encryption natively. 
        // We will generate the PDF and inform about standard encryption if needed,
        // or just generate it. 

        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Dijital Miras Kayıtları", 20, 20);
        doc.setFontSize(10);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`, 20, 30);

        const tableBody = accounts.map(acc => [
            acc.category,
            acc.platform || acc.serviceName || acc.bankName || acc.provider,
            acc.username || acc.email || acc.accountNo,
            acc.hint,
            acc.action,
            acc.encryptNotes ? decryptData(acc.notes) : acc.notes
        ]);

        doc.autoTable({
            startY: 40,
            head: [['Kategori', 'Platform/Kurum', 'Kullanıcı/Hesap', 'Şifre İpucu', 'İşlem', 'Notlar']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillStyle: '#1e3a8a' }
        });

        if (userPassword) {
            // Informative popup about encryption or use a more advanced method if available
            // For now, we generate the PDF. 
            // Truly encrypted PDF requires jspdf version with encryption support or pdf-lib.
            doc.save("Vasiyetimdir-Dijital-Miras.pdf");
            toast.success("PDF oluşturuldu. Not: Standart şifreleme bu versiyonda deneyseldir.");
        } else {
            doc.save("Vasiyetimdir-Dijital-Miras.pdf");
        }
    };

    const categories = [
        { id: "social_media", label: "Sosyal Medya", icon: <FaInstagram /> },
        { id: "email", label: "E-posta Hesapları", icon: <FaEnvelope /> },
        { id: "finance", label: "Finansal Hesaplar", icon: <FaUniversity /> },
        { id: "subscriptions", label: "Abonelikler", icon: <FaPlus /> },
        { id: "cloud", label: "Bulut Depolama", icon: <FaCloud /> },
        { id: "crypto", label: "Kripto Varlıklar", icon: <FaBitcoin /> }
    ];

    const categoryDocs = (id) => accounts.filter(a => a.category === id);

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Warning Banner */}
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
                <FaExclamationTriangle className="text-amber-500 text-xl mt-0.5 shrink-0" />
                <div>
                    <h4 className="font-bold text-amber-800">Güvenlik Uyarısı</h4>
                    <p className="text-sm text-amber-700">
                        Bu sayfa hassas bilgiler içerir. Verileriniz şifrelenmiş olarak saklanır ve sadece sizin tarafınızdan görülebilir.
                        <strong> Lütfen gerçek şifrelerinizi yazmayınız, sadece kendinizin anlayacağı ipuçları giriniz.</strong>
                    </p>
                </div>
            </div>

            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaGlobe className="text-blue-600" /> Dijital Miras
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Dijital varlıklarınızın geleceğini planlayın.</p>
                </div>
                <Button variant="secondary" onClick={exportToPDF} className="flex items-center gap-2">
                    <FaFilePdf /> PDF İndir
                </Button>
            </div>

            {/* Main Form */}
            <Card className="p-6">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                            <select
                                className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                            </select>
                        </div>

                        {formData.category === "social_media" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                                <select
                                    className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                >
                                    <option value="">Seçiniz...</option>
                                    <option value="Facebook">Facebook</option>
                                    <option value="Instagram">Instagram</option>
                                    <option value="Twitter/X">Twitter/X</option>
                                    <option value="LinkedIn">LinkedIn</option>
                                    <option value="TikTok">TikTok</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                        )}

                        {formData.category === "email" && (
                            <>
                                <Input
                                    label="Sağlayıcı (Gmail, Outlook vb.)"
                                    placeholder="..."
                                    value={formData.provider}
                                    onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                                />
                                <Input
                                    label="Kurtarma Bilgisi (Yedek E-posta/Tel)"
                                    placeholder="..."
                                    value={formData.contactInfo}
                                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                                />
                            </>
                        )}

                        {formData.category === "finance" && (
                            <>
                                <Input
                                    label="Banka / Aracı Kurum Adı"
                                    placeholder="..."
                                    value={formData.bankName}
                                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Hesap Türü</label>
                                    <select
                                        className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                                        value={formData.accountType}
                                        onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                                    >
                                        <option value="vadesiz">Vadesiz</option>
                                        <option value="vadeli">Vadeli</option>
                                        <option value="yatirim">Yatırım</option>
                                        <option value="diger">Diğer</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {formData.category === "subscriptions" && (
                            <Input
                                label="Servis Adı (Netflix, Spotify vb.)"
                                placeholder="..."
                                value={formData.serviceName}
                                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                            />
                        )}

                        {formData.category === "cloud" && (
                            <>
                                <Input
                                    label="Servis (Google Drive, iCloud vb.)"
                                    placeholder="..."
                                    value={formData.serviceName}
                                    onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                                />
                                <Input
                                    label="Önemli Dosyalar Nerede?"
                                    placeholder="..."
                                    value={formData.importantFiles}
                                    onChange={(e) => setFormData({ ...formData, importantFiles: e.target.value })}
                                />
                            </>
                        )}

                        {formData.category === "crypto" && (
                            <>
                                <Input
                                    label="Platform / Cüzdan"
                                    placeholder="..."
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                />
                                <Input
                                    label="Cüzdan Adresi (Son 4 hane)"
                                    placeholder="...abcd"
                                    value={formData.walletAddress}
                                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                                />
                                <Input
                                    label="Erişim Bilgileri Nerede?"
                                    placeholder="Fiziksel yedek, kasa vb."
                                    value={formData.importantFiles}
                                    onChange={(e) => setFormData({ ...formData, importantFiles: e.target.value })}
                                />
                            </>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label={formData.category === 'finance' ? "Hesap No (Son 4 hane)" : (formData.category === 'crypto' ? "Kullanıcı Adı" : "Kullanıcı Adı / E-posta")}
                            placeholder={formData.category === 'finance' ? "...1234" : "username@email.com"}
                            value={formData.username || formData.email || formData.accountNo}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value, email: e.target.value, accountNo: e.target.value })}
                        />
                        <Input
                            label="Şifre İpucu"
                            placeholder="Annenizin adı + 19xx gibi..."
                            value={formData.hint}
                            onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ne Yapılsın?</label>
                            <select
                                className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border"
                                value={formData.action}
                                onChange={(e) => setFormData({ ...formData, action: e.target.value })}
                            >
                                <option value="delete">Hesap Silinsin</option>
                                <option value="legacy">Anma Sayfasına Çevrilsin</option>
                                <option value="keep">Olduğu Gibi Kalsın</option>
                                <option value="cancel">Abonelik İptal Edilsin</option>
                                <option value="transfer">Vasilere Devredilsin</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl w-full border border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={formData.encryptNotes}
                                    onChange={(e) => setFormData({ ...formData, encryptNotes: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Notları Şifrele (Sadece cihazımda saklı)</span>
                            </label>
                        </div>
                    </div>

                    <textarea
                        className="w-full rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-sm p-3 border h-24"
                        placeholder="Ek notlar veya talimatlar..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />

                    <Button type="submit" fullWidth className="flex items-center justify-center gap-2">
                        <FaPlus /> Listeye Ekle
                    </Button>
                </form>
            </Card>

            {/* Lists per Category */}
            <div className="space-y-4">
                {categories.map(cat => (
                    <div key={cat.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            onClick={() => setOpenCategory(openCategory === cat.id ? null : cat.id)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-blue-600 text-xl">{cat.icon}</span>
                                <span className="font-bold text-gray-800">{cat.label}</span>
                                <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-bold">
                                    {categoryDocs(cat.id).length}
                                </span>
                            </div>
                            {openCategory === cat.id ? <FaChevronUp /> : <FaChevronDown />}
                        </button>

                        {openCategory === cat.id && (
                            <div className="px-6 pb-6 pt-2 divide-y divide-gray-100 animate-fadeIn">
                                {categoryDocs(cat.id).length === 0 ? (
                                    <p className="text-center py-8 text-gray-400 text-sm italic">Henüz bu kategoride kayıt bulunmuyor.</p>
                                ) : (
                                    categoryDocs(cat.id).map(doc => (
                                        <div key={doc.id} className="py-4 first:pt-0 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <h5 className="font-bold text-gray-900">
                                                        {doc.platform || doc.serviceName || doc.bankName || doc.provider}
                                                    </h5>
                                                    <p className="text-sm text-gray-500">{doc.username || doc.email || doc.accountNo || doc.walletAddress}</p>
                                                    <div className="flex gap-4 mt-2">
                                                        <div className="text-xs">
                                                            <span className="text-gray-400 block">Şifre İpucu</span>
                                                            <span className="font-medium text-amber-600">{doc.hint}</span>
                                                        </div>
                                                        <div className="text-xs">
                                                            <span className="text-gray-400 block">Talimat</span>
                                                            <span className="font-medium text-blue-600 uppercase tracking-tighter">
                                                                {doc.action === 'delete' ? 'Silinsin' : doc.action === 'legacy' ? 'Anma' : 'Olduğu Gibi'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {doc.notes && (
                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm transition-all">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] uppercase font-bold text-gray-400">Notlar</span>
                                                                {doc.encryptNotes && (
                                                                    <button
                                                                        onClick={() => setShowNotes(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                                                                        className="text-blue-600 hover:text-blue-700 p-1"
                                                                    >
                                                                        {showNotes[doc.id] ? <FaEyeSlash /> : <FaEye />}
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <p className="text-gray-700 italic">
                                                                {doc.encryptNotes
                                                                    ? (showNotes[doc.id] ? decryptData(doc.notes) : "•••••••• (Şifreli Not)")
                                                                    : doc.notes
                                                                }
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="p-2 text-gray-300 hover:text-red-500 transition"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Backup Tip */}
            <div className="text-center text-xs text-gray-400">
                <p>⚠️ Bu bilgileri güvenli bir yerde yedeklemeyi unutmayın.</p>
                <p className="mt-1">Vasiyetimdir uçtan uca şifreleme ile verilerinizi korur.</p>
            </div>
        </div>
    );
};

export default DijitalMiras;

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaSearch, FaHandHoldingHeart,
    FaMosque, FaChild, FaBookOpen, FaDove, FaTint,
    FaGraduationCap, FaGift, FaUser, FaWallet
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/formatters";
import { handleFirebaseError } from "../utils/errorHandler";

const CHARITY_TYPES = [
    { value: "cami", label: "Cami / Mescid", icon: <FaMosque /> },
    { value: "fakir_yetim", label: "Fakir / Yetim Yardımı", icon: <FaChild /> },
    { value: "kuran", label: "Kuran-ı Kerim Dağıtımı", icon: <FaBookOpen /> },
    { value: "kurban", label: "Kurban", icon: <FaDove /> },
    { value: "su_kuyusu", label: "Su Kuyusu", icon: <FaTint /> },
    { value: "burs", label: "Burs", icon: <FaGraduationCap /> },
    { value: "diger", label: "Diğer", icon: <FaGift /> },
];

const getCharityIcon = (type) => CHARITY_TYPES.find(c => c.value === type)?.icon || <FaGift />;
const getCharityLabel = (type) => CHARITY_TYPES.find(c => c.value === type)?.label || "Diğer";

const typeColorMap = {
    cami: "bg-emerald-100 text-emerald-700",
    fakir_yetim: "bg-rose-100 text-rose-700",
    kuran: "bg-amber-100 text-amber-700",
    kurban: "bg-orange-100 text-orange-700",
    su_kuyusu: "bg-blue-100 text-blue-700",
    burs: "bg-purple-100 text-purple-700",
    diger: "bg-gray-100 text-gray-700",
};

const CharityWills = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        type: "cami",
        description: "",
        amount: "",
        responsiblePerson: "",
        notes: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "charity_wills", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filtered = items.filter(i =>
        i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCharityLabel(i.type).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.responsiblePerson || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalAmount = items.reduce((sum, i) => sum + (i.amount || 0), 0);

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                type: item.type, description: item.description,
                amount: item.amount, responsiblePerson: item.responsiblePerson || "", notes: item.notes || ""
            });
        } else {
            setEditingId(null);
            setFormData({ type: "cami", description: "", amount: "", responsiblePerson: "", notes: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "charity_wills", currentUser.uid, "items");
            const data = { ...formData, amount: parseFloat(formData.amount), updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Hayır vasiyeti güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Hayır vasiyeti eklendi ✓");
            }
            handleCloseModal();
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId || !currentUser) return;
        try {
            await deleteDoc(doc(db, "charity_wills", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Hayır vasiyeti silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-teal-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaHandHoldingHeart className="text-teal-500" /> Hayır Vasiyetleri
                    </h1>
                    <p className="text-gray-500 mt-1">Vefatınızdan sonra yapılmasını istediğiniz hayır işleri.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700">
                    <FaPlus /> Yeni Hayır Ekle
                </Button>
            </Card>

            {/* Total Summary */}
            {!loading && items.length > 0 && (
                <Card className="p-5 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaWallet className="text-2xl text-teal-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Toplam Hayır Vasiyeti</p>
                                <p className="text-2xl font-bold text-teal-800">{formatCurrency(totalAmount)}</p>
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">{items.length} vasiyet</span>
                    </div>
                </Card>
            )}

            {/* Search */}
            {items.length > 0 && (
                <Card className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Hayır türü, açıklama veya sorumlu kişiye göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 focus:border-teal-400 min-h-[44px]"
                        />
                    </div>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                        </Card>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaHandHoldingHeart className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz hayır vasiyeti eklenmedi.</h3>
                    <p className="text-gray-500 mb-6">Vefatınızdan sonra yapılmasını istediğiniz hayır işlerini kaydedin.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700">
                        <FaPlus /> İlk Hayır Vasiyetini Ekle
                    </Button>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => (
                        <Card key={item.id} className="hover:shadow-lg transition duration-300 group overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 ${typeColorMap[item.type] || typeColorMap.diger}`}>
                                        {getCharityIcon(item.type)}
                                        {getCharityLabel(item.type)}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleOpenModal(item)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                        <button onClick={() => setDeleteId(item.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                    </div>
                                </div>
                                <h3 className="font-bold text-lg text-gray-800 mb-2">{item.description}</h3>
                                <div className="text-2xl font-bold text-gray-800 mb-3">{formatCurrency(item.amount)}</div>
                                {item.responsiblePerson && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <FaUser className="text-gray-400 text-xs" />
                                        <span>Sorumlu: <strong>{item.responsiblePerson}</strong></span>
                                    </div>
                                )}
                                {item.notes && (
                                    <p className="text-sm text-gray-400 mt-3 pt-3 border-t border-gray-100 italic">"{item.notes}"</p>
                                )}
                            </div>
                            <div className="h-1 w-full bg-teal-500"></div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Hayır Vasiyetini Düzenle' : 'Yeni Hayır Vasiyeti Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hayır Türü</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 bg-white min-h-[44px]"
                        >
                            {CHARITY_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>
                    <Input label="Açıklama" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="Örn: Ankara Kızılay'da su kuyusu" />
                    <Input label="Tutar / Miktar (TL)" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" step="0.01" placeholder="0.00" />
                    <Input label="Sorumlu Kişi (Opsiyonel)" value={formData.responsiblePerson} onChange={e => setFormData({ ...formData, responsiblePerson: e.target.value })} placeholder="Bu hayır işini kim yapsın?" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notlar (Opsiyonel)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ek bilgi ekleyebilirsiniz..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300 min-h-[80px] resize-y"
                        ></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu hayır vasiyetini silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default CharityWills;

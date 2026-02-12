import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaBuilding, FaCar,
    FaUniversity, FaCoins, FaChartLine, FaBoxOpen, FaSearch, FaWallet
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/formatters";
import { handleFirebaseError } from "../utils/errorHandler";

const ASSET_TYPES = [
    { value: "gayrimenkul", label: "Gayrimenkul", icon: <FaBuilding /> },
    { value: "arac", label: "Araç", icon: <FaCar /> },
    { value: "banka", label: "Banka Hesabı", icon: <FaUniversity /> },
    { value: "altin", label: "Altın / Gümüş", icon: <FaCoins /> },
    { value: "yatirim", label: "Hisse / Yatırım", icon: <FaChartLine /> },
    { value: "diger", label: "Diğer", icon: <FaBoxOpen /> },
];

const getAssetIcon = (type) => {
    const found = ASSET_TYPES.find(a => a.value === type);
    return found ? found.icon : <FaBoxOpen />;
};

const getAssetLabel = (type) => {
    const found = ASSET_TYPES.find(a => a.value === type);
    return found ? found.label : "Diğer";
};

const Assets = () => {
    const { currentUser } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [sortBy, setSortBy] = useState("value-high");

    const [formData, setFormData] = useState({
        type: "gayrimenkul",
        description: "",
        value: "",
        notes: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "assets", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setAssets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filteredAssets = assets.filter(a => {
        const matchesSearch = a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getAssetLabel(a.type).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || a.type === filterType;
        return matchesSearch && matchesType;
    }).sort((a, b) => {
        if (sortBy === "value-high") return b.value - a.value;
        if (sortBy === "value-low") return a.value - b.value;
        if (sortBy === "date-new") return (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0);
        if (sortBy === "date-old") return (a.createdAt?.toDate?.() || 0) - (b.createdAt?.toDate?.() || 0);
        return 0;
    });

    const totalValue = assets.reduce((sum, a) => sum + (a.value || 0), 0);

    const handleOpenModal = (asset = null) => {
        if (asset) {
            setEditingId(asset.id);
            setFormData({ type: asset.type, description: asset.description, value: asset.value, notes: asset.notes || "" });
        } else {
            setEditingId(null);
            setFormData({ type: "gayrimenkul", description: "", value: "", notes: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "assets", currentUser.uid, "items");
            const data = { ...formData, value: parseFloat(formData.value), updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Varlık güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Varlık başarıyla eklendi ✓");
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
            await deleteDoc(doc(db, "assets", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Varlık silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const typeColorMap = {
        gayrimenkul: "bg-blue-100 text-blue-700",
        arac: "bg-orange-100 text-orange-700",
        banka: "bg-green-100 text-green-700",
        altin: "bg-yellow-100 text-yellow-700",
        yatirim: "bg-purple-100 text-purple-700",
        diger: "bg-gray-100 text-gray-700",
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-yellow-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Mal Varlığı</h1>
                    <p className="text-gray-500">Gayrimenkul, araç, banka hesapları ve diğer varlıklarınızı kaydedin.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700">
                    <FaPlus /> Yeni Varlık Ekle
                </Button>
            </Card>

            {/* Total Summary */}
            {!loading && assets.length > 0 && (
                <Card className="p-5 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <FaWallet className="text-2xl text-yellow-600" />
                            <div>
                                <p className="text-sm font-medium text-gray-600">Toplam Tahmini Değer</p>
                                <p className="text-2xl font-bold text-yellow-800">{formatCurrency(totalValue)}</p>
                            </div>
                        </div>
                        <span className="text-sm text-gray-500">{assets.length} varlık</span>
                    </div>
                </Card>
            )}

            {/* Search & Filter */}
            {assets.length > 0 && (
                <Card className="p-4 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Varlık adına veya türüne göre ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-yellow-400 min-h-[44px]"
                            />
                        </div>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 bg-white min-h-[44px] text-sm"
                        >
                            <option value="value-high">Değer: Yüksek-Düşük</option>
                            <option value="value-low">Değer: Düşük-Yüksek</option>
                            <option value="date-new">En Yeni Önce</option>
                            <option value="date-old">En Eski Önce</option>
                        </select>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
                        <button
                            onClick={() => setFilterType("all")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filterType === "all" ? "bg-yellow-600 text-white shadow-sm" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
                        >
                            Hepsi
                        </button>
                        {ASSET_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setFilterType(type.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${filterType === type.value ? "bg-yellow-600 text-white shadow-sm" : "bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200"}`}
                            >
                                <span className="text-sm">{type.icon}</span>
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="text-xs text-gray-400 px-1">
                        {filteredAssets.length} varlık listeleniyor
                    </div>
                </Card>
            )}

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
            ) : filteredAssets.length === 0 && assets.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaBoxOpen className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz hiç varlık kaydınız bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">İlk varlığınızı ekleyerek takibe başlayın.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-yellow-600">
                        <FaPlus /> İlk Varlığı Ekle
                    </Button>
                </Card>
            ) : filteredAssets.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama veya filtre kriterlerine uygun varlık bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssets.map(asset => (
                        <Card key={asset.id} className="hover:shadow-lg transition duration-300 overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl ${typeColorMap[asset.type] || 'bg-gray-100 text-gray-600'}`}>
                                        <span className="text-xl">{getAssetIcon(asset.type)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(asset)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded" title="Düzenle">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => setDeleteId(asset.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded" title="Sil">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{getAssetLabel(asset.type)}</p>
                                    <h3 className="font-bold text-lg text-gray-800 truncate" title={asset.description}>{asset.description}</h3>
                                </div>

                                <div className="text-2xl font-bold text-gray-900 mb-4">
                                    {formatCurrency(asset.value)}
                                </div>

                                {asset.notes && (
                                    <p className="text-sm text-gray-500 line-clamp-2 italic border-l-2 border-gray-100 pl-3">
                                        "{asset.notes}"
                                    </p>
                                )}
                            </div>
                            <div className="px-6 py-3 bg-gray-50 text-xs text-gray-400 border-t border-gray-100">
                                Eklendi: {asset.createdAt?.toDate ? asset.createdAt.toDate().toLocaleDateString('tr-TR') : '-'}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Varlığı Düzenle' : 'Yeni Varlık Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Varlık Türü</label>
                            <select
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 min-h-[44px] bg-white"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {ASSET_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <Input label="Kısa Açıklama" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="Örn: Ev, Araba, Altın Bilezik" />
                        <Input label="Tahmini Değer (TL)" type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: e.target.value })} required min="0" step="0.01" placeholder="0.00" />
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-gray-700">Notlar (Opsiyonel)</label>
                            <textarea
                                className="w-full p-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-300 min-h-[100px]"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="Varlık hakkında ek bilgiler..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-yellow-600 hover:bg-yellow-700">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTrash className="text-2xl" />
                    </div>
                    <p className="text-gray-500 mb-6">Bu varlık kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Assets;

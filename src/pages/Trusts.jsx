import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaBoxOpen, FaSearch,
    FaArrowUp, FaArrowDown, FaUser, FaCalendarAlt
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { handleFirebaseError } from "../utils/errorHandler";

const Trusts = () => {
    const { currentUser } = useAuth();
    const [trusts, setTrusts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("all"); // all, verdigim, aldigim

    const [formData, setFormData] = useState({
        type: "verdigim",
        personName: "",
        description: "",
        date: "",
        notes: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "trusts", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setTrusts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filtered = trusts.filter(t => {
        const matchesTab = activeTab === "all" || t.type === activeTab;
        const matchesSearch = t.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const verdigimCount = trusts.filter(t => t.type === "verdigim").length;
    const aldigimCount = trusts.filter(t => t.type === "aldigim").length;

    const handleOpenModal = (trust = null) => {
        if (trust) {
            setEditingId(trust.id);
            setFormData({
                type: trust.type, personName: trust.personName,
                description: trust.description, date: trust.date || "", notes: trust.notes || ""
            });
        } else {
            setEditingId(null);
            setFormData({ type: "verdigim", personName: "", description: "", date: "", notes: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "trusts", currentUser.uid, "items");
            const data = { ...formData, updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Emanet güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Emanet başarıyla eklendi ✓");
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
            await deleteDoc(doc(db, "trusts", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Emanet silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const tabs = [
        { key: "all", label: "Tümü", count: trusts.length },
        { key: "verdigim", label: "Verdiğim", count: verdigimCount },
        { key: "aldigim", label: "Aldığım", count: aldigimCount },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-indigo-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Emanetler</h1>
                    <p className="text-gray-500">Verdiğiniz ve aldığınız emanetleri kayıt altına alın.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <FaPlus /> Yeni Emanet Ekle
                </Button>
            </Card>

            {/* Tabs */}
            {trusts.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition min-h-[44px] ${activeTab === tab.key
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {tab.label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-white/20' : 'bg-gray-200'}`}>{tab.count}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            {trusts.length > 0 && (
                <Card className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Kişi adı veya eşya açıklamasına göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 min-h-[44px]"
                        />
                    </div>
                </Card>
            )}

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : trusts.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaBoxOpen className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz emanet kaydınız bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">Verdiğiniz veya aldığınız emanetleri buradan takip edebilirsiniz.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                        <FaPlus /> İlk Emaneti Ekle
                    </Button>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(trust => {
                        const isVerdigim = trust.type === "verdigim";
                        return (
                            <Card key={trust.id} className="hover:shadow-lg transition duration-300 group">
                                <div className="p-5 flex flex-col sm:flex-row gap-4">
                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isVerdigim ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {isVerdigim ? <FaArrowUp className="text-xl" /> : <FaArrowDown className="text-xl" />}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isVerdigim ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {isVerdigim ? "Verdiğim Emanet" : "Aldığım Emanet"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <FaUser className="text-gray-400 text-sm" />
                                            <span className="font-bold text-gray-800">{trust.personName}</span>
                                        </div>
                                        <p className="text-gray-600 mt-1">{trust.description}</p>
                                        {trust.date && (
                                            <div className="flex items-center gap-1.5 text-sm text-gray-400 mt-2">
                                                <FaCalendarAlt className="text-xs" />
                                                {new Date(trust.date).toLocaleDateString('tr-TR')}
                                            </div>
                                        )}
                                        {trust.notes && (
                                            <p className="text-sm text-gray-400 mt-2 pt-2 border-t border-gray-100 italic">"{trust.notes}"</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex sm:flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        <button onClick={() => handleOpenModal(trust)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                        <button onClick={() => setDeleteId(trust.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                    </div>
                                </div>
                                <div className={`h-1 w-full ${isVerdigim ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Emaneti Düzenle' : 'Yeni Emanet Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Emanet Türü</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white min-h-[44px]"
                        >
                            <option value="verdigim">Verdiğim Emanet</option>
                            <option value="aldigim">Aldığım Emanet</option>
                        </select>
                    </div>
                    <Input label="Kişi Adı" value={formData.personName} onChange={e => setFormData({ ...formData, personName: e.target.value })} required placeholder="Emaneti verdiğiniz/aldığınız kişi" />
                    <Input label="Eşya / Açıklama" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required placeholder="Örn: Altın bilezik, 3 adet kitap" />
                    <Input label="Tarih" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notlar (Opsiyonel)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Ek bilgi ekleyebilirsiniz..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 min-h-[80px] resize-y"
                        ></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu emanet kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Trusts;

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaBriefcase, FaSearch,
    FaUser, FaFolderOpen, FaExchangeAlt, FaCheckCircle,
    FaClock, FaPauseCircle
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { handleFirebaseError } from "../utils/errorHandler";

const STATUSES = [
    { value: "devam", label: "Devam Ediyor", icon: <FaClock />, color: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    { value: "yarim", label: "Yarım Kaldı", icon: <FaPauseCircle />, color: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
    { value: "tamamlanacak", label: "Tamamlanacak", icon: <FaCheckCircle />, color: "bg-green-100 text-green-700", dot: "bg-green-500" },
];

const getStatus = (val) => STATUSES.find(s => s.value === val) || STATUSES[0];

const Projects = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeFilter, setActiveFilter] = useState("all");

    const [formData, setFormData] = useState({
        name: "",
        status: "devam",
        description: "",
        transferable: false,
        transferPerson: "",
        documentLocation: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "projects", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filtered = items.filter(i => {
        const matchesFilter = activeFilter === "all" || i.status === activeFilter;
        const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.description || "").toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const statusCounts = {
        all: items.length,
        devam: items.filter(i => i.status === "devam").length,
        yarim: items.filter(i => i.status === "yarim").length,
        tamamlanacak: items.filter(i => i.status === "tamamlanacak").length,
    };

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                name: item.name, status: item.status, description: item.description || "",
                transferable: item.transferable || false, transferPerson: item.transferPerson || "",
                documentLocation: item.documentLocation || ""
            });
        } else {
            setEditingId(null);
            setFormData({ name: "", status: "devam", description: "", transferable: false, transferPerson: "", documentLocation: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "projects", currentUser.uid, "items");
            const data = { ...formData, updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Proje güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Proje başarıyla eklendi ✓");
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
            await deleteDoc(doc(db, "projects", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Proje silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const filterTabs = [
        { key: "all", label: "Tümü" },
        { key: "devam", label: "Devam Ediyor" },
        { key: "yarim", label: "Yarım Kaldı" },
        { key: "tamamlanacak", label: "Tamamlanacak" },
    ];

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-slate-600 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBriefcase className="text-slate-600" /> İş ve Projeler
                    </h1>
                    <p className="text-gray-500 mt-1">Yarım kalan işleriniz ve devredilmesini istediğiniz sorumluluklar.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800">
                    <FaPlus /> Yeni Proje Ekle
                </Button>
            </Card>

            {/* Filter Tabs */}
            {items.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveFilter(tab.key)}
                            className={`px-4 py-2.5 rounded-lg font-medium text-sm transition min-h-[44px] ${activeFilter === tab.key
                                    ? 'bg-slate-700 text-white shadow-md'
                                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                        >
                            {tab.label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${activeFilter === tab.key ? 'bg-white/20' : 'bg-gray-200'}`}>{statusCounts[tab.key]}</span>
                        </button>
                    ))}
                </div>
            )}

            {/* Search */}
            {items.length > 0 && (
                <Card className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Proje adı veya açıklamaya göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 min-h-[44px]"
                        />
                    </div>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </Card>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaBriefcase className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz proje kaydınız bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">Yarım kalan işlerinizi ve devredilecek sorumluluklarınızı kaydedin.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-800">
                        <FaPlus /> İlk Projeyi Ekle
                    </Button>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filtered.map(item => {
                        const status = getStatus(item.status);
                        return (
                            <Card key={item.id} className="hover:shadow-lg transition duration-300 group overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="font-bold text-xl text-gray-800">{item.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${status.color}`}>
                                                    {status.icon} {status.label}
                                                </span>
                                                {item.transferable && (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700 flex items-center gap-1">
                                                        <FaExchangeAlt className="text-[10px]" /> Devredilebilir
                                                    </span>
                                                )}
                                            </div>
                                            {item.description && (
                                                <p className="text-gray-600 mb-3">{item.description}</p>
                                            )}
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                {item.transferPerson && (
                                                    <div className="flex items-center gap-1.5">
                                                        <FaUser className="text-gray-400 text-xs" />
                                                        <span>Devredilecek: <strong>{item.transferPerson}</strong></span>
                                                    </div>
                                                )}
                                                {item.documentLocation && (
                                                    <div className="flex items-center gap-1.5">
                                                        <FaFolderOpen className="text-gray-400 text-xs" />
                                                        <span>Doküman: <strong>{item.documentLocation}</strong></span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex sm:flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                            <button onClick={() => setDeleteId(item.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className={`h-1 w-full ${status.dot}`}></div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Projeyi Düzenle' : 'Yeni Proje Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="İş / Proje Adı" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required placeholder="Örn: E-ticaret sitesi geliştirme" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Durum</label>
                        <select
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 bg-white min-h-[44px]"
                        >
                            {STATUSES.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Projenin detaylarını açıklayın..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 min-h-[100px] resize-y"
                        ></textarea>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="transferable"
                            checked={formData.transferable}
                            onChange={e => setFormData({ ...formData, transferable: e.target.checked })}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="transferable" className="text-sm font-medium text-gray-700 cursor-pointer">
                            Bu iş/proje devredilebilir
                        </label>
                    </div>
                    {formData.transferable && (
                        <Input label="Devredilecek Kişi (Opsiyonel)" value={formData.transferPerson} onChange={e => setFormData({ ...formData, transferPerson: e.target.value })} placeholder="Bu işi devralacak kişi" />
                    )}
                    <Input label="Dosya / Doküman Konumu (Opsiyonel)" value={formData.documentLocation} onChange={e => setFormData({ ...formData, documentLocation: e.target.value })} placeholder="Örn: Google Drive linki, dosya yolu" />
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-slate-700 hover:bg-slate-800">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu projeyi silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Projects;

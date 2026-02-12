import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaHandshake, FaSearch,
    FaUser, FaPhone, FaEnvelope, FaHeart, FaStickyNote
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { handleFirebaseError } from "../utils/errorHandler";

const RELATIONSHIPS = [
    { value: "aile", label: "Aile" },
    { value: "akraba", label: "Akraba" },
    { value: "arkadas", label: "Arkadaş" },
    { value: "komsu", label: "Komşu" },
    { value: "is_arkadasi", label: "İş Arkadaşı" },
    { value: "diger", label: "Diğer" },
];

const relationColor = {
    aile: "bg-rose-100 text-rose-700",
    akraba: "bg-orange-100 text-orange-700",
    arkadas: "bg-blue-100 text-blue-700",
    komsu: "bg-green-100 text-green-700",
    is_arkadasi: "bg-purple-100 text-purple-700",
    diger: "bg-gray-100 text-gray-700",
};

const ForgivenessRequests = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const [formData, setFormData] = useState({
        fullName: "",
        relationship: "aile",
        phone: "",
        email: "",
        note: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "forgiveness_requests", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filtered = items.filter(i =>
        i.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (RELATIONSHIPS.find(r => r.value === i.relationship)?.label || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                fullName: item.fullName, relationship: item.relationship,
                phone: item.phone || "", email: item.email || "", note: item.note || ""
            });
        } else {
            setEditingId(null);
            setFormData({ fullName: "", relationship: "aile", phone: "", email: "", note: "" });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "forgiveness_requests", currentUser.uid, "items");
            const data = { ...formData, updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Kayıt güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Helallik isteği eklendi ✓");
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
            await deleteDoc(doc(db, "forgiveness_requests", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Kayıt silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-rose-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaHandshake className="text-rose-500" /> Helallik İsteği
                    </h1>
                    <p className="text-gray-500 mt-1">Vefatınızdan sonra helallik istenmesini arzu ettiğiniz kişiler.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700">
                    <FaPlus /> Kişi Ekle
                </Button>
            </Card>

            {/* Search */}
            {items.length > 0 && (
                <Card className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="İsim veya ilişkiye göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 min-h-[44px]"
                        />
                    </div>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-14 h-14 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaHeart className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Helallik isteyeceğiniz kimse eklenmedi.</h3>
                    <p className="text-gray-500 mb-6">Vefatınızdan sonra helallik istenmesini dilediğiniz kişileri buradan ekleyebilirsiniz.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700">
                        <FaPlus /> İlk Kişiyi Ekle
                    </Button>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map(item => {
                        const relLabel = RELATIONSHIPS.find(r => r.value === item.relationship)?.label || "Diğer";
                        const initials = item.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                        return (
                            <Card key={item.id} className="hover:shadow-lg transition duration-300 group overflow-hidden">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                                {initials}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{item.fullName}</h3>
                                                <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${relationColor[item.relationship] || relationColor.diger}`}>
                                                    {relLabel}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                            <button onClick={() => setDeleteId(item.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        {item.phone && (
                                            <div className="flex items-center gap-2">
                                                <FaPhone className="text-gray-400 text-xs" />
                                                <span>{item.phone}</span>
                                            </div>
                                        )}
                                        {item.email && (
                                            <div className="flex items-center gap-2">
                                                <FaEnvelope className="text-gray-400 text-xs" />
                                                <span>{item.email}</span>
                                            </div>
                                        )}
                                    </div>

                                    {item.note && (
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <div className="flex items-start gap-2">
                                                <FaStickyNote className="text-rose-300 text-xs mt-1 flex-shrink-0" />
                                                <p className="text-sm text-gray-500 italic">"{item.note}"</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="h-1 w-full bg-rose-400"></div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Kişiyi Düzenle' : 'Helallik İsteği Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Ad Soyad" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} required placeholder="Kişinin tam adı" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İlişki</label>
                        <select
                            value={formData.relationship}
                            onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white min-h-[44px]"
                        >
                            {RELATIONSHIPS.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                    <Input label="Telefon" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required placeholder="0 5XX XXX XX XX" />
                    <Input label="E-posta (Opsiyonel)" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="ornek@mail.com" />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Özel Not</label>
                        <textarea
                            value={formData.note}
                            onChange={e => setFormData({ ...formData, note: e.target.value })}
                            placeholder="Helallik isteme sebebi veya mesajınız..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-300 min-h-[100px] resize-y"
                        ></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-rose-600 hover:bg-rose-700">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu kişiyi helallik listenizden silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ForgivenessRequests;

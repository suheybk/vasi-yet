import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection, addDoc, updateDoc, deleteDoc,
    doc, onSnapshot, serverTimestamp, orderBy, query
} from "firebase/firestore";
import {
    FaPlus, FaEdit, FaTrash, FaShieldAlt, FaSearch,
    FaChild, FaUser, FaPhone, FaEnvelope, FaCalendarAlt,
    FaInfoCircle, FaUserShield
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { handleFirebaseError } from "../utils/errorHandler";

const RELATIONSHIPS = ["Aile", "Akraba", "Arkadaş", "Komşu", "Diğer"];

const Guardianship = () => {
    const { currentUser } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    const emptyGuardian = { name: "", relationship: "Aile", phone: "", email: "" };

    const [formData, setFormData] = useState({
        childName: "",
        birthDate: "",
        primaryGuardian: { ...emptyGuardian },
        secondaryGuardian: { ...emptyGuardian },
        instructions: ""
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "guardianship", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filtered = items.filter(i =>
        i.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.primaryGuardian?.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                childName: item.childName, birthDate: item.birthDate || "",
                primaryGuardian: item.primaryGuardian || { ...emptyGuardian },
                secondaryGuardian: item.secondaryGuardian || { ...emptyGuardian },
                instructions: item.instructions || ""
            });
        } else {
            setEditingId(null);
            setFormData({
                childName: "", birthDate: "",
                primaryGuardian: { ...emptyGuardian },
                secondaryGuardian: { ...emptyGuardian },
                instructions: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const updateGuardian = (type, field, value) => {
        setFormData(prev => ({
            ...prev,
            [type]: { ...prev[type], [field]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "guardianship", currentUser.uid, "items");
            const data = { ...formData, updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Vasi kaydı güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Vasi kaydı eklendi ✓");
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
            await deleteDoc(doc(db, "guardianship", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Vasi kaydı silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const calcAge = (birthDate) => {
        if (!birthDate) return null;
        const diff = Date.now() - new Date(birthDate).getTime();
        return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };

    const GuardianSection = ({ label, type }) => (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                <FaUserShield className="text-blue-500" /> {label}
            </h4>
            <Input label="Ad Soyad" value={formData[type].name} onChange={e => updateGuardian(type, "name", e.target.value)} required={type === "primaryGuardian"} placeholder="Vasinin tam adı" />
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İlişki</label>
                <select
                    value={formData[type].relationship}
                    onChange={e => updateGuardian(type, "relationship", e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white min-h-[44px]"
                >
                    {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <Input label="Telefon" value={formData[type].phone} onChange={e => updateGuardian(type, "phone", e.target.value)} placeholder="0 5XX XXX XX XX" />
            <Input label="E-posta (Opsiyonel)" type="email" value={formData[type].email} onChange={e => updateGuardian(type, "email", e.target.value)} placeholder="ornek@mail.com" />
        </div>
    );

    const GuardianDisplay = ({ guardian, label, color }) => {
        if (!guardian?.name) return null;
        return (
            <div className={`p-3 rounded-lg border ${color}`}>
                <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
                <div className="flex items-center gap-2 mb-1">
                    <FaUserShield className="text-sm text-gray-400" />
                    <span className="font-semibold text-gray-800">{guardian.name}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">{guardian.relationship}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-1">
                    {guardian.phone && <span className="flex items-center gap-1"><FaPhone className="text-[10px]" /> {guardian.phone}</span>}
                    {guardian.email && <span className="flex items-center gap-1"><FaEnvelope className="text-[10px]" /> {guardian.email}</span>}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <Card className="p-6 border-l-4 border-violet-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <FaShieldAlt className="text-violet-500" /> Vasi Atama
                    </h1>
                    <p className="text-gray-500 mt-1">Reşit olmayan çocuklarınız için vasi tayini yapabilirsiniz.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary" className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700">
                    <FaPlus /> Çocuk & Vasi Ekle
                </Button>
            </Card>

            {/* Info Alert */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <FaInfoCircle className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-amber-700">
                    <strong>Önemli:</strong> Bu kayıtlar bilgilendirme amaçlıdır. Hukuki geçerlilik için resmi vasiyetname hazırlatmanız önerilir.
                </p>
            </div>

            {/* Search */}
            {items.length > 0 && (
                <Card className="p-4">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Çocuk adı veya vasi adına göre ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 min-h-[44px]"
                        />
                    </div>
                </Card>
            )}

            {/* Content */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="h-5 bg-gray-200 rounded w-1/3 mb-4"></div>
                            <div className="h-20 bg-gray-200 rounded mb-3"></div>
                            <div className="h-20 bg-gray-200 rounded"></div>
                        </Card>
                    ))}
                </div>
            ) : items.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaChild className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz vasi kaydı bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">Reşit olmayan çocuklarınız için vasi belirleyin.</p>
                    <Button onClick={() => handleOpenModal()} variant="primary" className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700">
                        <FaPlus /> İlk Kaydı Ekle
                    </Button>
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filtered.map(item => {
                        const age = calcAge(item.birthDate);
                        return (
                            <Card key={item.id} className="hover:shadow-lg transition duration-300 group overflow-hidden">
                                <div className="p-6">
                                    {/* Child Info */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-14 h-14 bg-gradient-to-br from-violet-400 to-violet-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                                                <FaChild className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-800">{item.childName}</h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                                    {item.birthDate && (
                                                        <>
                                                            <FaCalendarAlt className="text-xs" />
                                                            <span>{new Date(item.birthDate).toLocaleDateString('tr-TR')}</span>
                                                            {age !== null && <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-xs font-medium">{age} yaş</span>}
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleOpenModal(item)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                            <button onClick={() => setDeleteId(item.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                        </div>
                                    </div>

                                    {/* Guardians */}
                                    <div className="space-y-3">
                                        <GuardianDisplay guardian={item.primaryGuardian} label="1. VASİ (ASİL)" color="bg-blue-50 border-blue-200" />
                                        <GuardianDisplay guardian={item.secondaryGuardian} label="2. VASİ (YEDEK)" color="bg-gray-50 border-gray-200" />
                                    </div>

                                    {/* Instructions */}
                                    {item.instructions && (
                                        <div className="mt-4 pt-3 border-t border-gray-100">
                                            <p className="text-sm text-gray-500 italic">"{item.instructions}"</p>
                                        </div>
                                    )}
                                </div>
                                <div className="h-1 w-full bg-violet-500"></div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Vasi Kaydını Düzenle' : 'Yeni Vasi Kaydı Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
                    <div className="p-4 bg-violet-50 rounded-lg space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                            <FaChild className="text-violet-500" /> Çocuk Bilgileri
                        </h4>
                        <Input label="Çocuk İsmi" value={formData.childName} onChange={e => setFormData({ ...formData, childName: e.target.value })} required placeholder="Çocuğun tam adı" />
                        <Input label="Doğum Tarihi" type="date" value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                    </div>

                    <GuardianSection label="Birinci Vasi (Asil)" type="primaryGuardian" />
                    <GuardianSection label="İkinci Vasi (Yedek)" type="secondaryGuardian" />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Özel Talimatlar (Opsiyonel)</label>
                        <textarea
                            value={formData.instructions}
                            onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                            placeholder="Çocuğunuzun bakımı ile ilgili özel talimatlarınız..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-300 min-h-[80px] resize-y"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex gap-3 sticky bottom-0 bg-white pb-1">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="primary" fullWidth disabled={saving} className="bg-violet-600 hover:bg-violet-700">
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu vasi kaydını silmek istediğinize emin misiniz?</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Guardianship;

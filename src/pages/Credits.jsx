import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp,
    orderBy,
    query
} from "firebase/firestore";
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaHandHoldingUsd, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/formatters";
import { handleFirebaseError } from "../utils/errorHandler";

const Credits = () => {
    const { currentUser } = useAuth();
    const [credits, setCredits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");

    const [formData, setFormData] = useState({
        personName: "",
        amount: "",
        date: "",
        isPaid: false
    });

    useEffect(() => {
        if (!currentUser) return;
        const collectionRef = collection(db, "credits", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCredits(items);
            setLoading(false);
        });
        return unsubscribe;
    }, [currentUser]);

    const filteredCredits = credits.filter(credit => {
        const matchesSearch = credit.personName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" ||
            (filterStatus === "paid" && credit.isPaid) ||
            (filterStatus === "unpaid" && !credit.isPaid);
        return matchesSearch && matchesFilter;
    });

    const handleOpenModal = (credit = null) => {
        if (credit) {
            setEditingId(credit.id);
            setFormData({ personName: credit.personName, amount: credit.amount, date: credit.date, isPaid: credit.isPaid });
        } else {
            setEditingId(null);
            setFormData({ personName: "", amount: "", date: new Date().toISOString().split('T')[0], isPaid: false });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => { setIsModalOpen(false); setEditingId(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        setSaving(true);
        try {
            const collectionRef = collection(db, "credits", currentUser.uid, "items");
            const data = { ...formData, amount: parseFloat(formData.amount), updatedAt: serverTimestamp() };
            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Alacak güncellendi ✓");
            } else {
                await addDoc(collectionRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Alacak başarıyla eklendi ✓");
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
            await deleteDoc(doc(db, "credits", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Alacak silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const togglePaid = async (credit) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, "credits", currentUser.uid, "items", credit.id), { isPaid: !credit.isPaid });
            toast.success(credit.isPaid ? "Tahsil edilmedi olarak işaretlendi" : "Tahsil edildi olarak işaretlendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-green-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Alacaklarım</h1>
                    <p className="text-gray-500">Kimden ne kadar alacağınız olduğunu takip edin.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="success" className="flex items-center gap-2">
                    <FaPlus /> Yeni Alacak Ekle
                </Button>
            </Card>

            {credits.length > 0 && (
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Kişi adına göre ara..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 min-h-[44px]" />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 bg-white min-h-[44px]">
                            <option value="all">Tümü</option>
                            <option value="unpaid">Tahsil Edilmedi</option>
                            <option value="paid">Tahsil Edildi</option>
                        </select>
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
            ) : filteredCredits.length === 0 && credits.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaHandHoldingUsd className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz hiç alacak kaydınız bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">İlk alacağınızı ekleyerek takibe başlayın.</p>
                    <Button onClick={() => handleOpenModal()} variant="success" className="inline-flex items-center gap-2">
                        <FaPlus /> İlk Alacağı Ekle
                    </Button>
                </Card>
            ) : filteredCredits.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCredits.map(credit => (
                        <Card key={credit.id} className={`hover:shadow-lg transition duration-300 relative ${credit.isPaid ? 'opacity-75' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div><h3 className="font-bold text-lg text-gray-800">{credit.personName}</h3><p className="text-sm text-gray-500">{credit.date}</p></div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${credit.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {credit.isPaid ? 'TAHSİL EDİLDİ' : 'TAHSİL EDİLMEDİ'}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-gray-800 mb-6">{formatCurrency(credit.amount)}</div>
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button onClick={() => togglePaid(credit)} className={`flex items-center gap-1 text-sm min-h-[44px] font-medium ${credit.isPaid ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'}`}>
                                        {credit.isPaid ? <><FaTimes /> Tahsil Edilmedi</> : <><FaCheck /> Tahsil Edildi</>}
                                    </button>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(credit)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded"><FaEdit /></button>
                                        <button onClick={() => setDeleteId(credit.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded"><FaTrash /></button>
                                    </div>
                                </div>
                            </div>
                            <div className={`h-1 w-full ${credit.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Alacağı Düzenle' : 'Yeni Alacak Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Kişi / Kurum Adı" value={formData.personName} onChange={e => setFormData({ ...formData, personName: e.target.value })} required />
                    <Input label="Tutar (TL)" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" step="0.01" />
                    <Input label="Tarih" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="isPaidCredit" className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500" checked={formData.isPaid} onChange={e => setFormData({ ...formData, isPaid: e.target.checked })} />
                        <label htmlFor="isPaidCredit" className="text-sm font-medium text-gray-700">Bu alacak tahsil edildi mi?</label>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="success" fullWidth disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Emin misiniz?">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><FaTrash className="text-2xl" /></div>
                    <p className="text-gray-500 mb-6">Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={() => setDeleteId(null)} fullWidth>Vazgeç</Button>
                        <Button variant="danger" onClick={handleDelete} fullWidth>Sil</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Credits;

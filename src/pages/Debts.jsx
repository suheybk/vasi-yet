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
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaClipboardList, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { formatCurrency } from "../utils/formatters";
import { handleFirebaseError } from "../utils/errorHandler";

const Debts = () => {
    const { currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // all | paid | unpaid

    const [formData, setFormData] = useState({
        personName: "",
        amount: "",
        date: "",
        isPaid: false
    });

    useEffect(() => {
        if (!currentUser) return;

        const collectionRef = collection(db, "debts", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setDebts(items);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    // Filtered debts
    const filteredDebts = debts.filter(debt => {
        const matchesSearch = debt.personName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" ||
            (filterStatus === "paid" && debt.isPaid) ||
            (filterStatus === "unpaid" && !debt.isPaid);
        return matchesSearch && matchesFilter;
    });

    const handleOpenModal = (debt = null) => {
        if (debt) {
            setEditingId(debt.id);
            setFormData({
                personName: debt.personName,
                amount: debt.amount,
                date: debt.date,
                isPaid: debt.isPaid
            });
        } else {
            setEditingId(null);
            setFormData({
                personName: "",
                amount: "",
                date: new Date().toISOString().split('T')[0],
                isPaid: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        setSaving(true);
        try {
            const collectionRef = collection(db, "debts", currentUser.uid, "items");
            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
                toast.success("Borç başarıyla güncellendi ✓");
            } else {
                await addDoc(collectionRef, {
                    ...data,
                    createdAt: serverTimestamp()
                });
                toast.success("Borç başarıyla eklendi ✓");
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
            await deleteDoc(doc(db, "debts", currentUser.uid, "items", deleteId));
            setDeleteId(null);
            toast.success("Borç silindi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const togglePaid = async (debt) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, "debts", currentUser.uid, "items", debt.id), {
                isPaid: !debt.isPaid
            });
            toast.success(debt.isPaid ? "Ödenmedi olarak işaretlendi" : "Ödendi olarak işaretlendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-red-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Borçlarım</h1>
                    <p className="text-gray-500">Kime ne kadar borcunuz olduğunu takip edin.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="danger"
                    className="flex items-center gap-2"
                >
                    <FaPlus /> Yeni Borç Ekle
                </Button>
            </Card>

            {/* Search & Filter */}
            {debts.length > 0 && (
                <Card className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Kişi adına göre ara..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 min-h-[44px]"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 bg-white min-h-[44px]"
                        >
                            <option value="all">Tümü</option>
                            <option value="unpaid">Ödenmedi</option>
                            <option value="paid">Ödendi</option>
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
            ) : filteredDebts.length === 0 && debts.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-2 border-gray-200">
                    <FaClipboardList className="mx-auto text-5xl text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz hiç borç kaydınız bulunmuyor.</h3>
                    <p className="text-gray-500 mb-6">İlk borcunuzu ekleyerek takibe başlayın.</p>
                    <Button onClick={() => handleOpenModal()} variant="danger" className="inline-flex items-center gap-2">
                        <FaPlus /> İlk Borcu Ekle
                    </Button>
                </Card>
            ) : filteredDebts.length === 0 ? (
                <Card className="text-center py-10">
                    <p className="text-gray-500">Arama kriterlerine uygun kayıt bulunamadı.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDebts.map(debt => (
                        <Card key={debt.id} className={`hover:shadow-lg transition duration-300 relative ${debt.isPaid ? 'opacity-75' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{debt.personName}</h3>
                                        <p className="text-sm text-gray-500">{debt.date}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${debt.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {debt.isPaid ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-gray-800 mb-6">
                                    {formatCurrency(debt.amount)}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => togglePaid(debt)}
                                        className={`flex items-center gap-1 text-sm min-h-[44px] font-medium ${debt.isPaid ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'}`}
                                    >
                                        {debt.isPaid ? <><FaTimes /> Ödenmedi</> : <><FaCheck /> Ödendi</>}
                                    </button>

                                    <div className="flex gap-2">
                                        <button onClick={() => handleOpenModal(debt)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-blue-500 hover:bg-blue-50 rounded" title="Düzenle">
                                            <FaEdit />
                                        </button>
                                        <button onClick={() => setDeleteId(debt.id)} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-red-500 hover:bg-red-50 rounded" title="Sil">
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className={`h-1 w-full ${debt.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? 'Borcu Düzenle' : 'Yeni Borç Ekle'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Kişi / Kurum Adı" value={formData.personName} onChange={e => setFormData({ ...formData, personName: e.target.value })} required placeholder="Örn: Ahmet Yılmaz" />
                    <Input label="Tutar (TL)" type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} required min="0" step="0.01" placeholder="0.00" />
                    <Input label="Tarih" type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                    <div className="flex items-center gap-2 pt-2">
                        <input type="checkbox" id="isPaid" className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500" checked={formData.isPaid} onChange={e => setFormData({ ...formData, isPaid: e.target.checked })} />
                        <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Bu borç ödendi mi?</label>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button variant="secondary" onClick={handleCloseModal} fullWidth>İptal</Button>
                        <Button type="submit" variant="danger" fullWidth disabled={saving}>
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

export default Debts;

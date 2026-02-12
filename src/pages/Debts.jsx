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
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const Debts = () => {
    const { currentUser } = useAuth();
    const [debts, setDebts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

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

        try {
            const collectionRef = collection(db, "debts", currentUser.uid, "items");
            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
                updatedAt: serverTimestamp()
            };

            if (editingId) {
                await updateDoc(doc(collectionRef, editingId), data);
            } else {
                await addDoc(collectionRef, {
                    ...data,
                    createdAt: serverTimestamp()
                });
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving debt:", error);
            alert("Bir hata oluştu.");
        }
    };

    const handleDelete = async () => {
        if (!deleteId || !currentUser) return;
        try {
            await deleteDoc(doc(db, "debts", currentUser.uid, "items", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting debt:", error);
            alert("Silinirken bir hata oluştu.");
        }
    };

    const togglePaid = async (debt) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, "debts", currentUser.uid, "items", debt.id), {
                isPaid: !debt.isPaid
            });
        } catch (error) {
            console.error("Error updating status:", error);
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

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : debts.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-gray-300">
                    <p className="text-4xl mb-4">📝</p>
                    <p className="text-gray-500">Henüz kayıtlı bir borcunuz bulunmuyor.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {debts.map(debt => (
                        <Card key={debt.id} className={`hover:shadow-lg transition duration-300 relative ${debt.isPaid ? 'opacity-75' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{debt.personName}</h3>
                                        <p className="text-sm text-gray-500">{debt.date}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${debt.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {debt.isPaid ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="text-sm mr-1">₺</span>
                                    {debt.amount.toLocaleString('tr-TR')}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => togglePaid(debt)}
                                        className={`flex items-center gap-1 text-sm font-medium ${debt.isPaid ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'}`}
                                    >
                                        {debt.isPaid ? <><FaTimes /> Ödenmedi İşaretle</> : <><FaCheck /> Ödendi İşaretle</>}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(debt)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                            title="Düzenle"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(debt.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            title="Sil"
                                        >
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

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Borcu Düzenle' : 'Yeni Borç Ekle'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Kişi / Kurum Adı"
                        value={formData.personName}
                        onChange={e => setFormData({ ...formData, personName: e.target.value })}
                        required
                        placeholder="Örn: Ahmet Yılmaz"
                    />
                    <Input
                        label="Tutar (TL)"
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                    />
                    <Input
                        label="Tarih"
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isPaid"
                            className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                            checked={formData.isPaid}
                            onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                        />
                        <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Bu borç ödendi mi?</label>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={handleCloseModal}
                            fullWidth
                        >
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            fullWidth
                        >
                            Kaydet
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                title="Emin misiniz?"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaTrash className="text-2xl" />
                    </div>
                    <p className="text-gray-500 mb-6">Bu kaydı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
                    <div className="flex gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => setDeleteId(null)}
                            fullWidth
                        >
                            Vazgeç
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            fullWidth
                        >
                            Sil
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Debts;

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
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaHandHoldingUsd } from "react-icons/fa";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const Credits = () => {
    const { currentUser } = useAuth();
    const [credits, setCredits] = useState([]);
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

        const collectionRef = collection(db, "credits", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCredits(items);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const handleOpenModal = (credit = null) => {
        if (credit) {
            setEditingId(credit.id);
            setFormData({
                personName: credit.personName,
                amount: credit.amount,
                date: credit.date,
                isPaid: credit.isPaid
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
            const collectionRef = collection(db, "credits", currentUser.uid, "items");
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
            console.error("Error saving credit:", error);
            alert("Bir hata oluştu.");
        }
    };

    const handleDelete = async () => {
        if (!deleteId || !currentUser) return;
        try {
            await deleteDoc(doc(db, "credits", currentUser.uid, "items", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting credit:", error);
            alert("Silinirken bir hata oluştu.");
        }
    };

    const togglePaid = async (credit) => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, "credits", currentUser.uid, "items", credit.id), {
                isPaid: !credit.isPaid
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-green-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Alacaklarım</h1>
                    <p className="text-gray-500">Kimden ne kadar alacağınız olduğunu takip edin.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="success"
                    className="flex items-center gap-2"
                >
                    <FaPlus /> Yeni Alacak Ekle
                </Button>
            </Card>

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : credits.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-gray-300">
                    <FaHandHoldingUsd className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500">Henüz kayıtlı bir alacağınız bulunmuyor.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {credits.map(credit => (
                        <Card key={credit.id} className={`hover:shadow-lg transition duration-300 relative ${credit.isPaid ? 'opacity-75' : ''}`}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-800">{credit.personName}</h3>
                                        <p className="text-sm text-gray-500">{credit.date}</p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${credit.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {credit.isPaid ? 'ÖDENDİ' : 'ÖDENMEDİ'}
                                    </div>
                                </div>

                                <div className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                    <span className="text-sm mr-1">₺</span>
                                    {credit.amount.toLocaleString('tr-TR')}
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => togglePaid(credit)}
                                        className={`flex items-center gap-1 text-sm font-medium ${credit.isPaid ? 'text-gray-500 hover:text-gray-700' : 'text-green-600 hover:text-green-800'}`}
                                    >
                                        {credit.isPaid ? <><FaTimes /> Ödenmedi İşaretle</> : <><FaCheck /> Ödendi İşaretle</>}
                                    </button>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenModal(credit)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                            title="Düzenle"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(credit.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            title="Sil"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className={`h-1 w-full ${credit.isPaid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Alacağı Düzenle' : 'Yeni Alacak Ekle'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Kişi / Kurum Adı"
                        value={formData.personName}
                        onChange={e => setFormData({ ...formData, personName: e.target.value })}
                        required
                    />
                    <Input
                        label="Tutar (TL)"
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                        min="0"
                        step="0.01"
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
                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            checked={formData.isPaid}
                            onChange={e => setFormData({ ...formData, isPaid: e.target.checked })}
                        />
                        <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">Bu alacak tahsil edildi mi?</label>
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
                            variant="success"
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

export default Credits;

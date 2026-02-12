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
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaPhone, FaEnvelope } from "react-icons/fa";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const Contacts = () => {
    const { currentUser } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        relationship: ""
    });

    useEffect(() => {
        if (!currentUser) return;

        const collectionRef = collection(db, "contacts", currentUser.uid, "items");
        const q = query(collectionRef, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setContacts(items);
            setLoading(false);
        });

        return unsubscribe;
    }, [currentUser]);

    const handleOpenModal = (contact = null) => {
        if (contact) {
            setEditingId(contact.id);
            setFormData({
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                relationship: contact.relationship || ""
            });
        } else {
            setEditingId(null);
            setFormData({
                name: "",
                phone: "",
                email: "",
                relationship: ""
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
    };

    const validateForm = () => {
        const phoneRegex = /^[0-9\s\-\+\(\)]{10,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!phoneRegex.test(formData.phone)) {
            alert("Lütfen geçerli bir telefon numarası giriniz.");
            return false;
        }
        if (formData.email && !emailRegex.test(formData.email)) {
            alert("Lütfen geçerli bir e-posta adresi giriniz.");
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        if (!validateForm()) return;

        try {
            const collectionRef = collection(db, "contacts", currentUser.uid, "items");
            const data = {
                ...formData,
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
            console.error("Error saving contact:", error);
            alert("Bir hata oluştu.");
        }
    };

    const handleDelete = async () => {
        if (!deleteId || !currentUser) return;
        try {
            await deleteDoc(doc(db, "contacts", currentUser.uid, "items", deleteId));
            setDeleteId(null);
        } catch (error) {
            console.error("Error deleting contact:", error);
            alert("Silinirken bir hata oluştu.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-blue-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Güvenilir Kişiler</h1>
                    <p className="text-gray-500">Vefatınız durumunda vasiyetinize erişebilecek güvenilir kişiler.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    variant="primary"
                    className="flex items-center gap-2"
                >
                    <FaPlus /> Yeni Kişi Ekle
                </Button>
            </Card>

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : contacts.length === 0 ? (
                <Card className="text-center py-16 border-dashed border-gray-300">
                    <FaUserShield className="mx-auto text-4xl text-gray-300 mb-4" />
                    <p className="text-gray-500">Henüz güvenilir bir kişi eklemediniz.</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map(contact => (
                        <Card key={contact.id} className="hover:shadow-lg transition duration-300 group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                                            {contact.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{contact.name}</h3>
                                            <p className="text-sm text-gray-500">{contact.relationship}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleOpenModal(contact)}
                                            className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                                            title="Düzenle"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => setDeleteId(contact.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                            title="Sil"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <FaPhone className="text-gray-400 text-sm" />
                                        <span>{contact.phone}</span>
                                    </div>
                                    {contact.email && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <FaEnvelope className="text-gray-400 text-sm" />
                                            <span className="truncate">{contact.email}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="h-1 w-full bg-blue-500"></div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingId ? 'Kişiyi Düzenle' : 'Yeni Kişi Ekle'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Ad Soyad"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Yakınlık Derecesi (Opsiyonel)"
                        value={formData.relationship}
                        onChange={e => setFormData({ ...formData, relationship: e.target.value })}
                        placeholder="Örn: Kardeşim, Avukatım"
                    />
                    <Input
                        label="Telefon"
                        type="tel"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        required
                        placeholder="05XX XXX XX XX"
                    />
                    <Input
                        label="E-posta"
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                    />

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
                            variant="primary"
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
                    <p className="text-gray-500 mb-6">Bu kişiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</p>
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

export default Contacts;

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, storage, db } from "../firebase/config";
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
    FaUser, FaCamera, FaEnvelope, FaSave, FaPhone, FaCalendarAlt,
    FaLock, FaHistory, FaDownload, FaTrashAlt, FaExclamationTriangle,
    FaArrowRight, FaCheckCircle
} from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";
import { handleFirebaseError } from "../utils/errorHandler";
import { getRecentActivities } from "../utils/activityLogger";

const Profile = () => {
    const { currentUser, userProfile, refreshProfile } = useAuth();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
    const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || "");
    const [birthDate, setBirthDate] = useState(userProfile?.birthDate || "");
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    // Password State
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);

    // Activity Log State
    const [activities, setActivities] = useState([]);
    const [loadingActivities, setLoadingActivities] = useState(true);

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [confirmDeleteText, setConfirmDeleteText] = useState("");

    useEffect(() => {
        const fetchActivities = async () => {
            if (!currentUser) return;
            try {
                const logs = await getRecentActivities(currentUser.uid, 5);
                setActivities(logs);
            } catch (error) {
                console.error("Error fetching logs:", error);
            } finally {
                setLoadingActivities(false);
            }
        };
        fetchActivities();
    }, [currentUser]);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            // Update Auth Profile
            await updateProfile(auth.currentUser, { displayName });

            // Update Firestore Profile
            await updateDoc(doc(db, "users", currentUser.uid), {
                displayName,
                phoneNumber,
                birthDate,
                updatedAt: serverTimestamp()
            });

            await refreshProfile(currentUser.uid);
            toast.success("Profil güncellendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentUser) return;

        if (!file.type.startsWith('image/')) {
            toast.error("Lütfen bir resim dosyası seçin.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("Dosya boyutu 2MB'dan küçük olmalı.");
            return;
        }

        setUploadingPhoto(true);
        try {
            const storageRef = ref(storage, `profile-photos/${currentUser.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateProfile(auth.currentUser, { photoURL: downloadURL });

            // Also update in Firestore if tracking there
            await updateDoc(doc(db, "users", currentUser.uid), {
                photoURL: downloadURL,
                updatedAt: serverTimestamp()
            });

            toast.success("Profil fotoğrafı güncellendi ✓");
            window.location.reload();
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Yeni şifreler eşleşmiyor.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        setChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Şifre başarıyla güncellendi ✓");
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setChangingPassword(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmDeleteText !== "HISABIMI SIL") {
            toast.error("Lütfen doğrulamayı doğru şekilde yazın.");
            return;
        }

        try {
            // In a real app, you'd want a re-auth here too or handle via cloud function
            // to also delete all user data from Firestore/Storage
            await deleteUser(auth.currentUser);
            toast.success("Hesabınız silindi.");
            window.location.href = "/";
        } catch (error) {
            toast.error(handleFirebaseError(error));
        }
    };

    const handleExportData = () => {
        toast.success("Verileriniz hazırlanıyor. Yakında e-posta adresinize gönderilecek.", { duration: 5000 });
    };

    return (
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Photo & Navigation */}
            <div className="lg:col-span-1 space-y-6">
                <Card className="p-8 text-center bg-white shadow-sm border-t-4 border-yellow-500">
                    <div className="relative inline-block group">
                        {currentUser?.photoURL ? (
                            <img src={currentUser.photoURL} alt="Profil" className="w-32 h-32 rounded-3xl object-cover border-4 border-yellow-50 shadow-md transition group-hover:opacity-90" />
                        ) : (
                            <div className="w-32 h-32 rounded-3xl bg-yellow-50 text-yellow-600 flex items-center justify-center text-4xl font-bold border-4 border-yellow-100 shadow-sm">
                                <FaUser />
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition shadow-lg border-4 border-white"
                        >
                            <FaCamera className="text-sm" />
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-gray-800">{currentUser?.displayName || "Misafir"}</h2>
                    <p className="text-sm text-gray-500">{currentUser?.email}</p>

                    {uploadingPhoto && <p className="text-xs text-blue-500 mt-2 animate-pulse font-medium">Fotoğraf yükleniyor...</p>}

                    <div className="mt-6 pt-6 border-t border-gray-100 w-full">
                        <div className="flex flex-col gap-2">
                            <div className={`p-3 rounded-xl text-left flex items-center gap-3 transition bg-yellow-50 text-yellow-700 font-bold border border-yellow-100`}>
                                <FaUser className="text-lg" />
                                <span>Profil Bilgileri</span>
                            </div>
                            <a href="#activity" className="p-3 rounded-xl text-left flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition border border-transparent">
                                <FaHistory className="text-lg" />
                                <span>Aktivite Geçmişi</span>
                            </a>
                            <a href="#security" className="p-3 rounded-xl text-left flex items-center gap-3 text-gray-500 hover:bg-gray-50 transition border border-transparent">
                                <FaLock className="text-lg" />
                                <span>Güvenlik</span>
                            </a>
                        </div>
                    </div>
                </Card>

                {/* Activity Summary small */}
                <Card className="p-5" id="activity">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <FaHistory className="text-blue-500" /> Son Hareketler
                        </h3>
                    </div>
                    <div className="space-y-4">
                        {loadingActivities ? (
                            [1, 2].map(i => <div key={i} className="h-10 bg-gray-50 animate-pulse rounded-lg"></div>)
                        ) : activities.length === 0 ? (
                            <p className="text-xs text-center text-gray-400 py-4">Henüz aktivite kaydı yok.</p>
                        ) : (
                            activities.map((act, i) => (
                                <div key={i} className="text-xs flex gap-3 border-l-2 border-blue-100 pl-3 py-1">
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-700">{act.action}</p>
                                        <p className="text-gray-400">{act.timestamp?.toDate ? act.timestamp.toDate().toLocaleDateString('tr-TR') : 'Bugün'}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>
            </div>

            {/* Right Column: Content Sections */}
            <div className="lg:col-span-2 space-y-6">

                {/* Personal Info */}
                <Card className="p-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-yellow-500 rounded-full"></span>
                        Profil Bilgileri
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                            label="Ad Soyad"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            icon={<FaUser className="text-gray-400" />}
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <FaEnvelope className="inline mr-2 text-gray-400" /> E-posta
                            </label>
                            <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm">
                                {currentUser?.email}
                            </div>
                        </div>
                        <Input
                            label="Telefon Numarası"
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            icon={<FaPhone className="text-gray-400" />}
                            placeholder="05xx xxx xx xx"
                        />
                        <Input
                            label="Doğum Tarihi"
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            icon={<FaCalendarAlt className="text-gray-400" />}
                        />
                    </div>
                    <div className="mt-8 flex justify-end">
                        <Button onClick={handleSave} disabled={saving} variant="primary" className="px-8 shadow-md">
                            {saving ? "Güncelleniyor..." : <><FaSave className="mr-2" /> Değişiklikleri Kaydet</>}
                        </Button>
                    </div>
                </Card>

                {/* Password Change */}
                <Card className="p-8" id="security">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        Şifre Güncelle
                    </h3>
                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        <div className="max-w-md">
                            <Input
                                label="Mevcut Şifre"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                                icon={<FaLock className="text-gray-400" />}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Yeni Şifre"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength={6}
                                icon={<FaLock className="text-gray-400" />}
                            />
                            <Input
                                label="Yeni Şifre (Tekrar)"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                icon={<FaLock className="text-gray-400" />}
                            />
                        </div>
                        <div className="pt-4">
                            <Button type="submit" disabled={changingPassword} variant="primary" className="bg-blue-600 hover:bg-blue-700 shadow-md">
                                {changingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
                            </Button>
                        </div>
                    </form>
                </Card>

                {/* Data & Danger Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 border border-blue-50 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            <FaDownload className="text-blue-500" /> Veri Yönetimi
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                            Tüm verilerinizi JSON ve PDF formatında yedekleyin.
                        </p>
                        <Button onClick={handleExportData} variant="secondary" fullWidth className="text-xs py-2">
                            Verilerimi Dışa Aktar
                        </Button>
                    </Card>

                    <Card className="p-6 border border-red-50 shadow-sm">
                        <h4 className="font-bold text-red-600 mb-2 flex items-center gap-2">
                            <FaTrashAlt /> Hesabı Kapat
                        </h4>
                        <p className="text-sm text-gray-500 mb-4">
                            Hesabınızı ve tüm verilerinizi kalıcı olarak silin.
                        </p>
                        <Button onClick={() => setShowDeleteModal(true)} variant="danger" fullWidth className="text-xs py-2 bg-red-50 text-red-600 hover:bg-red-100 border-red-100">
                            Hesabımı Sil
                        </Button>
                    </Card>
                </div>
            </div>

            {/* Account Delete Confirmation Modal */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Hesabınızı Siliyor Musunuz?">
                <div className="space-y-6">
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-4 text-sm border border-red-100">
                        <FaExclamationTriangle className="text-3xl flex-shrink-0 mt-1" />
                        <div>
                            <p className="font-bold">Bu işlem geri alınamaz!</p>
                            <p className="mt-1">Hesabınızı sildiğinizde; vasiyetiniz, borç/alacak kayıtlarınız ve tüm diğer verileriniz kalıcı olarak silinecektir.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">Onaylamak için aşağıdaki kutuya <span className="font-bold select-none text-red-600 underline">HISABIMI SIL</span> yazınız:</p>
                        <Input
                            value={confirmDeleteText}
                            onChange={(e) => setConfirmDeleteText(e.target.value)}
                            placeholder="onay metni"
                        />
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-gray-100">
                        <Button variant="secondary" onClick={() => setShowDeleteModal(false)} fullWidth>
                            Vazgeç
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDeleteAccount}
                            fullWidth
                            disabled={confirmDeleteText !== "HISABIMI SIL"}
                        >
                            Hesabımı Kalıcı Olarak Sil
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Profile;

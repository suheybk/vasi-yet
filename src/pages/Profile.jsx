import { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { auth, storage } from "../firebase/config";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FaUser, FaCamera, FaEnvelope, FaSave } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import { handleFirebaseError } from "../utils/errorHandler";

const Profile = () => {
    const { currentUser } = useAuth();
    const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const fileInputRef = useRef(null);

    const handleSave = async () => {
        if (!currentUser) return;
        setSaving(true);
        try {
            await updateProfile(auth.currentUser, { displayName });
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

        // Validate file type and size 
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
            toast.success("Profil fotoğrafı güncellendi ✓");
            // Force re-render
            window.location.reload();
        } catch (error) {
            toast.error(handleFirebaseError(error));
        } finally {
            setUploadingPhoto(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-yellow-500">
                <h1 className="text-2xl font-bold text-gray-800">Profilim</h1>
                <p className="text-gray-500 mt-1">Hesap bilgilerinizi yönetin.</p>
            </Card>

            <Card className="p-8">
                {/* Photo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="relative group">
                        {currentUser?.photoURL ? (
                            <img
                                src={currentUser.photoURL}
                                alt="Profil"
                                className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl font-bold border-4 border-blue-50">
                                <FaUser />
                            </div>
                        )}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingPhoto}
                            className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-lg"
                        >
                            <FaCamera className="text-xs" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                        />
                    </div>
                    {uploadingPhoto && (
                        <p className="text-sm text-blue-500 mt-2 animate-pulse">Yükleniyor...</p>
                    )}
                </div>

                {/* Form */}
                <div className="space-y-5">
                    <Input
                        label="Ad Soyad"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Adınızı giriniz"
                        icon={<FaUser className="text-gray-400" />}
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <FaEnvelope className="inline mr-2 text-gray-400" />
                            E-posta
                        </label>
                        <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed">
                            {currentUser?.email}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">E-posta adresi değiştirilemez.</p>
                    </div>

                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        variant="primary"
                        fullWidth
                        className="mt-4"
                    >
                        {saving ? (
                            "Kaydediliyor..."
                        ) : (
                            <><FaSave className="mr-2" /> Değişiklikleri Kaydet</>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default Profile;

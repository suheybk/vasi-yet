import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "firebase/firestore";
import { FaSave, FaPenFancy, FaClock, FaCheckCircle } from "react-icons/fa";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const Testament = () => {
    const { currentUser } = useAuth();
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const autoSaveTimerRef = useRef(null);
    const lastNoteRef = useRef("");

    useEffect(() => {
        if (!currentUser) return;

        const fetchNote = async () => {
            try {
                // Using 'note' as the document ID within the 'items' subcollection
                // to maintain consistency with Dashboard checking 'items' size > 0
                const docRef = doc(db, "testaments", currentUser.uid, "items", "note");
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNote(data.text || "");
                    lastNoteRef.current = data.text || "";
                    if (data.updatedAt) {
                        setLastSaved(data.updatedAt.toDate());
                    }
                }
            } catch (error) {
                console.error("Error fetching testament:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNote();
    }, [currentUser]);

    // Auto-save logic
    useEffect(() => {
        if (!currentUser || loading) return;

        // Clear existing timer
        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        // Only set timer if content changed and differs from last saved
        if (note !== lastNoteRef.current) {
            autoSaveTimerRef.current = setTimeout(() => {
                handleSave(true); // Auto-save
            }, 30000); // 30 seconds
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [note, currentUser, loading]);

    const handleSave = async (isAuto = false) => {
        if (!currentUser) return;

        setSaving(true);
        try {
            const docRef = doc(db, "testaments", currentUser.uid, "items", "note");
            const now = new Date();

            await setDoc(docRef, {
                text: note,
                updatedAt: serverTimestamp(),
                userId: currentUser.uid
            });

            lastNoteRef.current = note;
            setLastSaved(now);

            if (!isAuto) {
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
            }
        } catch (error) {
            console.error("Error saving testament:", error);
            if (!isAuto) alert("Kaydedilirken bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-purple-500 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FaPenFancy /> Vasiyetim
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Vefatınız durumunda güvenilir kişilerinize iletilmesini istediğiniz vasiyetinizi buraya yazabilirsiniz.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {lastSaved && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaClock /> Son kayıt: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        onClick={() => handleSave(false)}
                        disabled={saving || loading}
                        variant={showSuccess ? "success" : "primary"}
                        className={!showSuccess ? "bg-purple-600 hover:bg-purple-700" : ""}
                    >
                        {saving ? (
                            <>Kaydediliyor...</>
                        ) : showSuccess ? (
                            <><FaCheckCircle className="mr-2" /> Kaydedildi</>
                        ) : (
                            <><FaSave className="mr-2" /> Kaydet</>
                        )}
                    </Button>
                </div>
            </Card>

            {loading ? (
                <Card className="p-8 text-center h-96 flex items-center justify-center">
                    <p className="text-gray-400">Yükleniyor...</p>
                </Card>
            ) : (
                <Card className="overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-indigo-500"></div>

                    <textarea
                        className="w-full min-h-[500px] p-8 text-lg leading-relaxed text-gray-800 focus:outline-none resize-y font-serif placeholder-gray-300"
                        placeholder="Sevgili ailem ve dostlarım..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        spellCheck="false"
                    ></textarea>

                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center text-sm text-gray-500">
                        <span>{note.length} karakter</span>
                        <span>{note.trim() === "" ? "Boş" : "Düzenleniyor"}</span>
                    </div>
                </Card>
            )}

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-800 text-sm">
                <strong>Bilgi:</strong> Bu metin, sadece siz ve (ileride eklenecek) yetki verdiğiniz güvenilir kişiler tarafından görüntülenebilecektir.
            </div>
        </div>
    );
};

export default Testament;

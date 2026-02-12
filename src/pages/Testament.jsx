import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { FaSave, FaPenFancy, FaClock, FaCheckCircle } from "react-icons/fa";
import toast from "react-hot-toast";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { handleFirebaseError } from "../utils/errorHandler";

const Testament = () => {
    const { currentUser } = useAuth();
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const autoSaveTimerRef = useRef(null);
    const lastNoteRef = useRef("");

    useEffect(() => {
        if (!currentUser) return;
        const fetchNote = async () => {
            try {
                const docRef = doc(db, "testaments", currentUser.uid, "items", "note");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setNote(data.text || "");
                    lastNoteRef.current = data.text || "";
                    if (data.updatedAt) setLastSaved(data.updatedAt.toDate());
                }
            } catch (error) {
                toast.error(handleFirebaseError(error));
            } finally {
                setLoading(false);
            }
        };
        fetchNote();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || loading) return;
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        if (note !== lastNoteRef.current) {
            autoSaveTimerRef.current = setTimeout(() => handleSave(true), 30000);
        }
        return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
    }, [note, currentUser, loading]);

    const handleSave = async (isAuto = false) => {
        if (!currentUser) return;
        setSaving(true);
        try {
            const docRef = doc(db, "testaments", currentUser.uid, "items", "note");
            const now = new Date();
            await setDoc(docRef, { text: note, updatedAt: serverTimestamp(), userId: currentUser.uid });
            lastNoteRef.current = note;
            setLastSaved(now);
            if (!isAuto) toast.success("Vasiyet kaydedildi ✓");
        } catch (error) {
            if (!isAuto) toast.error(handleFirebaseError(error));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card className="p-6 border-l-4 border-purple-500 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FaPenFancy /> Vasiyetim</h1>
                    <p className="text-gray-500 mt-1">Vefatınız durumunda güvenilir kişilerinize iletilmesini istediğiniz vasiyetinizi buraya yazabilirsiniz.</p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    {lastSaved && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            <FaClock /> Son kayıt: {lastSaved.toLocaleTimeString()}
                        </span>
                    )}
                    <Button onClick={() => handleSave(false)} disabled={saving || loading} variant="primary" className="bg-purple-600 hover:bg-purple-700">
                        {saving ? (
                            <>Kaydediliyor...</>
                        ) : (
                            <><FaSave className="mr-2" /> Kaydet</>
                        )}
                    </Button>
                </div>
            </Card>

            {loading ? (
                <Card className="p-8 animate-pulse h-96 flex items-center justify-center">
                    <div className="space-y-4 w-full">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
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

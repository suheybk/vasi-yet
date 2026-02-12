import { db } from "../firebase/config";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";

/**
 * Log a user activity to Firestore
 */
export async function logActivity(userId, action, details = "") {
    try {
        await addDoc(collection(db, "activity_log", userId, "events"), {
            action,
            details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Activity log error:", error);
    }
}

/**
 * Fetch the last N activity events for a user
 */
export async function getRecentActivities(userId, count = 10) {
    try {
        const q = query(
            collection(db, "activity_log", userId, "events"),
            orderBy("timestamp", "desc"),
            limit(count)
        );
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (error) {
        console.error("Fetch activities error:", error);
        return [];
    }
}

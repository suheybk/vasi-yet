/**
 * Maps Firebase error codes to user-friendly Turkish messages.
 * @param {object} error - The error object from Firebase
 * @returns {string} A user-friendly error message
 */
export const handleFirebaseError = (error) => {
    console.error("Firebase Error:", error);

    const code = error.code || error.message;

    switch (code) {
        case 'permission-denied':
            return 'Bu işlem için yetkiniz yok.';
        case 'unavailable':
            return 'Servis şu anda kullanılamıyor, lütfen daha sonra tekrar deneyin.';
        case 'not-found':
            return 'İstenen kayıt bulunamadı.';
        case 'already-exists':
            return 'Bu kayıt zaten mevcut.';
        case 'resource-exhausted':
            return 'Kota aşıldı, lütfen daha sonra tekrar deneyin.';
        case 'failed-precondition':
            return 'İşlem ön koşulları sağlanamadı.';
        case 'aborted':
            return 'İşlem iptal edildi.';
        case 'out-of-range':
            return 'Geçersiz aralık.';
        case 'unauthenticated':
            return 'Oturumunuzun süresi dolmuş olabilir, lütfen tekrar giriş yapın.';
        case 'auth/email-already-in-use':
            return 'Bu e-posta adresi zaten kullanımda.';
        case 'auth/wrong-password':
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
            return 'E-posta veya şifre hatalı.';
        case 'auth/weak-password':
            return 'Şifre çok zayıf.';
        case 'auth/network-request-failed':
        case 'network-request-failed':
            return 'İnternet bağlantınızı kontrol edin.';
        case 'storage/unauthorized':
            return 'Dosya yükleme izniniz yok.';
        case 'storage/canceled':
            return 'Dosya yükleme iptal edildi.';
        case 'storage/unknown':
            return 'Dosya yüklenirken bilinmeyen bir hata oluştu.';
        default:
            return 'Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.';
    }
};

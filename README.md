# Wasiyet Web Projesi

Wasiyet, kullanıcıların finansal durumlarını (borç, alacak), vasiyetlerini ve güvenilir kişilerini yönetebilecekleri güvenli bir web uygulamasıdır.

## Özellikler

- **Kimlik Doğrulama**: Firebase Authentication ile güvenli giriş/kayıt.
- **Dashboard**: Finansal durum ve vasiyet özeti.
- **Borçlar & Alacaklar**: Borç ve alacak takibi (ekle, düzenle, sil, ödendi işaretle).
- **Vasiyet**: Otomatik kaydedilen güvenli vasiyet notu.
- **Güvenilir Kişiler**: Acil durumda ulaşılacak kişi listesi.
- **Güvenlik**: Sadece veri sahibi kullanıcı kendi verilerine erişebilir (Firestore Security Rules).
- **Responsive Tasarım**: Mobil uyumlu modern arayüz.

## Kurulum

Projeyi yerel ortamda çalıştırmak için:

1. Depoyu klonlayın.
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. `.env` dosyasını oluşturun (örnek için `.env.example` dosyasına bakın) ve Firebase yapılandırma bilgilerinizi girin.
4. Uygulamayı başlatın:
   ```bash
   npm run dev
   ```

## Dağıtım (Deployment)

Bu proje Firebase Hosting üzerinde çalışacak şekilde yapılandırılmıştır.

### Gereksinimler

- Firebase CLI yüklü olmalıdır: `npm install -g firebase-tools`
- Firebase hesabına giriş yapılmış olmalıdır: `firebase login`

### Adımlar

1. Projeyi derleyin:
   ```bash
   npm run build
   ```
   Bu işlem `dist` klasörüne optimize edilmiş üretim dosyalarını oluşturur.

2. Firebase'i başlatın (Eğer daha önce yapılmadıysa):
   ```bash
   firebase init hosting
   ```
   - *Public directory* olarak `dist` seçin.
   - *Configure as a single-page app* sorusuna `Yes` deyin.

3. Dağıtımı yapın:
   ```bash
   npm run deploy
   ```
   veya manuel olarak:
   ```bash
   firebase deploy
   ```

## Teknoloji Yığını

- **Frontend**: React, Vite
- **Dil**: JavaScript (ES6+)
- **Stil**: Tailwind CSS
- **Backend / Veritabanı**: Firebase (Auth, Firestore, Hosting)
- **Yönlendirme**: React Router v7
- **İkonlar**: React Icons

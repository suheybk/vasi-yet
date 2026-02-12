import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "../firebase/config";
import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";

const NAVY = [20, 33, 61];
const GOLD = [183, 149, 76];
const DARK = [44, 44, 44];
const GRAY = [120, 120, 120];
const LIGHT_BG = [245, 245, 250];

const formatCurrencyPDF = (val) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(val || 0);
};

const formatDatePDF = (dateStr) => {
    if (!dateStr) return "-";
    try { return new Date(dateStr).toLocaleDateString('tr-TR'); } catch { return dateStr; }
};

async function fetchCollection(userId, collectionName) {
    try {
        const q = query(collection(db, collectionName, userId, "items"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
}

async function fetchDocument(userId, collectionName) {
    try {
        const snap = await getDoc(doc(db, collectionName, userId));
        return snap.exists() ? snap.data() : null;
    } catch { return null; }
}

function addPageNumber(pdf, pageNum) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(...GRAY);
    pdf.text(`Sayfa ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: "center" });
    pdf.text("Bu belge Vasiyetimdir.app ile oluşturulmuştur", pageWidth / 2, pageHeight - 5, { align: "center" });
}

function addSectionHeader(pdf, title, y) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(...NAVY);
    pdf.rect(15, y, pageWidth - 30, 12, "F");
    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    pdf.text(title, 20, y + 8.5);
    return y + 18;
}

function addSubHeader(pdf, title, y) {
    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(...GOLD);
    pdf.text(title, 20, y);
    pdf.setDrawColor(...GOLD);
    pdf.line(20, y + 1.5, 80, y + 1.5);
    return y + 7;
}

function addKeyValue(pdf, key, value, y, x = 20) {
    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...GRAY);
    pdf.text(key + ":", x, y);
    pdf.setTextColor(...DARK);
    pdf.text(String(value || "-"), x + 45, y);
    return y + 6;
}

function addWrappedText(pdf, text, x, y, maxWidth) {
    if (!text) return y;
    pdf.setFont("Roboto", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(...DARK);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + lines.length * 5 + 2;
}

function checkPageBreak(pdf, y, needed, pageNum) {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + needed > pageHeight - 20) {
        addPageNumber(pdf, pageNum.current);
        pdf.addPage();
        pageNum.current++;
        return 25;
    }
    return y;
}

// Function to load external font
async function loadRobotoFont(pdf) {
    try {
        const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();
        const base64String = btoa(
            new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );
        pdf.addFileToVFS("Roboto-Regular.ttf", base64String);
        pdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        pdf.setFont("Roboto");
    } catch (error) {
        console.warn("Could not load Roboto font, falling back to Helvetica. Turkish characters might be garbled.", error);
    }
}

export async function generatePDF(currentUser, userProfile) {
    const pdf = new jsPDF("p", "mm", "a4");

    // Load font before doing anything
    await loadRobotoFont(pdf);

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageNum = { current: 1 };
    const contentWidth = pageWidth - 40;

    // Fetch all data
    const [debts, credits, assets, trusts, contacts, forgivenessItems,
        charityItems, projects, guardianshipItems] = await Promise.all([
            fetchCollection(currentUser.uid, "debts"),
            fetchCollection(currentUser.uid, "credits"),
            fetchCollection(currentUser.uid, "assets"),
            fetchCollection(currentUser.uid, "trusts"),
            fetchCollection(currentUser.uid, "contacts"),
            fetchCollection(currentUser.uid, "forgiveness_requests"),
            fetchCollection(currentUser.uid, "charity_wills"),
            fetchCollection(currentUser.uid, "projects"),
            fetchCollection(currentUser.uid, "guardianship"),
        ]);

    const [testamentSnap, religiousObl, funeralPlan] = await Promise.all([
        getDoc(doc(db, "testaments", currentUser.uid, "items", "note")),
        fetchDocument(currentUser.uid, "religious_obligations"),
        fetchDocument(currentUser.uid, "funeral_plan"),
    ]);

    const testamentText = testamentSnap.exists() ? testamentSnap.data()?.text : null;

    // ═══════════════════════════════════════════
    // PAGE 1: Cover
    // ═══════════════════════════════════════════
    pdf.setFillColor(...NAVY);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    pdf.setDrawColor(...GOLD);
    pdf.setLineWidth(1);
    pdf.rect(15, 15, pageWidth - 30, pageHeight - 30, "S");
    pdf.rect(18, 18, pageWidth - 36, pageHeight - 36, "S");

    const cx = pageWidth / 2;
    pdf.setLineWidth(0.5);
    pdf.line(cx - 40, 60, cx + 40, 60);
    pdf.line(cx - 30, 63, cx + 30, 63);

    pdf.setFontSize(36);
    pdf.setTextColor(...GOLD);
    pdf.text("VASİYETİMDİR", cx, 85, { align: "center" });

    pdf.setFontSize(12);
    pdf.text("Dijital Vasiyet Belgesi", cx, 97, { align: "center" });

    pdf.line(cx - 40, 105, cx + 40, 105);
    pdf.line(cx - 30, 108, cx + 30, 108);

    pdf.setFontSize(14);
    pdf.setTextColor(255, 255, 255);
    const userName = userProfile?.displayName || currentUser.displayName || currentUser.email;
    pdf.text(userName, cx, 135, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(180, 180, 200);
    pdf.text(currentUser.email, cx, 145, { align: "center" });

    pdf.setFontSize(11);
    pdf.setTextColor(...GOLD);
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    pdf.text("Oluşturulma Tarihi: " + dateStr, cx, 170, { align: "center" });

    pdf.setDrawColor(...GOLD);
    pdf.line(cx - 40, pageHeight - 50, cx + 40, pageHeight - 50);
    pdf.setFontSize(9);
    pdf.setTextColor(180, 180, 200);
    pdf.text("vasiyetimdir.app", cx, pageHeight - 40, { align: "center" });

    // ═══════════════════════════════════════════
    // PAGE 2: Vasiyet Metni
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    let y = 25;
    y = addSectionHeader(pdf, "VASİYET METNİ", y);
    y += 5;
    if (testamentText) {
        y = addWrappedText(pdf, testamentText, 20, y, contentWidth);
    } else {
        pdf.setFontSize(10);
        pdf.setTextColor(...GRAY);
        pdf.text("Henüz vasiyet metni yazılmamıştır.", 20, y);
        y += 8;
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 3: Borçlar ve Alacaklar
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "BORÇLAR VE ALACAKLAR", y);
    y += 3;

    y = addSubHeader(pdf, "Borçlarım", y);
    if (debts.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Alacaklı", "Tutar", "Son Tarih", "Durum"]],
            body: debts.map(d => [
                d.creditorName || "-",
                formatCurrencyPDF(d.amount),
                formatDatePDF(d.dueDate),
                d.isPaid ? "Ödendi" : "Ödenmedi"
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
        y = pdf.lastAutoTable.finalY + 5;
        const totalDebt = debts.filter(d => !d.isPaid).reduce((s, d) => s + (d.amount || 0), 0);
        pdf.setFontSize(10);
        pdf.setTextColor(...NAVY);
        pdf.text("Toplam Kalan Borç: " + formatCurrencyPDF(totalDebt), 20, y);
        y += 10;
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Borç kaydı bulunmuyor.", 20, y); y += 8;
    }

    y = checkPageBreak(pdf, y, 30, pageNum);
    y = addSubHeader(pdf, "Alacaklarım", y);
    if (credits.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Borçlu", "Tutar", "Son Tarih", "Durum"]],
            body: credits.map(c => [
                c.debtorName || "-",
                formatCurrencyPDF(c.amount),
                formatDatePDF(c.dueDate),
                c.isPaid ? "Tahsil Edildi" : "Tahsil Edilmedi"
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
        y = pdf.lastAutoTable.finalY + 5;
        const totalCredit = credits.filter(c => !c.isPaid).reduce((s, c) => s + (c.amount || 0), 0);
        pdf.setFontSize(10); pdf.setTextColor(...NAVY);
        pdf.text("Toplam Kalan Alacak: " + formatCurrencyPDF(totalCredit), 20, y);
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Alacak kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 4: Mal Varlığı
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "MAL VARLIĞI", y);
    y += 3;
    const assetTypes = { gayrimenkul: "Gayrimenkul", arac: "Araç", altin: "Altın", nakit: "Nakit", hisse: "Hisse/Fon", banka: "Banka", diger: "Diğer" };
    if (assets.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Tür", "Açıklama", "Tahmini Değer"]],
            body: assets.map(a => [
                assetTypes[a.type] || a.type || "-",
                a.description || "-",
                formatCurrencyPDF(a.value)
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
        y = pdf.lastAutoTable.finalY + 5;
        const totalAssets = assets.reduce((s, a) => s + (a.value || 0), 0);
        pdf.setFontSize(11); pdf.setTextColor(...NAVY);
        pdf.text("Toplam Varlık Değeri: " + formatCurrencyPDF(totalAssets), 20, y);
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Mal varlığı kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 5: Emanetler
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "EMANETLER", y);
    y += 3;
    const givenTrusts = trusts.filter(t => t.type === "given");
    const receivedTrusts = trusts.filter(t => t.type === "received");

    y = addSubHeader(pdf, "Verdiğim Emanetler", y);
    if (givenTrusts.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Kişi", "Emanet", "Tarih"]],
            body: givenTrusts.map(t => [t.personName || "-", t.itemDescription || "-", formatDatePDF(t.date)]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
        y = pdf.lastAutoTable.finalY + 8;
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Verilen emanet kaydı yok.", 20, y); y += 8;
    }

    y = addSubHeader(pdf, "Aldığım Emanetler", y);
    if (receivedTrusts.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Kişi", "Emanet", "Tarih"]],
            body: receivedTrusts.map(t => [t.personName || "-", t.itemDescription || "-", formatDatePDF(t.date)]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Alınan emanet kaydı yok.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 6: Dini Yükümlülükler
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "DİNİ YÜKÜMLÜLÜKLER", y);
    y += 5;
    if (religiousObl) {
        const p = religiousObl.prayers || {};
        y = addSubHeader(pdf, "Kaza Namazları", y);
        const prayerLabels = { sabah: "Sabah", ogle: "Öğle", ikindi: "Ikindi", aksam: "Akşam", yatsi: "Yatsı" };
        Object.entries(prayerLabels).forEach(([key, label]) => {
            y = addKeyValue(pdf, label, p[key] || 0, y);
        });
        const totalP = Object.values(p).reduce((s, v) => s + (v || 0), 0);
        pdf.setFontSize(10); pdf.setTextColor(...NAVY);
        pdf.text("Toplam Kaza: " + totalP, 20, y); y += 10;

        y = addSubHeader(pdf, "Kaza Oruçları", y);
        y = addKeyValue(pdf, "Tutulmamış Oruç", religiousObl.fasting?.count || 0, y);
        y += 5;

        y = addSubHeader(pdf, "Fidye, Zekat & Kurban", y);
        y = addKeyValue(pdf, "Fidye Borcu", formatCurrencyPDF(religiousObl.financial?.fidye), y);
        y = addKeyValue(pdf, "Zekat Borcu", formatCurrencyPDF(religiousObl.financial?.zekat), y);
        y = addKeyValue(pdf, "Kurban Borcu", (religiousObl.financial?.kurban || 0) + " adet", y);
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Dini yükümlülük kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 7: Helallik Talepleri
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "HELALLİK TALEPLERİ", y);
    y += 3;
    const relLabels = { aile: "Aile", akraba: "Akraba", arkadas: "Arkadaş", komsu: "Komşu", is_arkadasi: "İş Arkadaşı", diger: "Diğer" };
    if (forgivenessItems.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Ad Soyad", "İlişki", "Telefon", "E-posta", "Not"]],
            body: forgivenessItems.map(f => [
                f.fullName || "-",
                relLabels[f.relationship] || f.relationship || "-",
                f.phone || "-",
                f.email || "-",
                (f.note || "-").substring(0, 40)
            ]),
            styles: { fontSize: 8, cellPadding: 2.5, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
            columnStyles: { 4: { cellWidth: 35 } },
        });
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Helallik kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 8: Hayır Vasiyetleri
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "HAYIR VASIYETLERİ", y);
    y += 3;
    const charityLabels = { cami: "Cami/Mescid", fakir_yetim: "Fakir/Yetim", kuran: "Kuran Dağıtımı", kurban: "Kurban", su_kuyusu: "Su Kuyusu", burs: "Burs", diger: "Diğer" };
    if (charityItems.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Hayır Türü", "Açıklama", "Tutar", "Sorumlu"]],
            body: charityItems.map(c => [
                charityLabels[c.type] || c.type || "-",
                c.description || "-",
                formatCurrencyPDF(c.amount),
                c.responsiblePerson || "-"
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
        y = pdf.lastAutoTable.finalY + 5;
        const totalCharity = charityItems.reduce((s, c) => s + (c.amount || 0), 0);
        pdf.setFontSize(10); pdf.setTextColor(...NAVY);
        pdf.text("Toplam Hayır: " + formatCurrencyPDF(totalCharity), 20, y);
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Hayır vasiyeti bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 9: Güvenilir Kişiler
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "GÜVENİLİR KİŞİLER", y);
    y += 3;
    if (contacts.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Ad Soyad", "İlişki", "Telefon", "E-posta"]],
            body: contacts.map(c => [
                c.fullName || c.name || "-",
                c.relationship || "-",
                c.phone || "-",
                c.email || "-"
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Güvenilir kişi kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 10: Vasi Atama & Cenaze Planı
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "VASİ ATAMA", y);
    y += 3;
    if (guardianshipItems.length > 0) {
        guardianshipItems.forEach(item => {
            y = checkPageBreak(pdf, y, 40, pageNum);
            pdf.setFontSize(11); pdf.setTextColor(...DARK);
            pdf.text("Çocuk: " + (item.childName || "-"), 20, y); y += 6;
            if (item.birthDate) { y = addKeyValue(pdf, "Doğum Tarihi", formatDatePDF(item.birthDate), y); }
            if (item.primaryGuardian?.name) {
                y = addKeyValue(pdf, "1. Vasi (Asil)", item.primaryGuardian.name + " - " + (item.primaryGuardian.phone || ""), y);
            }
            if (item.secondaryGuardian?.name) {
                y = addKeyValue(pdf, "2. Vasi (Yedek)", item.secondaryGuardian.name + " - " + (item.secondaryGuardian.phone || ""), y);
            }
            if (item.instructions) {
                pdf.setFontSize(9); pdf.setTextColor(...GRAY);
                pdf.text("Talimat: " + item.instructions.substring(0, 80), 20, y); y += 6;
            }
            y += 4;
        });
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Vasi kaydı bulunmuyor.", 20, y); y += 8;
    }

    y = checkPageBreak(pdf, y, 50, pageNum);
    y += 5;
    y = addSectionHeader(pdf, "CENAZE PLANI", y);
    y += 5;
    if (funeralPlan) {
        const b = funeralPlan.burial || {};
        const pr = funeralPlan.prayer || {};
        const c = funeralPlan.ceremony || {};

        y = addSubHeader(pdf, "Defin İstekleri", y);
        if (b.location) y = addKeyValue(pdf, "Yer", b.location, y);
        if (b.graveyard) y = addKeyValue(pdf, "Mezar Yeri", b.graveyard, y);
        if (b.shroudWish) { y = addKeyValue(pdf, "Kefen İstegi", b.shroudWish.substring(0, 60), y); }
        y += 3;

        y = addSubHeader(pdf, "Cenaze Namazı", y);
        if (pr.mosque) y = addKeyValue(pdf, "Cami", pr.mosque, y);
        if (pr.imam) y = addKeyValue(pdf, "İmam", pr.imam, y);
        if (pr.specialRequest) y = addKeyValue(pdf, "Özel İstek", pr.specialRequest.substring(0, 60), y);
        y += 3;

        y = addSubHeader(pdf, "Tören Detayları", y);
        y = addKeyValue(pdf, "Mevlit", c.mevlit ? "Evet" : "Hayır", y);
        y = addKeyValue(pdf, "Yemek", c.meal ? "Evet" : "Hayır", y);
        if (c.otherWishes) y = addKeyValue(pdf, "Diğer", c.otherWishes.substring(0, 60), y);
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Cenaze planı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // ═══════════════════════════════════════════
    // PAGE 11: İş ve Projeler
    // ═══════════════════════════════════════════
    pdf.addPage();
    pageNum.current++;
    y = 25;
    y = addSectionHeader(pdf, "İŞ VE PROJELER", y);
    y += 3;
    const statusLabels = { devam: "Devam Ediyor", yarim: "Yarım Kaldı", tamamlanacak: "Tamamlanacak" };
    if (projects.length > 0) {
        autoTable(pdf, {
            startY: y,
            head: [["Proje Adı", "Durum", "Devredilebilir", "Devredilecek Kişi"]],
            body: projects.map(p => [
                p.name || "-",
                statusLabels[p.status] || p.status || "-",
                p.transferable ? "Evet" : "Hayır",
                p.transferPerson || "-"
            ]),
            styles: { fontSize: 9, cellPadding: 3, font: "Roboto" },
            headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: LIGHT_BG },
            margin: { left: 20, right: 20 },
        });
    } else {
        pdf.setFontSize(9); pdf.setTextColor(...GRAY); pdf.text("Proje kaydı bulunmuyor.", 20, y);
    }
    addPageNumber(pdf, pageNum.current);

    // Save
    const fileName = `Vasiyetimdir_${userName.replace(/\s+/g, "_")}_${now.toISOString().slice(0, 10)}.pdf`;
    pdf.save(fileName);
    return fileName;
}

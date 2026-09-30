import { InvoiceDocument } from '../types';

export interface InvoiceEmailMetadata {
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail: string;
  receivedDate: string;
  subject: string;
  fileName: string;
  fileSize: string;
  serviceType: string;
  summaryText: string;
  emailBodyHtml: {
    greeting: string;
    intro: string;
    detailsList: { label: string; value: string }[];
    attachmentNotice: string;
    signOff: string;
  };
}

export function getInvoiceEmailMetadata(invoice: InvoiceDocument): InvoiceEmailMetadata {
  const isIEC = invoice.supplierName?.includes('חשמל') || invoice.supplierTaxId === '520000472' || invoice.invoiceNumber?.includes('491506083');
  const isSonol = invoice.supplierName?.includes('סונול') || invoice.supplierName?.includes('Sonol') || invoice.invoiceNumber === '3299586';
  const isPartner = invoice.supplierName?.includes('פרטנר') || invoice.supplierTaxId === '557604147' || invoice.invoiceNumber === '1074573052' || invoice.invoiceNumber === '22242192';
  const isAmiti = invoice.supplierName?.includes('אמיתי') || invoice.supplierTaxId === '511080327' || invoice.invoiceNumber?.includes('002467');
  const isGoogle = invoice.supplierName?.includes('גוגל') || invoice.supplierName?.includes('Google') || invoice.invoiceNumber === '437508924924';
  const isESO = invoice.supplierName?.includes('אי.אס.או') || invoice.supplierName?.includes('ESO');
  const isBneiBrak = invoice.supplierName?.includes('בני ברק');
  const isBeerSheva = invoice.supplierName?.includes('באר שבע');
  const isDD = invoice.supplierName?.includes('ד.ד');
  const isAmar = invoice.supplierName?.includes('אלון עמר') || invoice.invoiceNumber === '11682';

  if (isAmiti) {
    return {
      senderName: 'ח.י אמיתי בע"מ - מחלקת הנהלת חשבונות',
      senderEmail: 'billing@amiti-group.co.il',
      recipientName: 'אמבט ליין בע"מ',
      recipientEmail: 'ambatline.reshbon@gmail.com',
      receivedDate: '17 בספטמבר 2026, 10:20',
      subject: 'חשבונית מס מקור מספר 01/002467 עבור דמי שכירות - ח.י אמיתי בע"מ',
      fileName: invoice.fileName || 'חשבונית_מס_מקור_01-002467.pdf',
      fileSize: '184 KB',
      serviceType: 'דמי שכירות ודמי ניהול מגדלי בסר C פתח תקווה',
      summaryText: 'חשבונית מס מקור עבור שכירות 08/26-10/26. צ\'ק על חודש 09/26 שולם בנפרד',
      emailBodyHtml: {
        greeting: 'לכבוד אמבט ליין בע"מ (מספרכם: 00074),',
        intro: 'שלום רב,\nמצורפת בזאת חשבונית מס מקור מספר 01/002467 בגין דמי שכירות לתקופה 08/2026 עד 10/2026 עבור המשרדים במגדלי בסר C, רחוב שחם 1 פתח תקווה.',
        detailsList: [
          { label: 'מספר חשבונית מקור', value: '01/002467' },
          { label: 'מספר הקצאה ברשות המסים', value: '260097749' },
          { label: 'תאריך הפקה', value: '17/09/2026' },
          { label: 'תיאור השירות', value: 'שכירות 08/26-10/26. צ\'ק על חודש 09/26 שולם בנפרד' },
          { label: 'סה"כ ללא מע"מ', value: '435,258.47 ₪' },
          { label: 'מע"מ 18.00%', value: '78,346.53 ₪' },
          { label: 'סה"כ לתשלום', value: '513,605.00 ₪' },
          { label: 'סטטוס תשלום', value: 'המחאה נפרדת / העברה בנקאית' }
        ],
        attachmentNotice: 'הקובץ המצורף הינו מסמך ממוחשב מאושר על פי חוק.',
        signOff: 'בכבוד רב,\nח.י אמיתי בע"מ\nגיבורי ישראל 5 נתניה | טלפון: 09-8650044 פקס: 09-8654880'
      }
    };
  }

  if (isIEC) {
    return {
      senderName: 'חשבונות חברת החשמל לישראל בע"מ',
      senderEmail: 'invoices@iec.co.il',
      recipientName: 'אמבט ליין בע״מ (רשת פרפקט ליין)',
      recipientEmail: 'ambatline.reshbon@gmail.com',
      receivedDate: '16 בספטמבר 2026, 08:30',
      subject: 'חשבון חשמל חד חודשי - מקור 2026-491506083 (חשבון חוזה: 342389945) - חברת החשמל לישראל',
      fileName: invoice.fileName || 'חשבון_חברת_חשמל_2026-491506083.pdf',
      fileSize: '485 KB (3 עמודים)',
      serviceType: 'אספקת חשמל, תעו״ז והספק מתח נמוך',
      summaryText: 'חשבון חשמל חד-חודשי מקור 2026-491506083 כולל אישור חתימה דיגיטלית Comsign',
      emailBodyHtml: {
        greeting: 'שלום רב אמבט ליין בע"מ (חשבון חוזה: 342389945),',
        intro: 'מצורף בזאת חשבון החשמל החד-חודשי שלך (חשבונית מס/קבלה מקור 2026-491506083) לתקופה מ-14/08/2026 עד 15/09/2026 עבור עורף הנמל 3X198/138XG, אשדוד.',
        detailsList: [
          { label: 'מספר חשבונית מס/קבלה מקור', value: '2026-491506083' },
          { label: 'מספר חשבון חוזה', value: '342389945' },
          { label: 'כתובת אספקה', value: 'אמבט ליין בע"מ, עורף הנמל 3X198/138XG, אשדוד' },
          { label: 'תקופת חשבון (33 ימים)', value: '14/08/2026 - 15/09/2026' },
          { label: 'חיוב בגין צריכה (18,680 קוט"ש)', value: '11,120.16 ₪' },
          { label: 'תשלום הספק KVA + קבוע', value: '399.23 ₪' },
          { label: 'סכום ללא מע״מ', value: '11,550.48 ₪' },
          { label: 'מע״מ (18%)', value: '2,079.09 ₪' },
          { label: 'סה״כ כולל מע״מ לתשלום', value: '13,629.57 ₪' },
          { label: 'מספר הקצאה ברשות המסים', value: '259062769' },
          { label: 'אופן תשלום', value: 'הוראת קבע - חיוב ב-06/10/2026 בכרטיס אשראי 3710' },
        ],
        attachmentNotice: 'הקובץ המצורף 2026-491506083.pdf הינו מסמך ממוחשב חתום דיגיטלית במקור על ידי Comsign ומאושר לניכוי מע״מ לפי חוק.',
        signOff: 'בברכה,\nחברת החשמל לישראל בע"מ\nמוקד שירות: 103 | iec.co.il'
      }
    };
  }

  if (isSonol) {
    return {
      senderName: 'סונול EVI בע״מ (Sonol EVI)',
      senderEmail: 'billing@sonol-evi.co.il',
      recipientName: 'אמבט ליין בע״מ (רשת פרפקט ליין)',
      recipientEmail: 'ambatline.reshbon@gmail.com',
      receivedDate: '18 בספטמבר 2026, 13:50',
      subject: 'Your new billing invoice (3299586) - סונול EVI בע״מ',
      fileName: invoice.fileName || '3299586.pdf',
      fileSize: '142 KB',
      serviceType: 'טעינת רכב חשמלי - רשת Sonol EVI',
      summaryText: 'חשבונית מס / קבלה מקורית על פעילות טעינה ציבורית',
      emailBodyHtml: {
        greeting: 'שלום אמבט ליין בע״מ (חשבון לקוח: 1198671),',
        intro: 'תודה שהטענת ברשת Sonol EVI. מצורפת בזאת חשבונית מס / קבלה מקורית מספר 3299586 עבור פעילות טעינה שבוצעה ברכבך.',
        detailsList: [
          { label: 'עמדת טעינה', value: 'חניון בני עקיבא 2454 (רחוב הר נבו 2, גני תקווה)' },
          { label: 'סוג חיבור', value: 'Type 2 AC (טעינה מהירה)' },
          { label: 'תאריך ושעה', value: '18/09/2026 12:45 - 13:29 (משך: 00:43:52)' },
          { label: 'כמות אנרגיה', value: '7.8340 קוט״ש (kWh)' },
          { label: 'סכום לפני מע״מ', value: '5.64 ₪' },
          { label: 'מע״מ (18%)', value: '1.02 ₪' },
          { label: 'סה״כ לתשלום', value: '6.66 ₪ (שולם בכרטיס אשראי מסתיים ב-4092)' },
          { label: 'מספר הקצאה ברשות המסים', value: '2026-51574-3299586-01' },
        ],
        attachmentNotice: 'הקובץ המצורף 3299586.pdf הינו מסמך ממוחשב חתום דיגיטלית ומהווה חשבונית מס / קבלה מקור לפי חוק.',
        signOff: 'בברכה,\nצוות שירות לקוחות סונול EVI בע״מ\nמוקד שירות ארצי: 6116* | sonol-evi.co.il'
      }
    };
  }

  if (isPartner) {
    return {
      senderName: 'פרטנר תקשורת בע״מ (Partner)',
      senderEmail: 'partner@partner.co.il',
      recipientName: 'אמבט ליין בע״מ',
      recipientEmail: 'ambatline.reshbon@gmail.com',
      receivedDate: '17 בספטמבר 2026, 14:15',
      subject: 'היי אמבט ליין בע״מ, החשבונית החודשית שלך לחודש אוגוסט 2026',
      fileName: invoice.fileName || '44_1074573052.pdf',
      fileSize: '320 KB',
      serviceType: 'שירותי תקשורת ואינטרנט עסקי',
      summaryText: 'חשבונית מס תקופתית עבור קווי תקשורת ואינטרנט',
      emailBodyHtml: {
        greeting: 'שלום רב אמבט ליין בע״מ (מספר מנוי: 88219401),',
        intro: 'לנוחיותך, מצורפת החשבונית החודשית שלך עבור שירותי תקשורת לחודש אוגוסט 2026.',
        detailsList: [
          { label: 'מספר חשבונית', value: invoice.invoiceNumber },
          { label: 'תקופת חיוב', value: '01/08/2026 - 31/08/2026' },
          { label: 'סכום לפני מע״מ', value: `${invoice.subtotal.toLocaleString()} ₪` },
          { label: 'מע״מ (18%)', value: `${invoice.vatAmount.toLocaleString()} ₪` },
          { label: 'סה״כ לתשלום', value: `${invoice.totalAmount.toLocaleString()} ₪` },
          { label: 'אמצעי תשלום', value: 'הוראת קבע בבנק (אושרה)' }
        ],
        attachmentNotice: 'החשבונית המצורפת כוללת פירוט שיחות וגלישה מלא.',
        signOff: 'תודה שבחרת בפרטנר עסקים\nמוקד עסקים: *054'
      }
    };
  }

  if (isGoogle) {
    return {
      senderName: 'Google Payments (גוגל אירלנד בע״מ)',
      senderEmail: 'payments-noreply@google.com',
      recipientName: 'אמבט ליין בע״מ (Google Ads)',
      recipientEmail: 'ambatline.reshbon@gmail.com',
      receivedDate: '17 בספטמבר 2026, 11:32',
      subject: 'FW: חשבוניות GOOGLE - מאושר פול נשלח מה-iPhone שלי ב-17 בספט׳ 2026',
      fileName: invoice.fileName || '437508924924.pdf',
      fileSize: '210 KB',
      serviceType: 'פרסום דיגיטלי - Google Ads',
      summaryText: 'חשבונית מס אוטומטית עבור פעילות פרסום ממומן',
      emailBodyHtml: {
        greeting: 'Dear Perfect Line / Ambat Line Ltd (Billing ID: 7492-1048-9921),',
        intro: 'Your monthly Google Ads invoice is now available for download.',
        detailsList: [
          { label: 'Invoice Number', value: invoice.invoiceNumber },
          { label: 'Tax ID', value: '513689408 (Google Ireland Ltd)' },
          { label: 'Total Charges', value: `${invoice.totalAmount.toLocaleString()} ${invoice.currency}` },
          { label: 'Payment Status', value: 'Paid via Automatic Debit' }
        ],
        attachmentNotice: 'Official EU/Israel tax invoice attached as PDF.',
        signOff: 'Google Ireland Ltd, Gordon House, Barrow St, Dublin 4, Ireland'
      }
    };
  }

  // Generic Israeli invoice email
  return {
    senderName: invoice.supplierName,
    senderEmail: `billing@${invoice.supplierName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'vendor'}.co.il`,
    recipientName: 'אמבט ליין בע״מ (רשת פרפקט ליין)',
    recipientEmail: 'ambatline.reshbon@gmail.com',
    receivedDate: `${invoice.issueDate} 10:00`,
    subject: `חשבונית מס מקור מספר ${invoice.invoiceNumber} - ${invoice.supplierName}`,
    fileName: invoice.fileName || `${invoice.invoiceNumber}.pdf`,
    fileSize: '185 KB',
    serviceType: 'אספקת טובין / שירותים',
    summaryText: `חשבונית מס מקורית מספר ${invoice.invoiceNumber}`,
    emailBodyHtml: {
      greeting: 'שלום רב אמבט ליין בע״מ,',
      intro: `מצורפת בזאת חשבונית מס מקורית מספר ${invoice.invoiceNumber} מאת ${invoice.supplierName}.`,
      detailsList: [
        { label: 'מספר חשבונית', value: invoice.invoiceNumber },
        { label: 'עוסק מורשה / ח.פ', value: invoice.supplierTaxId },
        { label: 'תאריך הפקה', value: invoice.issueDate },
        { label: 'סכום לפני מע״מ', value: `${invoice.subtotal.toLocaleString()} ${invoice.currency}` },
        { label: 'מע״מ', value: `${invoice.vatAmount.toLocaleString()} ${invoice.currency}` },
        { label: 'סה״כ לתשלום', value: `${invoice.totalAmount.toLocaleString()} ${invoice.currency}` }
      ],
      attachmentNotice: `הקובץ ${invoice.fileName || `${invoice.invoiceNumber}.pdf`} הינו מסמך מקור חתום דיגיטלית.`,
      signOff: `בברכה,\n${invoice.supplierName}\nמחלקת הנהלת חשבונות וגבייה`
    }
  };
}

const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const mockDir = path.join(__dirname, '..', 'public', 'mock');
if (!fs.existsSync(mockDir)) {
  fs.mkdirSync(mockDir, { recursive: true });
}

function generateInvoicePdf(fileName, invoiceData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Background page tint (subtle authentic paper)
  doc.setFillColor(254, 254, 254);
  doc.rect(0, 0, 210, 297, 'F');

  // Top header border bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(15, 12, 180, 2, 'F');

  // Supplier Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceData.supplierNameEn || invoiceData.supplierName, 15, 24);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tax ID / H.P: ${invoiceData.supplierTaxId} | Licensed Corporation`, 15, 30);
  doc.text(`${invoiceData.supplierAddress || 'Industrial Area, Holon, Israel'}`, 15, 35);
  doc.text('Phone: 03-5582910 | Email: billing@eso-systems.co.il', 15, 40);

  // Document Badge (Right Side)
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(125, 18, 70, 10, 1.5, 1.5, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('ORIGINAL TAX INVOICE', 130, 24.5);

  // Invoice Details Box (Right Side)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice No: ${invoiceData.invoiceNumber}`, 130, 34);
  doc.text(`Date: ${invoiceData.issueDate}`, 130, 39);
  doc.text(`Due Date: ${invoiceData.dueDate || 'Net + 30'}`, 130, 44);
  doc.text(`Israel Tax Allocation: ${invoiceData.allocationNumber}`, 130, 49);

  // Divider
  doc.setDrawColor(203, 213, 225);
  doc.line(15, 54, 195, 54);

  // Bill To (Customer) Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 58, 180, 24, 2, 2, 'F');
  doc.rect(15, 58, 180, 24, 'S');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('CUSTOMER / BILL TO:', 20, 64);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceData.customerName || 'Ambat Line Ltd (Perfect Line) - H.P 514214589', 20, 71);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('HaCharash 4, Holon Industrial Zone, Israel | Account Ref: 1198671', 20, 77);

  // Table Headers
  const tableTop = 90;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, tableTop, 180, 8, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);

  doc.text('ITEM / SKU', 20, tableTop + 5.5);
  doc.text('DESCRIPTION', 55, tableTop + 5.5);
  doc.text('QTY', 135, tableTop + 5.5);
  doc.text('UNIT PRICE', 150, tableTop + 5.5);
  doc.text('TOTAL', 178, tableTop + 5.5);

  // Table Rows
  let curY = tableTop + 8;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  invoiceData.lines.forEach((item, idx) => {
    curY += 7;
    doc.text(item.sku || `SKU-${idx + 1}`, 20, curY);
    doc.text(item.description, 55, curY);
    doc.text(String(item.quantity), 137, curY);
    doc.text(`${item.unitPrice.toLocaleString()} ILS`, 150, curY);
    doc.text(`${item.total.toLocaleString()} ILS`, 178, curY);

    // subtle line
    doc.setDrawColor(241, 245, 249);
    doc.line(15, curY + 2, 195, curY + 2);
  });

  // Totals Area
  const totalsY = 160;
  doc.setDrawColor(203, 213, 225);
  doc.line(125, totalsY, 195, totalsY);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Subtotal (excl. VAT):', 130, totalsY + 6);
  doc.text(`${invoiceData.subtotal.toLocaleString()} ILS`, 175, totalsY + 6);

  doc.text(`VAT (${invoiceData.vatRate || 17}%):`, 130, totalsY + 12);
  doc.text(`${invoiceData.vatAmount.toLocaleString()} ILS`, 175, totalsY + 12);

  doc.setFillColor(241, 245, 249);
  doc.rect(125, totalsY + 16, 70, 9, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL AMOUNT:', 130, totalsY + 22);
  doc.text(`${invoiceData.totalAmount.toLocaleString()} ILS`, 173, totalsY + 22);

  // Israeli Tax Digital Seal Stamp Box
  const stampY = 220;
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setLineWidth(0.8);
  doc.roundedRect(15, stampY, 180, 26, 2, 2, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(5, 150, 105);
  doc.text('[ISRAEL TAX AUTHORITY - CERTIFIED DIGITAL INVOICE]', 20, stampY + 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Digital Signer: ${invoiceData.supplierNameEn || invoiceData.supplierName} - Qualified Certificate`, 20, stampY + 12);
  doc.text(`SHA-256 Hash: e7c89f02b66a71d8820c4731852c00a944837199ecb13998`, 20, stampY + 17);
  doc.text(`Allocation ID: ${invoiceData.allocationNumber} | Law Compliance: Section 3a Income Tax Regulations 1973`, 20, stampY + 22);

  // Footer
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('This computerized document constitutes an original invoice under Israel Income Tax Regulations. Page 1 of 1', 105, 285, { align: 'center' });

  const filePath = path.join(mockDir, fileName);
  fs.writeFileSync(filePath, Buffer.from(doc.output('arraybuffer')));
  console.log('Saved PDF to:', filePath);
}

// Generate ESO Invoice PDF
generateInvoicePdf('חשבונית_מקור_ESO_99412.pdf', {
  supplierName: 'אי.אס.או מערכות ואנרגיה בע״מ',
  supplierNameEn: 'ESO SYSTEMS & ENERGY LTD',
  supplierTaxId: '514982103',
  supplierAddress: 'HaMelacha 14, Industrial Zone, Holon, Israel',
  invoiceNumber: '99412',
  issueDate: '18/09/2026',
  dueDate: '18/10/2026',
  allocationNumber: '2026-51498-99412-01',
  customerName: 'Ambat Line Ltd (Perfect Line) - H.P 514214589',
  subtotal: 3850.00,
  vatRate: 17,
  vatAmount: 654.50,
  totalAmount: 4504.50,
  lines: [
    { sku: 'ESO-SERV-01', description: 'Monthly System Maintenance & Solar Energy Monitoring', quantity: 1, unitPrice: 3200.00, total: 3200.00 },
    { sku: 'ESO-SW-UPG', description: 'HVAC Energy Management Software Upgrade - Holon Branch', quantity: 1, unitPrice: 650.00, total: 650.00 }
  ]
});

// Generate Sonol EVI Invoice PDF
generateInvoicePdf('3299586.pdf', {
  supplierName: 'סונול EVI בע״מ',
  supplierNameEn: 'SONOL EVI LTD (EV CHARGING)',
  supplierTaxId: '515747814',
  supplierAddress: 'HaGavish 10, Netanya, Israel',
  invoiceNumber: '3299586',
  issueDate: '18/09/2026',
  dueDate: '18/09/2026',
  allocationNumber: '2026-51574-3299586-01',
  customerName: 'Ambat Line Ltd - H.P 512101544',
  subtotal: 5.69,
  vatRate: 17,
  vatAmount: 0.97,
  totalAmount: 6.66,
  lines: [
    { sku: 'SONOL-EV-01', description: 'Electric Vehicle Charging - Station #402 Netanya Poleg', quantity: 1, unitPrice: 5.69, total: 5.69 }
  ]
});

// Generate Partner Invoice PDF
generateInvoicePdf('partner_invoice.pdf', {
  supplierName: 'פרטנר תקשורת בע״מ',
  supplierNameEn: 'PARTNER COMMUNICATIONS CO. LTD',
  supplierTaxId: '512463730',
  supplierAddress: 'Amal 8, Afek Park, Rosh HaAyin, Israel',
  invoiceNumber: '1074573052',
  issueDate: '17/09/2026',
  dueDate: '01/10/2026',
  allocationNumber: '2026-51246-1074573052-01',
  customerName: 'Ambat Line Ltd - H.P 514214589',
  subtotal: 162.31,
  vatRate: 17,
  vatAmount: 27.59,
  totalAmount: 189.90,
  lines: [
    { sku: 'PARTNER-MOB-08', description: 'Corporate Mobile & Telecom Services - August 2026', quantity: 1, unitPrice: 162.31, total: 162.31 }
  ]
});

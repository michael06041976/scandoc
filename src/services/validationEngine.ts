import { InvoiceDocument, MathCheckResult } from '../types';
import { enterpriseConfigService } from './enterpriseConfigService';

export function runDoubleValidation(doc: Partial<InvoiceDocument>): MathCheckResult {
  const discrepancies: string[] = [];
  const config = enterpriseConfigService.getState();
  
  const statedSubtotal = doc.subtotal || 0;
  const statedVat = doc.vatAmount || 0;
  const statedTotal = doc.totalAmount || 0;
  
  // 1. Check lines sum
  const lines = doc.lines || [];
  let calculatedLinesSum = 0;
  
  lines.forEach((line, index) => {
    const expectedLineTotal = Number((line.quantity * line.unitPrice).toFixed(2));
    if (Math.abs(expectedLineTotal - line.total) > 0.05) {
      discrepancies.push(
        `שורה ${index + 1} (${line.description || 'פריט'}): חישוב שגוי. ${line.quantity} × ${line.unitPrice} = ${expectedLineTotal}, אך בחשבונית נרשם ${line.total}`
      );
    }
    calculatedLinesSum += line.total;
  });
  
  calculatedLinesSum = Number(calculatedLinesSum.toFixed(2));
  
  if (lines.length > 0 && Math.abs(calculatedLinesSum - statedSubtotal) > 0.05) {
    discrepancies.push(
      `סכום שורות הפירוט (${calculatedLinesSum.toLocaleString()}) אינו תואם לסכום לפני מע״מ הרשום (${statedSubtotal.toLocaleString()}). הפרש: ${(calculatedLinesSum - statedSubtotal).toFixed(2)}`
    );
  }
  
  // 2. Check Subtotal + VAT = Total
  const calculatedTotal = Number((statedSubtotal + statedVat).toFixed(2));
  if (Math.abs(calculatedTotal - statedTotal) > 0.05) {
    discrepancies.push(
      `אי התאמה מתמטית: סכום לפני מע״מ (${statedSubtotal.toLocaleString()}) + מע״מ (${statedVat.toLocaleString()}) = ${calculatedTotal.toLocaleString()}, בעוד שסה״כ לתשלום הרשום הינו ${statedTotal.toLocaleString()}. הפרש: ${(calculatedTotal - statedTotal).toFixed(2)}`
    );
  }

  // 3. Tax / VAT Rate check against dynamic enterprise config
  if (statedSubtotal > 0 && statedVat > 0) {
    const effectiveVatPercent = Number(((statedVat / statedSubtotal) * 100).toFixed(1));
    const isVatMatched = config.taxRates.some(t => Math.abs(t.ratePercent - effectiveVatPercent) <= 0.5);
    if (!isVatMatched) {
      discrepancies.push(
        `אזהרת שיעור מע״מ: יחס המע״מ שחושב (${effectiveVatPercent}%) אינו תואם אף שיעור מס מוגדר במערכת (${config.taxRates.map(t => `${t.ratePercent}%`).join(', ')})`
      );
    }
  }
  
  // 4. Date check
  if (doc.issueDate && doc.dueDate) {
    const issue = new Date(doc.issueDate);
    const due = new Date(doc.dueDate);
    if (due < issue) {
      discrepancies.push(`תאריך פירעון (${doc.dueDate}) קודם לתאריך הוצאת החשבונית (${doc.issueDate})`);
    }
  }

  // 5. Missing crucial fields
  if (!doc.invoiceNumber || doc.invoiceNumber.trim() === '') {
    discrepancies.push(`מספר חשבונית חסר או אינו קריא`);
  }
  if (!doc.supplierTaxId || doc.supplierTaxId.trim() === '') {
    discrepancies.push(`מספר עוסק מורשה / ח.פ / Tax ID חסר`);
  }

  // 6. Check Emergency Pause
  if (config.emergencyPauseSync) {
    discrepancies.push(`התראת מנהל: המערכת שרויה במצב השהיית חירום - שידורים ל-ERP מושבתים זמנית`);
  }

  return {
    passed: discrepancies.filter(d => !d.startsWith('אזהרת')).length === 0,
    calculatedSubtotal: calculatedLinesSum > 0 ? calculatedLinesSum : statedSubtotal,
    statedSubtotal,
    calculatedVat: statedVat,
    statedVat,
    calculatedTotal,
    statedTotal,
    linesSum: calculatedLinesSum,
    discrepancies,
  };
}

/**
 * Strict Rule 5 Coherence Validation:
 * a) subtotal_extracted + tax_amount == total_amount
 * b) sum(line_items) == subtotal_extracted (or total_amount if no separate subtotal)
 * If either fails, returns "MISMATCH" with exact diff details.
 */
export function getStrictRule5Validation(doc: Partial<InvoiceDocument>): {
  status: 'VALID' | 'MISMATCH';
  details: string;
  diffSubtotalTax: number;
  diffLinesSubtotal: number;
} {
  const statedSubtotal = doc.subtotal || 0;
  const statedVat = doc.vatAmount || 0;
  const statedTotal = doc.totalAmount || 0;
  const lines = doc.lines || [];

  const sumLines = Number(lines.reduce((s, l) => s + (l.total || 0), 0).toFixed(2));
  const calcTotalFromParts = Number((statedSubtotal + statedVat).toFixed(2));
  const diffSubtotalTax = Number(Math.abs(calcTotalFromParts - statedTotal).toFixed(2));
  const expectedBase = statedSubtotal > 0 ? statedSubtotal : statedTotal;
  const diffLinesSubtotal = lines.length > 0 ? Number(Math.abs(sumLines - expectedBase).toFixed(2)) : 0;

  const errors: string[] = [];

  if (diffSubtotalTax > 0.05) {
    errors.push(`Sous-total (${statedSubtotal.toFixed(2)}) + Taxe (${statedVat.toFixed(2)}) = ${calcTotalFromParts.toFixed(2)} ≠ Total (${statedTotal.toFixed(2)}) [écart: ${diffSubtotalTax.toFixed(2)}]`);
  }

  if (lines.length > 0 && diffLinesSubtotal > 0.05) {
    errors.push(`Somme des ${lines.length} lignes (${sumLines.toFixed(2)}) ≠ Base attendue (${expectedBase.toFixed(2)}) [écart: ${diffLinesSubtotal.toFixed(2)}]`);
  }

  if (errors.length > 0) {
    return {
      status: 'MISMATCH',
      details: errors.join(' | '),
      diffSubtotalTax,
      diffLinesSubtotal
    };
  }

  return {
    status: 'VALID',
    details: `Cohérence validée : ${statedSubtotal.toFixed(2)} + ${statedVat.toFixed(2)} = ${statedTotal.toFixed(2)} et somme de ${lines.length} lignes = ${sumLines.toFixed(2)}`,
    diffSubtotalTax: 0,
    diffLinesSubtotal: 0
  };
}

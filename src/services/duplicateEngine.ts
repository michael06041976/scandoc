import { InvoiceDocument, DuplicateCheckResult, DuplicateRisk } from '../types';

export function runDuplicateDetection(
  currentDoc: Partial<InvoiceDocument>,
  existingDocs: InvoiceDocument[]
): DuplicateCheckResult {
  const reasons: string[] = [];
  let risk: DuplicateRisk = 'none';
  let score = 0;
  let matchedDoc: InvoiceDocument | undefined;

  for (const doc of existingDocs) {
    if (doc.id === currentDoc.id) continue;

    // Check 1: Exact invoice number & exact supplier
    const sameInvoiceNumber = 
      Boolean(currentDoc.invoiceNumber) && 
      Boolean(doc.invoiceNumber) && 
      currentDoc.invoiceNumber?.trim().toLowerCase() === doc.invoiceNumber.trim().toLowerCase();

    const sameSupplier = 
      (Boolean(currentDoc.supplierTaxId) && currentDoc.supplierTaxId === doc.supplierTaxId) ||
      (Boolean(currentDoc.supplierName) && currentDoc.supplierName?.toLowerCase() === doc.supplierName.toLowerCase());

    const sameAmount = 
      currentDoc.totalAmount !== undefined && 
      doc.totalAmount !== undefined && 
      Math.abs(currentDoc.totalAmount - doc.totalAmount) < 0.01;

    if (sameInvoiceNumber && sameSupplier) {
      risk = 'high';
      score = 98;
      matchedDoc = doc;
      reasons.push(
        `Même numéro de pièce "${currentDoc.invoiceNumber}" déjà enregistré pour le fournisseur ${doc.supplierName} (Doc ID: ${doc.id})`
      );
      break;
    }

    if (sameSupplier && sameAmount) {
      // Check date proximity (within 30 days)
      if (currentDoc.issueDate && doc.issueDate) {
        const d1 = new Date(currentDoc.issueDate).getTime();
        const d2 = new Date(doc.issueDate).getTime();
        const daysDiff = Math.abs(d1 - d2) / (1000 * 3600 * 24);

        if (daysDiff <= 35) {
          risk = 'possible';
          score = Math.max(score, 75);
          matchedDoc = doc;
          reasons.push(
            `Même fournisseur et montant identique (${currentDoc.totalAmount} ${doc.currency}) émis à ${Math.round(daysDiff)} jours d'intervalle`
          );
        }
      }
    }
  }

  return {
    risk,
    score,
    matchedDocumentId: matchedDoc?.id,
    matchedInvoiceNumber: matchedDoc?.invoiceNumber,
    matchedSupplierName: matchedDoc?.supplierName,
    matchedAmount: matchedDoc?.totalAmount,
    reasons,
  };
}

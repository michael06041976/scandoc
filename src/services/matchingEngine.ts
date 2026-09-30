import { InvoiceDocument, PurchaseOrder, GoodsReceipt, ThreeWayMatchResult } from '../types';

export function runThreeWayMatching(
  invoice: Partial<InvoiceDocument>,
  purchaseOrders: PurchaseOrder[],
  receipts: GoodsReceipt[]
): ThreeWayMatchResult {
  const discrepancies: string[] = [];

  if (!invoice.purchaseOrderNumber) {
    return {
      status: 'po_missing',
      discrepancies: ['Aucun numéro de commande fournisseur (PO) associé à cette facture'],
    };
  }

  const po = purchaseOrders.find(
    p => p.poNumber.toLowerCase() === invoice.purchaseOrderNumber?.trim().toLowerCase()
  );

  if (!po) {
    return {
      status: 'po_missing',
      poNumber: invoice.purchaseOrderNumber,
      discrepancies: [`La commande fournisseur N° "${invoice.purchaseOrderNumber}" n'existe pas dans le système`],
    };
  }

  const receipt = receipts.find(
    r => r.poNumber.toLowerCase() === po.poNumber.toLowerCase()
  );

  let totalQtyOrdered = 0;
  let totalQtyReceived = 0;
  let totalQtyInvoiced = 0;
  let priceVariance = 0;

  po.lines.forEach(poLine => {
    totalQtyOrdered += poLine.orderedQuantity;
    totalQtyReceived += poLine.receivedQuantity;
  });

  const invoiceLines = invoice.lines || [];
  invoiceLines.forEach(invLine => {
    totalQtyInvoiced += invLine.quantity;

    // Find matching line in PO
    const matchedPoLine = po.lines.find(
      p => (invLine.sku && p.sku === invLine.sku) || 
           p.description.toLowerCase().includes(invLine.description.toLowerCase())
    );

    if (matchedPoLine) {
      if (Math.abs(matchedPoLine.unitPrice - invLine.unitPrice) > 0.01) {
        const diff = invLine.unitPrice - matchedPoLine.unitPrice;
        priceVariance += diff * invLine.quantity;
        discrepancies.push(
          `Écart de prix sur "${invLine.description}": facturé à ${invLine.unitPrice} ${invoice.currency}, commandé à ${matchedPoLine.unitPrice} ${po.currency}`
        );
      }
    }
  });

  if (!receipt && totalQtyReceived === 0) {
    discrepancies.push(`Aucun bon de réception (BL) validé en entrepôt pour la commande ${po.poNumber}`);
    return {
      status: 'receipt_missing',
      poNumber: po.poNumber,
      quantityOrdered: totalQtyOrdered,
      quantityReceived: 0,
      quantityInvoiced: totalQtyInvoiced,
      priceVariance,
      quantityVariance: totalQtyInvoiced - totalQtyOrdered,
      discrepancies,
    };
  }

  // Check quantities
  if (totalQtyInvoiced > totalQtyReceived) {
    discrepancies.push(
      `Quantité facturée (${totalQtyInvoiced}) supérieure à la quantité réceptionnée (${totalQtyReceived}). Écart: ${totalQtyInvoiced - totalQtyReceived} unités non livrées`
    );
  }

  const status = discrepancies.length === 0 ? 'matched_100' : 'variance_detected';

  return {
    status,
    poNumber: po.poNumber,
    receiptNumber: receipt?.receiptNumber,
    quantityOrdered: totalQtyOrdered,
    quantityReceived: totalQtyReceived,
    quantityInvoiced: totalQtyInvoiced,
    priceVariance,
    quantityVariance: totalQtyInvoiced - totalQtyReceived,
    discrepancies,
  };
}

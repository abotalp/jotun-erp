import React, { useRef } from 'react'
import { formatCurrency } from '@/lib/utils'
import html2pdf from 'html2pdf.js'

interface Props {
  invoice: {
    invoice_no: string
    date: string
    is_tax_invoice: boolean
    subtotal: number
    discount_amount: number
    tax_rate: number
    tax_amount: number
    total: number
    paid: number
    remaining: number
    customer_name?: string | null
    customer_phone?: string | null
    items: Array<{
      product_name: string
      size_name: string | null
      quantity: number
      unit_price: number
      total: number
      color_code?: string | null
      color_name?: string | null
    }>
  }
  storeName?: string
  storePhone?: string
  storeAddress?: string
  taxNumber?: string
  receiptFooter?: string
  onClose: () => void
}

export default function PrintInvoice({
  invoice, storeName, storePhone, storeAddress, taxNumber, receiptFooter, onClose
}: Props) {
  const printRef = useRef<HTMLDivElement>(null)

  const hasDiscount = (invoice.discount_amount ?? 0) > 0

  function handlePrint() {
    const printContent = printRef.current?.innerHTML
    if (!printContent) return

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) {
      alert('من فضلك اسمح بفتح النوافذ المنبثقة من إعدادات المتصفح')
      return
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8" />
          <title>فاتورة ${invoice.invoice_no}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Cairo', 'Tahoma', 'Arial', sans-serif; direction: rtl; color: #000; background: #fff; padding: 20px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  // ✅ تحميل PDF مباشرة
  async function handleDownloadPDF() {
    if (!printRef.current) return

    const element = printRef.current.cloneNode(true) as HTMLElement
    element.style.padding = '20px'
    element.style.background = '#fff'

    const opt = {
      margin: 10,
      filename: `فاتورة-${invoice.invoice_no}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }

    try {
      await html2pdf().set(opt).from(element).save()
    } catch (e) {
      console.error('PDF Error:', e)
      alert('حدث خطأ أثناء إنشاء PDF')
    }
  }

  const date = new Date(invoice.date).toLocaleString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
      dir="rtl"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-black">🖨️ معاينة الفاتورة - A4</h3>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg"
            >
              📥 تحميل PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg"
            >
              🖨️ طباعة
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-200">
          <div ref={printRef} className="bg-white p-8 shadow-md mx-auto" style={{ maxWidth: '210mm', minHeight: '297mm', fontFamily: "'Cairo', 'Tahoma', 'Arial', sans-serif", direction: 'rtl' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '3px solid #1B3A6B', paddingBottom: '15px', marginBottom: '20px' }}>
              <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#1B3A6B', marginBottom: '5px' }}>
                {storeName ?? 'معرض جوتن للدهانات'}
              </h1>
              {storePhone && <p style={{ fontSize: '14px', color: '#555', margin: '3px 0' }}>📞 {storePhone}</p>}
              {storeAddress && <p style={{ fontSize: '14px', color: '#555', margin: '3px 0' }}>📍 {storeAddress}</p>}
              {invoice.is_tax_invoice && taxNumber && (
                <p style={{ fontSize: '14px', color: '#555', margin: '3px 0' }}>الرقم الضريبي: {taxNumber}</p>
              )}
              <div style={{ background: '#1B3A6B', color: '#fff', padding: '8px 20px', display: 'inline-block', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}>
                {invoice.is_tax_invoice ? 'فاتورة ضريبية' : 'فاتورة بيع'}
              </div>
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#f5f5f5', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <div>
                <span>رقم الفاتورة: </span>
                <strong style={{ color: '#1B3A6B' }}>{invoice.invoice_no}</strong>
              </div>
              <div>
                <span>التاريخ: </span>
                <strong style={{ color: '#1B3A6B' }}>{date}</strong>
              </div>
            </div>

            {/* Customer */}
            {invoice.customer_name && (
              <div style={{ padding: '12px 15px', border: '2px solid #1B3A6B', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
                <div>العميل: <strong>{invoice.customer_name}</strong></div>
                {invoice.customer_phone && (
                  <div style={{ marginTop: '5px' }}>الهاتف: <strong>{invoice.customer_phone}</strong></div>
                )}
              </div>
            )}

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '14px' }}>
              <thead style={{ background: '#1B3A6B', color: '#fff' }}>
                <tr>
                  <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                  <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>الصنف</th>
                  <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>الكمية</th>
                  <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>السعر</th>
                  <th style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f9f9f9' : '#fff' }}>
                    <td style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center' }}>{i + 1}</td>
                    <td style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'right' }}>
                      <div><strong>{item.product_name}</strong></div>
                      {item.size_name && <div style={{ fontSize: '12px', color: '#666' }}>{item.size_name}</div>}
                      {item.color_code && (
                        <div style={{ fontSize: '12px', color: '#6B21A8', marginTop: '4px' }}>
                          اللون: {item.color_code} - {item.color_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ padding: '12px 10px', border: '1px solid #ddd', textAlign: 'center', fontWeight: 'bold' }}>{formatCurrency(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ marginRight: 'auto', width: '50%', border: '2px solid #1B3A6B', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '14px', borderBottom: '1px solid #eee' }}>
                <span>المجموع:</span>
                <strong>{formatCurrency(invoice.subtotal)}</strong>
              </div>

              {hasDiscount && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '14px', borderBottom: '1px solid #eee', color: '#059669' }}>
                  <span>الخصم:</span>
                  <strong>- {formatCurrency(invoice.discount_amount)}</strong>
                </div>
              )}

              {invoice.tax_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '14px', borderBottom: '1px solid #eee' }}>
                  <span>الضريبة ({invoice.tax_rate}%):</span>
                  <strong>{formatCurrency(invoice.tax_amount)}</strong>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: '#D4AF37', color: '#fff', fontSize: '18px', fontWeight: 900 }}>
                <span>الإجمالي:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '14px', borderTop: '1px solid #eee' }}>
                <span>المدفوع:</span>
                <strong>{formatCurrency(invoice.paid)}</strong>
              </div>

              {invoice.remaining > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 15px', fontSize: '14px', color: '#DC2626', fontWeight: 'bold' }}>
                  <span>المتبقي:</span>
                  <span>{formatCurrency(invoice.remaining)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '2px dashed #999', fontSize: '13px', color: '#555' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1B3A6B', marginBottom: '8px' }}>
                {receiptFooter ?? 'شكراً لتعاملكم معنا'}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

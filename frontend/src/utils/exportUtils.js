import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export array of objects to Excel
 * @param {Array} data - The JSON data to export
 * @param {String} filename - Name of the output file (without extension)
 */
export const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) return;
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Export array of objects to PDF using autoTable
 * @param {String} title - Title printed at the top of the PDF
 * @param {Array} columns - Array of column header strings or objects {header, dataKey}
 * @param {Array} data - Array of objects or arrays matching the columns
 * @param {String} filename - Name of the output file (without extension)
 */
export const exportToPDF = (title, columns, data, filename) => {
  if (!data || data.length === 0) return;
  
  const doc = new jsPDF('landscape'); // landscape is generally better for tables
  
  // Header
  doc.setFontSize(18);
  doc.text('LoopWren MFI', 14, 15);
  doc.setFontSize(12);
  doc.text(title, 14, 23);
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
  
  // Table
  doc.autoTable({
    startY: 35,
    head: [columns],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] }, // Slate-900 color for headers
    styles: { fontSize: 8 },
  });
  
  doc.save(`${filename}.pdf`);
};

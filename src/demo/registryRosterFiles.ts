import type { RegistryRoster } from './registryRoster';

const notice = 'Fictional staff roster - Approved (demo) records only. No real youth information or identity credentials.';
const generated = (roster: RegistryRoster) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(roster.generatedAt)) + ' Manila time';
const plain = (text: string) => text.replace(/[\u2010-\u2015]/g, '-').replace(/\u00b7/g, '|');

export async function rosterExcel(roster: RegistryRoster): Promise<Uint8Array> {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook(); book.creator = 'SK-DigiTalipapa'; book.created = new Date(roster.generatedAt);
  const sheet = book.addWorksheet('Approved youth', { views: [{ state: 'frozen', ySplit: 6, showGridLines: false }], pageSetup: { orientation: 'landscape', paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
  sheet.columns = roster.columns.map(column => ({ width: roster.columns.length === 1 ? Math.max(60, column.width) : column.width }));
  const width = Math.max(60, roster.columns.reduce((sum, column) => sum + column.width, 0));
  for (const [index, value] of ['SK-DigiTalipapa | ' + roster.title, roster.description, notice, `${roster.count} approved youth | Generated ${generated(roster)}`].entries()) {
    const row = sheet.addRow([value]);
    if (roster.columns.length > 1) sheet.mergeCells(row.number, 1, row.number, roster.columns.length);
    row.font = { name: 'Calibri', size: index === 0 ? 17 : 11, bold: index === 0, color: { argb: 'FF062654' } };
    row.alignment = { wrapText: true, vertical: 'middle' };
    row.height = Math.max(32, Math.ceil(value.length / Math.max(10, width * .75)) * (index === 0 ? 22 : 16) + 8);
  }
  sheet.addRow([]);
  const header = sheet.addRow(roster.columns.map(column => column.label)); header.height = 34;
  header.eachCell(cell => { cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2265A2' } }; cell.alignment = { wrapText: true, vertical: 'middle' }; });
  for (const values of roster.rows) {
    const row = sheet.addRow(values); row.height = Math.max(34, ...values.map((value, index) => Math.ceil(value.length / Math.max(10, (roster.columns.length === 1 ? 60 : roster.columns[index].width) * .85)) * 15 + 8));
    row.eachCell(cell => { cell.numFmt = '@'; cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF062654' } }; cell.alignment = { wrapText: true, vertical: 'middle' }; if (row.number % 2) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F6FC' } }; });
  }
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: sheet.rowCount, column: roster.columns.length } };
  sheet.pageSetup.printTitlesRow = '1:6';
  sheet.headerFooter.oddFooter = '&LSK-DigiTalipapa - Fictional roster&RPage &P of &N';
  return new Uint8Array(await book.xlsx.writeBuffer());
}

export async function rosterPdf(roster: RegistryRoster): Promise<Uint8Array> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', compress: true });
  doc.setProperties({ title: 'SK-DigiTalipapa | Approved youth roster', author: 'SK-DigiTalipapa' });
  const pageWidth = doc.internal.pageSize.getWidth(), margin = 14;
  let y = 18;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor('#062654'); doc.text('SK-DigiTalipapa | Approved youth roster', margin, y); y += 9;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  for (const text of [roster.description, notice, `${roster.count} approved youth | Generated ${generated(roster)}`]) {
    const lines: string[] = doc.splitTextToSize(plain(text), pageWidth - margin * 2); doc.text(lines, margin, y); y += lines.length * 4.5 + 3;
  }
  autoTable(doc, { startY: y, head: [roster.columns.map(column => column.label)], body: roster.rows.map(row => row.map(plain)), margin: { top: 16, bottom: 18, left: margin, right: margin },
    styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak', textColor: '#062654', valign: 'middle' }, headStyles: { fillColor: '#2265A2', textColor: '#FFFFFF' }, alternateRowStyles: { fillColor: '#EAF0F7' }, rowPageBreak: 'avoid', showHead: 'everyPage' });
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) { doc.setPage(page); doc.setFontSize(8); doc.setTextColor('#345475'); doc.text('Fictional staff roster | First submission date determines the reporting period', margin, 201); doc.text(`${page} / ${pages}`, pageWidth - margin, 201, { align: 'right' }); }
  return new Uint8Array(doc.output('arraybuffer'));
}

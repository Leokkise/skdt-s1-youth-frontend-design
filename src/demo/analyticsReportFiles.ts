import type { AnalyticsReport, ReportSection } from './analyticsReport';
import { analyticsMetricLabel } from './analyticsOverview';

const navy = '061A4D';
const blue = '0038A7';
const mist = 'EAF0F7';
const sheetNames: Record<string, string> = { age: 'Age groups', gender: 'Gender', civil: 'Civil status', osy: 'School status', civic: 'Civic participation', programs: 'Program preferences', education: 'Education', work: 'Work status', cross: 'Education by age' };
const generatedLabel = (report: AnalyticsReport) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(report.generatedAt)) + ' Manila time';
const selectionLabel = (report: AnalyticsReport) => [report.period, report.selection.band, report.through].filter(Boolean).join(' · ');

function detailTable(section: ReportSection) {
  if (section.key === 'cross') {
    const totals = section.columns.slice(1).map((_, index) => section.matrix.reduce((sum, row) => sum + Number(row[index + 1]), 0));
    return { columns: section.columns, rows: [...section.matrix, ['Period total', ...totals]] };
  }
  return {
    columns: ['Month', ...section.matrix.map(row => String(row[0]))],
    rows: section.columns.slice(1).map((month, index) => [month, ...section.matrix.map(row => row[index + 1])]),
  };
}

export async function analyticsExcel(report: AnalyticsReport): Promise<Uint8Array> {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SK-DigiTalipapa';
  workbook.created = new Date(report.generatedAt);
  function sheet(name: string, title: string, columns = 8) {
    const ws = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 5, showGridLines: false }], pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 } });
    ws.columns = Array.from({ length: columns }, (_, index) => ({ width: index === 0 ? 38 : 15 }));
    function line(text: string, size = 11, bold = false) {
      const row = ws.addRow([text]);
      ws.mergeCells(row.number, 1, row.number, columns);
      row.font = { name: 'Calibri', size, bold, color: { argb: 'FF' + navy } };
      row.alignment = { wrapText: true, vertical: 'middle' };
      row.height = Math.max(size + 12, Math.ceil(text.length / (32 + (columns - 1) * 12)) * (size + 4) + 8);
      return row;
    }
    const titleRow = line(title, 18, true);
    titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + mist } };
    line(selectionLabel(report));
    line(report.notice);
    line(`Generated ${generatedLabel(report)}`);
    ws.addRow([]);
    ws.headerFooter.oddFooter = '&LSK-DigiTalipapa · Analytics&RPage &P of &N';
    return { ws, line };
  }
  function header(ws: import('exceljs').Worksheet, values: string[]) {
    const row = ws.addRow(values);
    row.height = 36;
    row.eachCell(cell => { cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + blue } }; cell.alignment = { vertical: 'middle', wrapText: true }; });
  }
  function dataRow(ws: import('exceljs').Worksheet, values: (string | number | null)[]) {
    const row = ws.addRow(values);
    row.height = 30;
    row.eachCell((cell, column) => { cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF' + navy }, bold: values[0] === 'Period total' }; cell.alignment = { vertical: 'middle', wrapText: true, horizontal: column === 1 ? 'left' : 'center' }; if (values[0] === 'Period total' || row.number % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: values[0] === 'Period total' ? 'FF' + mist : 'FFF5F8FC' } }; });
    return row;
  }
  const { ws: summary, line } = sheet('Summary', 'SK-DigiTalipapa · Analytics');
  header(summary, ['Measure', 'Value', 'Denominator / context']);
  summary.views = [{ state: 'frozen', ySplit: 6, showGridLines: false }];
  summary.mergeCells(summary.rowCount, 3, summary.rowCount, 8);
  report.summary.forEach(metric => {
    const value = metric.rate && metric.value !== null ? Math.round(metric.value * 100) / 100 : metric.value ?? analyticsMetricLabel(metric);
    const row = dataRow(summary, [metric.label, value, metric.context]);
    summary.mergeCells(row.number, 3, row.number, 8);
    row.getCell(3).alignment = { vertical: 'middle', wrapText: true, horizontal: 'left' };
    row.getCell(2).numFmt = metric.rate ? '0%' : '0';
  });
  summary.addRow([]);
  line('Selected data modules', 12, true);
  report.modules.forEach(label => line(label));
  line('Rates use known answers; category shares on detail sheets use all selected approved profiles. Zero means no recorded profiles; a dash marks a future month. Empty selections do not establish absence of community needs.');
  for (const section of report.sections) {
    const detail = detailTable(section);
    const columns = Math.max(8, detail.columns.length);
    const { ws, line } = sheet(sheetNames[section.key], section.title, columns);
    line(section.note);
    line('Selected-period totals', 12, true);
    header(ws, ['Category', 'Profiles', 'Share', 'Denominator']);
    section.rows.forEach(row => {
      const entry = dataRow(ws, [row.label, row.count, row.percent / 100, section.denominator]);
      entry.getCell(3).numFmt = '0.0%';
    });
    if (!section.rows.length) line('No approved profiles in this selection.');
    ws.addRow([]);
    line(section.key === 'cross' ? 'Education and age counts' : 'Monthly profile submissions', 12, true);
    header(ws, detail.columns);
    ws.lastRow!.height = 56;
    if (detail.columns.length > 8) ws.views = [{ state: 'frozen', xSplit: 1, ySplit: 5, showGridLines: false }];
    detail.rows.forEach(values => dataRow(ws, values));
    if (section.key === 'cross') {
      ws.addRow([]);
      line('Age shares within each education level (including missing age groups)', 12, true);
      header(ws, section.columns.slice(0, -1));
      section.matrix.forEach(values => {
        const total = Number(values.at(-1));
        const row = dataRow(ws, [String(values[0]), ...values.slice(1, -1).map(value => total ? Number(value) / total : 0)]);
        for (let col = 2; col <= values.length - 1; col++) row.getCell(col).numFmt = '0.0%';
      });
    }
    ws.addRow([]);
    line('Insights', 12, true);
    section.insights.forEach(insight => { line(insight.title, 11, true); line(insight.text); });
    line('Confirm current answers and interest before targeting services. These submissions are not a population census.');
    ws.pageSetup.printArea = `A1:${ws.getColumn(columns).letter}${ws.rowCount}`;
  }
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function analyticsPdf(report: AnalyticsReport): Promise<Uint8Array> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ orientation: 'landscape', format: 'a4', compress: true });
  doc.setProperties({ title: 'SK-DigiTalipapa · Analytics', author: 'SK-DigiTalipapa', subject: 'Aggregate youth analytics' });
  const margin = 16;
  const width = doc.internal.pageSize.getWidth();
  const bottom = doc.internal.pageSize.getHeight() - 18;
  const pageSections = new Map<number, string>();
  let y = 18;
  const newPage = () => { doc.addPage(); y = 18; };
  function paragraph(text: string, size = 10, bold = false, x = margin, textWidth = width - margin * 2) {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(`#${navy}`);
    const lines: string[] = doc.splitTextToSize(text, textWidth);
    for (const line of lines) { if (y + 5 > bottom) newPage(); doc.text(line, x, y); y += size * .45; }
    y += 3;
  }
  function table(head: string[], body: (string | number)[][], firstWidth = 65, shares?: number[], split = false) {
    autoTable(doc, { startY: y, head: [head], body,
      margin: { top: 18, bottom: 18, left: margin, right: margin },
      horizontalPageBreak: split, horizontalPageBreakRepeat: 0,
      styles: { font: 'helvetica', fontSize: 9, cellPadding: head[0] === 'Month' ? 1.2 : 1.8, textColor: `#${navy}`, overflow: 'linebreak', valign: 'middle', halign: 'center' },
      headStyles: { fillColor: `#${blue}`, textColor: '#FFFFFF', fontStyle: 'bold' }, alternateRowStyles: { fillColor: `#${mist}` },
      columnStyles: split ? Object.fromEntries(head.map((_, index) => [index, { cellWidth: index ? 30 : firstWidth, halign: index ? 'center' : 'left' }])) : { 0: { cellWidth: firstWidth, halign: 'left' } },
      rowPageBreak: 'avoid', showHead: 'everyPage',
      didParseCell: data => {
        if (data.section === 'body' && body[data.row.index]?.[0] === 'Period total') {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = `#${mist}`;
        }
      },
      didDrawCell: data => {
        if (shares && data.section === 'body' && data.column.index === head.length - 1) {
          const x = data.cell.x + 3, barY = data.cell.y + data.cell.height / 2 - 1.5, barWidth = data.cell.width - 6;
          doc.setFillColor('#EAF0F7'); doc.rect(x, barY, barWidth, 3, 'F');
          doc.setFillColor(['#2265a2', '#087e8b', '#b27918', '#7053a6', '#b64c70', '#42734c', '#914b22', '#35436e', '#a94f99', '#557c12', '#bd4a34', '#2575a8', '#886120', '#53628b', '#27675f', '#59616c'][data.row.index % 16]);
          if (shares[data.row.index] > 0) doc.rect(x, barY, barWidth * Math.min(100, shares[data.row.index]) / 100, 3, 'F');
        }
      },
      didDrawPage: data => { y = data.cursor?.y || y; },
    });
    y += 8;
  }
  function sectionIntro(section: ReportSection) {
    paragraph(section.title, 18, true);
    paragraph(selectionLabel(report), 10);
    paragraph(section.note, 10);
  }
  paragraph('SK-DigiTalipapa', 22, true);
  paragraph('Analytics', 16, true);
  paragraph(selectionLabel(report), 12);
  paragraph(report.notice, 11, true);
  paragraph(`Generated ${generatedLabel(report)}`, 10);
  table(['Measure', 'Value', 'Context'], report.summary.map(metric => [metric.label, analyticsMetricLabel(metric), metric.context]));
  paragraph('Included modules', 12, true);
  report.modules.forEach(module => paragraph(module));
  paragraph('Rates use known answers. Category shares use all selected approved profiles. Reports contain no individual youth records and no year-to-year comparisons.');
  for (const section of report.sections) {
    newPage(); sectionIntro(section);
    const firstPage = doc.getNumberOfPages();
    paragraph('Selected-period distribution', 12, true);
    // A table-aligned bar column keeps exact numbers readable even for small categories.
    const rows = section.rows.map(row => [row.label, row.count, `${row.percent.toFixed(1)}%`, section.denominator, '']);
    if (rows.length) table(['Category', 'Profiles', 'Share', 'Denominator', 'Distribution'], rows, 72, section.rows.map(row => row.percent));
    else paragraph('No approved profiles in this selection.');
    const detail = detailTable(section);
    if (y > bottom - 60 || detail.columns.length > 8) newPage();
    paragraph(section.key === 'cross' ? 'Education and age counts' : 'Monthly profile submissions', 12, true);
    table(detail.columns, detail.rows, section.key === 'cross' ? 65 : 26, undefined, detail.columns.length > 8);
    if (section.key === 'cross') {
      paragraph('Age shares within each education level', 12, true);
      table(section.columns.slice(0, -1), section.matrix.map(values => [String(values[0]), ...values.slice(1, -1).map(value => `${(Number(values.at(-1)) ? Number(value) / Number(values.at(-1)) * 100 : 0).toFixed(1)}%`)]), 65);
    }
    if (y > bottom - 24) newPage();
    paragraph('Insights', 12, true);
    section.insights.forEach(insight => {
      if (y > bottom - 18) newPage();
      paragraph(insight.title, 10, true);
      paragraph(insight.text);
    });
    for (let page = firstPage + 1; page <= doc.getNumberOfPages(); page++) pageSections.set(page, section.title);
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor('#345475');
    const section = pageSections.get(page);
    if (section) {
      doc.text(section, margin, 10);
      doc.setDrawColor('#D4E2F0'); doc.line(margin, 12, width - margin, 12);
    }
    doc.text('SK-DigiTalipapa · Aggregate Analytics', margin, bottom + 9);
    doc.text(`${page} / ${pages}`, width - margin, bottom + 9, { align: 'right' });
  }
  return new Uint8Array(doc.output('arraybuffer'));
}

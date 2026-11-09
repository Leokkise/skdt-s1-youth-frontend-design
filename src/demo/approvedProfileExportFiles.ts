import { PROFILE_EXPORT_SECTIONS, type ApprovedProfileExport } from './approvedProfileExport';

const navy = '061A4D';
const blue = '0038A7';
const mist = 'EAF0F7';

export async function approvedProfilesPdf(report: ApprovedProfileExport) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF({ format: 'a4', compress: true });
  doc.setProperties({ title: 'Approved profiles', author: 'SK-DigiTalipapa' });
  const pageReferences = new Map<number,string>();
  report.profiles.forEach((profile, index) => {
    if (index) doc.addPage();
    const firstPage = doc.getNumberOfPages();
    doc.setTextColor(`#${navy}`);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.text('Approved youth profile', 14, 22);
    const nameLines: string[] = doc.splitTextToSize(profile.name,180);
    doc.setFontSize(13); doc.text(nameLines,14,31);
    const metadataY = 33 + nameLines.length * 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`Registration No. ${profile.registrationNo} · Reporting date: ${profile.reportingDate} · Approved`, 14, metadataY);
    let y = metadataY + 7;
    if (report.scope) {
      const scopeLines: string[] = doc.splitTextToSize(report.scope, 180);
      doc.text(scopeLines, 14, y);
      y += scopeLines.length * 4 + 3;
    }
    for (const section of profile.sections) {
      if (y > 247) { doc.addPage(); y = 21; }
      autoTable(doc, { startY: y, head: [[{ content: section.title, colSpan: 2 }], ['Field', 'Answer']], body: section.answers.map(answer => [answer.label, answer.value]),
        margin: { left: 14, right: 14, top: 21, bottom: 18 }, columnStyles: { 0: { cellWidth: 70 } },
        styles: {fontSize: 9, cellPadding: 2.6, overflow:'linebreak', valign:'top', textColor:`#${navy}`},
        headStyles:{fillColor:`#${blue}`,textColor:'#FFFFFF'}, alternateRowStyles:{fillColor:'#F5F8FC'}, rowPageBreak:'avoid', showHead:'everyPage' });
      y = (doc as typeof doc & {lastAutoTable:{finalY:number}}).lastAutoTable.finalY + 8;
    }
    for(let page=firstPage;page<=doc.getNumberOfPages();page++)pageReferences.set(page,profile.registrationNo);
  });
  const pages=doc.getNumberOfPages();for(let page=1;page<=pages;page++){doc.setPage(page);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor('#345475');doc.text('SK-DigiTalipapa · Private staff export',14,11);doc.setDrawColor('#D4E2F0');doc.line(14,14,196,14);doc.text(`Registration No. ${pageReferences.get(page)}`,14,289);doc.text(`${page} / ${pages}`,196,289,{align:'right'});}
  return new Uint8Array(doc.output('arraybuffer'));
}

export async function approvedProfilesExcel(report: ApprovedProfileExport) {
  const { default: ExcelJS } = await import('exceljs');
  const book = new ExcelJS.Workbook(); book.creator = 'SK-DigiTalipapa'; book.created = new Date(report.generatedAt);
  const sectionTitles = report.profiles[0]?.sections.map(section=>section.title) || [];
  for (const [index,title] of sectionTitles.entries()) {
    const sheet=book.addWorksheet(title,{views:[{state:'frozen',xSplit:2,ySplit:2,showGridLines:false}],pageSetup:{paperSize:9,orientation:'landscape',scale:75}});
    // Different conditional fields remain separate columns across the selected records.
    const included = new Set(report.profiles.flatMap(profile => profile.sections[index].answers.map(answer => answer.label)));
    const labels = PROFILE_EXPORT_SECTIONS.find(section => section.title === title)!.fields.map(field => field.label).filter(label => included.has(label));
    const widths = [18, 30, 19, 16, ...labels.map(() => 32)];
    sheet.columns = widths.map(width => ({width}));
    sheet.mergeCells(1, 1, 1, widths.length);
    const banner = sheet.getCell('A1');
    banner.value = `Approved profiles · ${title} · ${report.profiles.length} ${report.profiles.length === 1 ? 'profile' : 'profiles'}` + (report.scope ? `\n${report.scope}` : '');
    banner.font = {bold:true,size:14,color:{argb:'FF'+navy}};
    banner.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF'+mist}};
    banner.alignment = {vertical:'middle',indent:1,wrapText:true}; sheet.getRow(1).height = report.scope ? 48 : 32;
    const header = sheet.addRow(['Registration No.', 'Youth profile', 'Reporting date', 'Review status', ...labels]);
    header.height = 56;
    header.eachCell(cell => {
      cell.font = {bold:true,color:{argb:'FFFFFFFF'}};
      cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FF'+blue}};
      cell.alignment = {wrapText:true,vertical:'middle'};
    });
    for (const profile of report.profiles) {
      const answers = new Map(profile.sections[index].answers.map(answer => [answer.label, answer.value]));
      const values = [profile.registrationNo, profile.name, profile.reportingDate, 'Approved', ...labels.map(label => answers.get(label) ?? 'Not applicable')];
      const row = sheet.addRow(values);
      row.eachCell(cell => {
        cell.numFmt = '@'; cell.alignment = {wrapText:true,vertical:'top'};
        cell.font = {color:{argb:'FF'+navy}};
        if (row.number % 2 === 0) cell.fill = {type:'pattern',pattern:'solid',fgColor:{argb:'FFF5F8FC'}};
        cell.border = {bottom:{style:'hair',color:{argb:'FFD4E2F0'}}};
      });
      row.height = Math.min(409, Math.max(27, ...values.map((value, column) =>
        value.split('\n').reduce((lines, line) => lines + Math.max(1, Math.ceil(line.length / (widths[column] - 4))), 0) * 15 + 9)));
    }
    sheet.autoFilter = {from:{row:2,column:1},to:{row:sheet.rowCount,column:widths.length}};
    sheet.pageSetup.printTitlesRow = '1:2';
    sheet.pageSetup.printTitlesColumn = 'A:B';
    sheet.headerFooter.oddFooter = '&LPrivate staff export&RPage &P of &N';
  }
  return new Uint8Array(await book.xlsx.writeBuffer());
}

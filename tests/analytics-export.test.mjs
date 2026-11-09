import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';
import ExcelJS from 'exceljs';

const root = fileURLToPath(new URL('../', import.meta.url));
const qa = join(root, '.impeccable', 'review', 'export-qa');
await mkdir(qa, { recursive: true });
const temp = await mkdtemp(join(qa, 'modules-'));
try {
  for (const [name, source] of Object.entries({ fields: 'profiling/fields', validation: 'profiling/validation', presentationWorkflow: 'demo/presentationWorkflow', registryData: 'demo/registryData', analyticsOverview: 'demo/analyticsOverview', analyticsSamples: 'demo/analyticsSamples', analyticsReport: 'demo/analyticsReport', analyticsReportFiles: 'demo/analyticsReportFiles', registryRoster: 'demo/registryRoster', registryRosterFiles: 'demo/registryRosterFiles' })) {
    const text = await readFile(join(root, 'src', `${source}.ts`), 'utf8');
    const compiled = ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/from ['"](?:\.\.\/profiling\/|\.\/)(fields|validation|presentationWorkflow|registryData|analyticsOverview|analyticsReport|registryRoster)['"]/g, "from './$1.mjs'");
    await writeFile(join(temp, `${name}.mjs`), compiled);
  }
  const { buildAnalyticsReport, EXPORT_MODULES, analyticsReportFilename } = await import(pathToFileURL(join(temp, 'analyticsReport.mjs')).href);
  const { analyticsExcel, analyticsPdf } = await import(pathToFileURL(join(temp, 'analyticsReportFiles.mjs')).href);
  const { analyticsSamples } = await import(pathToFileURL(join(temp, 'analyticsSamples.mjs')).href);
  const { analyticsSummary, analyticsMetricLabel, reportWindow, selectedApproved } = await import(pathToFileURL(join(temp, 'analyticsOverview.mjs')).href);
  const { approvedRosterRecords, buildRegistryRoster, ROSTER_COLUMNS } = await import(pathToFileURL(join(temp,'registryRoster.mjs')).href);
  const { rosterExcel, rosterPdf } = await import(pathToFileURL(join(temp,'registryRosterFiles.mjs')).href);
  const { registryRecords, registryFixtures } = await import(pathToFileURL(join(temp,'registryData.mjs')).href);
  const date = '2026-10-15';
  const selection = { year: '2026', period: 'full', band: 'All age groups' };
  const samples = analyticsSamples(date);
  const generated = '2026-10-15T14:00:00.000Z';
  const all = EXPORT_MODULES.map(module => module.id);
  const report = buildAnalyticsReport(samples, selection, all, date, generated);


  const rosterFilters={year:'2026',period:'Q1',band:'All age groups',query:''};
  const rosterFixture={key:'approved-one',kkNumber:'0001',name:'Fictional Name',band:'Core Youth',education:'College Graduate',status:'Approved (demo)',answers:{rbiNumber:'PRIVATE-RBI',contactNumber:'PRIVATE-PHONE',birthdate:'PRIVATE-BIRTHDAY'},history:[{action:'Profile submitted',at:'2025-12-31T18:00:00Z',actor:'Synthetic youth',note:''}]};
  const rosterRecords=[rosterFixture,{...rosterFixture,key:'pending',status:'For review'},{...rosterFixture,key:'undated',history:[]},{...rosterFixture,key:'other-quarter',history:[{action:'Profile submitted',at:'2026-04-01T00:00:00Z'}]}];
  test('dated registry examples cover all offered years and quarters and survive review', () => {
    const records=registryRecords([],{});
    assert.equal(new Set(records.map(row=>row.kkNumber)).size,records.length);
    for(const year of ['2024','2025','2026']) {
      const annual=approvedRosterRecords(records,{...rosterFilters,year,period:'full'},'2026-10-16');
      const quarters=['Q1','Q2','Q3','Q4'].map(period=>approvedRosterRecords(records,{...rosterFilters,year,period},'2026-10-16'));
      assert.equal(annual.length,4);assert.equal(quarters.flat().length,annual.length);
      quarters.forEach((rows,index)=>{assert.equal(rows.length,1);const at=rows[0].history[0].at;assert.equal(at.slice(0,4),year);assert.equal(Math.ceil(Number(at.slice(5,7))/3),index+1);});
    }
    const seed=registryFixtures.find(row=>row.key==='fixture-charlie');
    const reviewed=registryRecords([],{[seed.key]:{status:'Approved (demo)',note:'Demo review',history:[{action:'Approved (demo)',at:'2026-10-16T09:00:00+08:00',actor:'Synthetic staff',note:''}]}});
    assert.equal(approvedRosterRecords(reviewed,rosterFilters,'2026-10-16')[0].key,seed.key);
    assert.equal(reviewed.find(row=>row.key===seed.key).history[0].at,seed.history[0].at);
    assert.equal(approvedRosterRecords(records,{...rosterFilters,period:'Q4'},'2026-10-01').length,0);
  });
  test('approved rosters use first submission in Philippine time and never include pending, hidden or undated rows in a period',()=>{
    assert.deepEqual(approvedRosterRecords(rosterRecords,rosterFilters,'2026-10-16').map(row=>row.key),['approved-one']);
    assert.equal(approvedRosterRecords(rosterRecords,{...rosterFilters,year:'all'},'2026-10-16').length,3);
    assert.equal(approvedRosterRecords(rosterRecords,{...rosterFilters,period:'Q2'},'2026-10-16')[0].key,'other-quarter');
    assert.equal(approvedRosterRecords(rosterRecords,{...rosterFilters,query:'0001'},'2026-10-16').length,1);
    assert.equal(approvedRosterRecords(rosterRecords,{...rosterFilters,band:'Young Adult'},'2026-10-16').length,0);
    assert.equal(approvedRosterRecords(rosterRecords,{...rosterFilters,period:'Q4'},'2026-01-01').length,0);
    const columns=ROSTER_COLUMNS.map(column=>column.id);
    const model=buildRegistryRoster(rosterRecords,rosterFilters,['approved-one','pending','undated'],columns,'2026-10-16',generated);
    assert.equal(model.count,1); assert.deepEqual(model.rows[0],['0001','Fictional Name','Core Youth','College Graduate','2026-01-01','Approved (demo)']);
    for(const secret of ['PRIVATE-RBI','PRIVATE-PHONE','PRIVATE-BIRTHDAY'])assert.ok(!JSON.stringify(model).includes(secret));
    const narrow=buildRegistryRoster(rosterRecords,rosterFilters,null,['kk'],'2026-10-16',generated);assert.deepEqual(narrow.rows,[['0001']]);
    assert.throws(()=>buildRegistryRoster(rosterRecords,rosterFilters,[],columns,'2026-10-16'),/No approved/);
    assert.throws(()=>buildRegistryRoster(rosterRecords,rosterFilters,null,[],'2026-10-16'),/column/);
  });
  test('approved roster PDF and Excel preserve identifiers and literal text, with only chosen columns',async()=>{
    const values=buildRegistryRoster([...rosterRecords,{...rosterFixture,key:'literal',name:'=Fictional formula-like name'}],rosterFilters,null,ROSTER_COLUMNS.map(column=>column.id),'2026-10-16',generated);
    const bytes=await rosterExcel(values);await writeFile(join(qa,'approved-roster.xlsx'),bytes);
    const book=new ExcelJS.Workbook();await book.xlsx.load(bytes);const sheet=book.getWorksheet('Approved youth');
    assert.equal(sheet.getCell('A7').value,'0001');assert.equal(sheet.getCell('B8').value,'=Fictional formula-like name');assert.equal(sheet.getCell('B8').type,ExcelJS.ValueType.String);
    assert.equal(sheet.getCell('E7').value,'2026-01-01');assert.equal(sheet.columnCount,6);assert.equal(sheet.views[0].ySplit,6);
    const pdf=await rosterPdf(values);assert.equal(Buffer.from(pdf.slice(0,5)).toString(),'%PDF-');await writeFile(join(qa,'approved-roster.pdf'),pdf);
    const single=buildRegistryRoster(rosterRecords,rosterFilters,null,['kk'],'2026-10-16',generated);const one=new ExcelJS.Workbook();await one.xlsx.load(await rosterExcel(single));assert.equal(one.worksheets[0].columnCount,1);assert.equal(one.worksheets[0].getCell('A7').value,'0001');
  });

  test('export respects timeframe, age, module selection and aggregate-only boundaries', () => {
    const rows = [
      { key: 'private-id', name: 'DO_NOT_EXPORT_NAME', education: 'College Graduate', band: 'Core Youth', status: 'Approved (demo)', answers: { isOsy: 'Yes', gender: 'Female', civilStatus: 'Single', rbiNumber: 'SECRET-RBI', contactNumber: '+639991112222', suggestions: '=HYPERLINK("secret")' }, history: [{ action: 'Profile submitted', at: '2026-02-01T00:00:00Z' }] },
    ];
    rows.push({ ...rows[0], status: 'For review' }, { ...rows[0], band: 'Young Adult' }, { ...rows[0], history: [{action:'Profile submitted',at:'2025-02-01T00:00:00Z'}] });
    const single = buildAnalyticsReport(rows, {year:'2026',period:'Q1',band:'Core Youth'}, ['osy'], date, generated);
    assert.equal(single.count,1);
    assert.deepEqual(single.sections.map(row=>row.key),['osy']);
    assert.deepEqual(single.sections[0].matrix.find(row=>row[0]==='OSY'),['OSY',0,1,0,1]);
    assert.equal(single.summary.find(row=>row.label==='Out of school rate').value,1);
    assert.equal(single.summary.find(row=>row.label==='Employment share'),undefined);
    for (const privateText of ['DO_NOT_EXPORT_NAME','SECRET-RBI','+639991112222','HYPERLINK','private-id']) assert.ok(!JSON.stringify(single).includes(privateText));
    assert.throws(()=>buildAnalyticsReport(rows,selection,[],date),/Select at least/);
    assert.throws(()=>buildAnalyticsReport(rows,{...selection,year:'2030'},all,date),/valid report/);
    assert.equal(analyticsReportFilename(single,'xlsx'),'sk-digitalipapa-youth-2026-Q1-core-youth.xlsx');
  });

  test('all export sections reconcile monthly totals and preserve unknown/future values', () => {
    assert.equal(report.sections.length,9);
    assert.equal(report.count,48);
    for (const section of report.sections.filter(row=>row.key!=='cross')) {
      for (const values of section.matrix) {
        assert.equal(values.slice(1,-1).reduce((sum,value)=>sum+(typeof value==='number'?value:0),0),values.at(-1));
        assert.deepEqual(values.slice(-3,-1),['—','—']);
      }
    }
    const cross=report.sections.find(row=>row.key==='cross');
    assert.equal(cross.matrix.reduce((sum,row)=>sum+row.at(-1),0),48);
    assert.ok(report.sections.find(row=>row.key==='civic').note.includes('One profile can count toward more than one activity.'));
    assert.ok(report.sections.every(row=>row.insights.length>0));
    const empty=buildAnalyticsReport(samples,{...selection,period:'Q4',band:'Child Youth'},['osy'], '2026-01-01',generated);
    assert.equal(empty.count,0);
    assert.ok(empty.through.includes('not started'));
    assert.ok(empty.sections[0].matrix.every(row=>row.slice(1,-1).every(value=>value==='—')));
  });

  test('saved Analytics exports use the same headline labels, values and context as the screen', () => {
    const saved = buildAnalyticsReport(samples, selection, all, date, generated, true);
    assert.deepEqual(saved.summary, analyticsSummary(selectedApproved(samples, selection, date), reportWindow(selection, date), true));
    assert.equal(saved.summary.at(-1).label, 'New profiles · Oct');
    assert.equal(saved.summary[1].context, '13 of 48 known OSY answers');
    assert.equal(analyticsMetricLabel(saved.summary[1]), '27%');
    assert.match(saved.notice, /saved approved profiles/);
    assert.equal(saved.sections[0].matrix[0][0], 'Child Youth (15–17)');
  });

  test('Excel output reopens with numeric shares, selected sheets and no raw records', async () => {
    const bytes=await analyticsExcel(report);
    await writeFile(join(qa,'all-modules.xlsx'),bytes);
    const workbook=new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
    assert.deepEqual(workbook.worksheets.map(sheet=>sheet.name),['Summary','Age groups','Gender','Civil status','School status','Civic participation','Work status','Education','Program preferences','Education by age']);
    const osy=workbook.getWorksheet('School status');
    let found=false; osy.eachRow(row=>{ if(row.getCell(1).value==='OSY'&&row.getCell(4).value===48){ found=true; assert.equal(row.getCell(2).value,13); assert.equal(row.getCell(3).value,13/48); assert.equal(row.getCell(3).numFmt,'0.0%'); } });
    assert.ok(found); assert.equal(osy.views[0].state,'frozen');
    const monthly = osy.getRows(1, osy.rowCount).find(row => row.getCell(1).value === 'Month');
    assert.deepEqual(monthly.values.slice(1), ['Month', 'Not OSY', 'OSY', 'Not provided']);
    assert.equal(osy.getRow(monthly.number + 13).getCell(1).value, 'Period total');
    assert.equal(osy.getRow(monthly.number + 13).getCell(3).value, 13);
    const narrow=buildAnalyticsReport(samples,{...selection,period:'Q1'},['osy'],date,generated);
    const narrowWorkbook=new ExcelJS.Workbook(); await narrowWorkbook.xlsx.load(await analyticsExcel(narrow));
    assert.deepEqual(narrowWorkbook.worksheets.map(sheet=>sheet.name),['Summary','School status']);
    const empty=buildAnalyticsReport([],selection,all,date,generated);
    const emptyBytes=await analyticsExcel(empty); await writeFile(join(qa,'empty.xlsx'),emptyBytes);
    const emptyWorkbook=new ExcelJS.Workbook(); await emptyWorkbook.xlsx.load(emptyBytes);
    assert.equal(emptyWorkbook.worksheets.length,10);
  });

  test('PDF files have real PDF bytes for full, quarter and empty selections', async () => {
    for(const [name, value] of [['all-modules',report],['quarter',buildAnalyticsReport(samples,{year:'2025',period:'Q2',band:'Core Youth'},['osy','educationWork'],date,generated)],['empty',buildAnalyticsReport([],selection,['cross','osy'],date,generated)]]) {
      const bytes=await analyticsPdf(value);
      assert.equal(Buffer.from(bytes.slice(0,5)).toString(),'%PDF-');
      assert.ok(bytes.length>1000);
      await writeFile(join(qa,`${name}.pdf`),bytes);
    }
  });
} finally { await rm(temp, { recursive:true, force:true }); }

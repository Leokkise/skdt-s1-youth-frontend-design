import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
import QRCode from 'qrcode';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 's1-insight-tests-'));
try {
  for (const [name, path] of Object.entries({ fields: 'profiling/fields', validation: 'profiling/validation', presentationWorkflow: 'demo/presentationWorkflow', registryData: 'demo/registryData', staffInsights: 'demo/staffInsights', analyticsSamples: 'demo/analyticsSamples', analyticsOverview: 'demo/analyticsOverview', demoQrPayload: 'demo/demoQrPayload' })) {
    const source = await readFile(new URL(`../src/${path}.ts`, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace(/from ['"](?:\.\.\/profiling\/|\.\/)(fields|validation|registryData|presentationWorkflow|analyticsOverview)['"]/g, "from './$1.mjs'");
    await writeFile(join(directory, `${name}.mjs`), compiled);
  }
  const { initialRecords } = await import(pathToFileURL(join(directory, 'registryData.mjs')).href);
  const { distribution, filterRecords, staffInsights, aggregateCsv, filterPeriod, submissionPeriod, periodOptions, periodLabel, narrativeInsights, previousPeriod, comparePeriods, comparisonInsights, monthlyComparison } = await import(pathToFileURL(join(directory, 'staffInsights.mjs')).href);
  const { analyticsSamples } = await import(pathToFileURL(join(directory, 'analyticsSamples.mjs')).href);
  const { expandedPlanningInsights, educationAgeInsights, monthlyPlotGeometry, programCategories, planningAnalysis, educationAgeRows, communityInsights, civicAnswer, selectedApproved, demographicRows, demographicMonths, overviewMetrics, strategicInsights, demographicInsight, agePlanningInsight, monthlyInsight, monthlyBarSeries, reportWindow } = await import(pathToFileURL(join(directory, 'analyticsOverview.mjs')).href);
  const { demoQrFields, demoQrProfile, demoQrText } = await import(pathToFileURL(join(directory, 'demoQrPayload.mjs')).href);
  const date = '2026-10-07';
  const response = { key: 'sample-online', name: 'Fictional Online', band: 'Core Youth', education: 'College Graduate', status: 'For review', answers: { workStatus: 'Working Student', skVoter: '', kkAttendance: '', organization: '', suggestions: 'Fictional activity' }, history: [{ action: 'Profile submitted', actor: 'Synthetic youth', at: '2026-10-07T01:00:00Z', note: '' }] };
  const walkIn = { ...response, key: 'sample-walkin', name: 'Fictional Walkin', status: 'Approved (demo)', history: [{ action: 'Walk-in profile submitted', actor: 'Synthetic staff', at: '2026-10-07T02:00:00Z', note: '' }] };



  test('key comparisons handle ties, completed months, overlap and missing paired answers', () => {
    const selection={year:'2026',period:'full',band:'All age groups'};
    const make=(month,gender,band='Core Youth')=>({...walkIn,band,education:'College Graduate',answers:{gender,education:'College Graduate',isOsy:'Yes',skVoter:'Yes',kkAttendance:'No'},history:[{action:'Profile submitted',at:'2026-'+month+'-05T00:00:00Z'}]});
    const rows=[make('01','Male'),make('01','Male'),make('02','Female'),make('02','Female'),make('02','Female'),...Array.from({length:8},()=>make('10','Male'))];
    const insights=expandedPlanningInsights(rows,'gender',selection,'2026-10-07');
    assert.ok(insights.find(x=>x.title==='Busiest completed month').text.includes('Feb had 3 submissions, 1 more than Jan'));
    assert.ok(insights.find(x=>x.title==='The leading category changed').text.includes('Female led in Feb'));
    assert.ok(insights.find(x=>x.title==='Comparison limits').text.includes('Current and future months'));
    const tied=expandedPlanningInsights([make('01','Male'),make('01','Female')],'gender',selection,'2026-10-07');
    assert.ok(tied.find(x=>x.title==='No single leading category').text.includes('tied at 1'));
    for(const group of ['age','gender','civil','osy','civic','programs','work','education']) {
      assert.equal(expandedPlanningInsights([],group,selection,date).length,1);
      assert.ok(!JSON.stringify(expandedPlanningInsights(rows,group,selection,date)).match(/NaN|Infinity|undefined/));
    }
    const cross=educationAgeInsights([make('01','Male'),make('01','Female','Young Adult'),{...walkIn,band:'Unknown',education:'',answers:{}}]);
    assert.ok(cross[0].text.includes('Core Youth')&&cross[0].text.includes('Young Adult'));
    assert.ok(cross[0].text.includes('100.0%'));
    assert.ok(cross.find(x=>x.title==='Comparison limits').text.includes('1 of 3'));
    assert.equal(educationAgeInsights([]).length,1);
    const civic=expandedPlanningInsights([
      {...walkIn,answers:{skVoter:'Yes',kkAttendance:'Yes'}},
      {...walkIn,answers:{skVoter:'Yes',kkAttendance:'No'}},
      {...walkIn,answers:{skVoter:'No',kkAttendance:'No'}}
    ],'civic',selection,'2026-11-08');
    const attendance=civic.find(x=>x.title==='Attendance across voter groups');
    assert.ok(attendance.text.includes('50.0%')&&attendance.text.includes('1/2')&&attendance.text.includes('0/1'));
  });
  test('insights compare monthly shares and distinguish job seeking from unemployment',()=>{
    const selection={year:'2026',period:'full',band:'All age groups'};
    const make=(month,gender,workStatus='Employed',isOsy='No')=>({...walkIn,answers:{gender,workStatus,isOsy},history:[{action:'Profile submitted',at:'2026-'+month+'-05T00:00:00Z'}]});
    const rows=[...Array.from({length:10},()=>make('01','Male')),...Array.from({length:5},()=>make('02','Male')),...Array.from({length:15},()=>make('02','Female'))];
    const result=expandedPlanningInsights(rows,'gender',selection,'2026-11-08');
    const share=result.find(x=>x.title==='A change in the monthly mix');
    assert.ok(share.text.includes('one month alone may not represent'));
    assert.ok(share.text.includes('10/10')||share.text.includes('15/20'));
    assert.ok(result.filter(item=>item.title!=='Comparison limits').length<=4);
    const work=expandedPlanningInsights([make('01','Male','Currently looking for a Job','Yes'),make('01','Female','Unemployed','No')],'work',selection,'2026-11-08');
    assert.ok(work.find(x=>x.title==='Where work and learning support overlap').text.includes('1 of 1 job-seeking'));
    const osy=expandedPlanningInsights([make('01','Male','Employed','Yes'),{...walkIn,answers:{}}],'osy',selection,'2026-11-08');
    assert.ok(osy[0].text.includes('1 of 1 known'));
    const small=expandedPlanningInsights(rows.slice(0,5),'gender',selection,'2026-11-08');
    assert.ok(!small.some(x=>x.title==='A change in the monthly mix'));
  });
  test('grouped plot reserves the value axis and keeps edge bars inside the plot', () => {
    for (const [groups,width,categories] of [[4,740,3],[12,1800,15],[3,600,1],[1,600,8],[0,600,3]]) {
      const plot = monthlyPlotGeometry(groups,width);
      for (let index=0;index<groups;index++) {
        const half = plot.groupWidth(categories)/2;
        assert.ok(plot.x(index)-half >= plot.left + 9);
        assert.ok(plot.x(index)+half <= plot.right - 9);
        assert.ok(plot.band(index).left >= plot.left);
      }
    }
  });

  test('program themes overlap honestly and education cross-tabs reconcile', () => {
    const rows = [ { ...walkIn, band: 'Core Youth', education: 'College Graduate', answers: { suggestions: 'Skills training and sports', workStatus: 'Employed' } }, { ...walkIn, band: 'Young Adult', education: '', answers: {suggestions: 'Something different'} } ];
    assert.deepEqual(programCategories(rows[0]), ['Skills/Livelihood', 'Sports']);
    assert.deepEqual(programCategories(rows[1]), ['Unclassified suggestion']);
    assert.deepEqual(programCategories({...walkIn, answers: {}}), []);
    assert.equal(demographicRows(rows, 'programs').find(row => row.label === 'Sports').count, 1);
    const cross = educationAgeRows(rows);
    assert.equal(cross.reduce((sum,row) => sum + row.counts.reduce((a,b)=>a+b,0),0),2);
    assert.deepEqual(cross.find(row => row.label === 'Not provided').counts,[0,0,1]);
    assert.ok(planningAnalysis(rows,'programs').includes('No budget data'));
    assert.ok(planningAnalysis(rows,'work').includes('does not demonstrate individuals'));
    for (const group of ['work','education','programs']) {
      const monthly = demographicMonths(rows,group,{year:'2026',period:'Q4',band:'All age groups'},date);
      assert.deepEqual(monthly[0].counts,demographicRows(rows,group).map(row=>row.count));
      assert.equal(monthly[1].observed,false);
    }
  });

  test('OSY unknowns and overlapping civic counts use honest denominators and paired participation', () => {
    const rows = [
      { ...walkIn, band: 'Core Youth', answers: { isOsy: 'Yes', skVoter: 'Yes', kkAttendance: 'No', election2023: 'Yes, I voted' } },
      { ...walkIn, answers: { isOsy: 'No', skVoter: 'Yes', kkAttendance: 'Yes', election2023: 'not sure' } },
      { ...walkIn, answers: {} },
    ];
    assert.deepEqual(demographicRows(rows, 'osy').map(r => r.count), [1,1,1]);
    assert.deepEqual(demographicRows(rows, 'civic').map(r => r.count), [2,0,1,1]);
    assert.equal(civicAnswer(rows[1], 'election2023'), null);
    assert.ok(communityInsights(rows, 'civic')[0].text.includes('1 (50%)'));
    assert.ok(communityInsights(rows, 'osy')[0].text.includes('1 of 2'));
    assert.ok(communityInsights([], 'osy')[0].text.includes('Choose another'));
    const months = demographicMonths(rows, 'civic', {year: '2026', period: 'Q4', band: 'All age groups'}, date);
    assert.deepEqual(months[0].counts, [2,0,1,1]);
    assert.equal(months[1].observed, false);
  });

  test('filtered report denominators, missing answers and empty groups are accurate', () => {
    const records = filterRecords([...initialRecords, response, walkIn], 'Core Youth', 'For review');
    assert.equal(records.length, 3);
    const insights = staffInsights(records, date);
    assert.equal(insights.work.reduce((sum, row) => sum + row.count, 0), 3);
    assert.equal(insights.skVoter.find(row => row.label === 'Not provided').count, 1);
    assert.equal(insights.assembly.find(row => row.label === 'Not provided').count, 1);
    assert.equal(insights.suggestions, 3);
    assert.equal(insights.organizations, 2);
    assert.ok(Math.abs(insights.work.reduce((sum, row) => sum + row.percent, 0) - 100) < 0.0001);
    assert.deepEqual(staffInsights([], date).activity, []);
    assert.deepEqual(distribution([]), []);
    assert.deepEqual(filterRecords([response], 'Child Youth', 'All statuses'), []);
  });
  test('sources and chronological activity do not invent starter history or attendance', () => {
    const insights = staffInsights([...initialRecords, response, walkIn], date);
    assert.equal(insights.source.find(row => row.label === 'Starter sample').count, 6);
    assert.equal(insights.source.find(row => row.label === 'Online submission').count, 1);
    assert.equal(insights.source.find(row => row.label === 'Walk-in submission').count, 1);
    assert.equal(insights.activity.length, 2);
    assert.equal(insights.activity[0].key, 'sample-walkin');
    assert.equal(insights.activity[1].action, 'Profile submitted');
  });
  test('periods use first submission in Philippine time; undated samples and OSY unknowns stay honest', () => {
    const boundary = { ...response, history: [{ action: 'Profile submitted', at: '2026-03-31T16:01:00Z' }, { action: 'Corrections submitted', at: '2027-01-01T00:00:00Z' }] };
    assert.equal(submissionPeriod(boundary, 'Quarterly'), '2026 Q2');
    assert.equal(submissionPeriod(boundary, 'Yearly'), '2026');
    assert.equal(submissionPeriod(initialRecords[0], 'Yearly'), null);
    assert.equal(filterPeriod([...initialRecords, boundary], 'Yearly', '2026').length, 1);
    assert.equal(filterPeriod([boundary], 'Quarterly', '2026 Q1').length, 0);
    assert.equal(filterPeriod(initialRecords, 'All time', 'All periods').length, 6);
    assert.equal(staffInsights([response], date).osy[0].label, 'Not provided');
    assert.equal(staffInsights([{ ...response, answers: { isOsy: 'Yes', osyFrom: '2020', osyTo: '2024' } }], date).osyYears[0].label, '2020–2024');
    assert.ok(narrativeInsights([], date)[0].includes('No profiles'));
    assert.ok(narrativeInsights([response], date).some(text => text.includes('0 of 1 profiles')));
  });
  test('calendar quarters cover all months and offer empty quarters without inventing records', () => {
    for (let month = 1; month <= 12; month++) {
      const record = { ...response, history: [{ action: 'Profile submitted', at: `2026-${String(month).padStart(2, '0')}-01T00:00:00+08:00` }] };
      assert.equal(submissionPeriod(record, 'Quarterly'), `2026 Q${Math.ceil(month / 3)}`);
    }
    assert.deepEqual(periodOptions(initialRecords, 'Quarterly', date), ['2026 Q1', '2026 Q2', '2026 Q3', '2026 Q4']);
    assert.deepEqual(periodOptions(initialRecords, 'Yearly', date), ['2026']);
    assert.equal(filterPeriod(initialRecords, 'Quarterly', '2026 Q1').length, 0);
    assert.equal(periodLabel('2026 Q1'), '2026 · Q1 (January–March)');
    assert.equal(periodLabel('2026 Q2'), '2026 · Q2 (April–June)');
    assert.equal(periodLabel('2026 Q3'), '2026 · Q3 (July–September)');
    assert.equal(periodLabel('2026 Q4'), '2026 · Q4 (October–December)');
    assert.equal(periodLabel('2026'), '2026');
  });
  test('sample CSV exports aggregate rows, valid percentages and escapes formula-like labels', () => {
    const csv = aggregateCsv([{ title: 'Work status', rows: distribution(['Student', 'Student', 'Employed']) }, { title: 'Safety', rows: [{ label: '=danger,"quoted"', count: 1, percent: 100 / 3 }] }], 3);
    assert.ok(csv.startsWith('\ufeff"Data scope"'));
    assert.ok(csv.includes('"Student","2","66.7","3"'));
    assert.ok(csv.includes('"\'=danger,""quoted"""'));
    assert.ok(csv.includes('FICTIONAL DEMO ONLY'));
    for (const privateField of ['RBI', 'birthdate', 'address', 'Fictional Online', 'sample-online']) assert.ok(!csv.includes(privateField));
  });
  test('new overview limits every demographic to approved, dated profiles in the selected quarter and age band', () => {
    const selection = { year: '2026', period: 'Q1', band: 'Core Youth' };
    const dated = (at, overrides = {}) => ({ ...response, status: 'Approved (demo)', history: [{ action: 'Profile submitted', at }], ...overrides });
    const january = dated('2025-12-31T16:01:00Z');
    const april = dated('2026-03-31T16:01:00Z');
    const pending = dated('2026-01-01T00:00:00Z', { status: 'For review' });
    const child = dated('2026-01-01T00:00:00Z', { band: 'Child Youth' });
    assert.deepEqual(selectedApproved([january, april, pending, child, ...initialRecords], selection, date), [january]);
    assert.equal(selectedApproved([january], { ...selection, period: 'full' }, '2026-01-01').length, 1);
    for (let quarter = 1; quarter <= 4; quarter++) {
      const window = reportWindow({ ...selection, period: `Q${quarter}` }, date);
      assert.equal(window.first, (quarter - 1) * 3 + 1);
      assert.equal(window.last - window.first, 2);
    }
    assert.equal(reportWindow({ ...selection, period: 'full' }, date).through, date);
  });
  test('demographic charts retain zero categories, unknown answers and monthly totals without inventing future points', () => {
    const selection = { year: '2026', period: 'full', band: 'All age groups' };
    const samples = selectedApproved(analyticsSamples(date), selection, date);
    assert.ok(samples.length > 0);
    for (const group of ['age', 'gender', 'civil']) {
      assert.equal(demographicRows([], group).length, group === 'civil' ? 6 : 3);
      const totals = demographicRows(samples, group);
      assert.equal(totals.reduce((sum, row) => sum + row.count, 0), samples.length);
      const monthly = demographicMonths(samples, group, selection, date);
      assert.equal(monthly.length, 12);
      totals.forEach((row, index) => assert.equal(monthly.reduce((sum, month) => sum + month.counts[index], 0), row.count));
      assert.equal(monthly[10].observed, false);
      assert.ok(monthly[10].counts.every(count => count === 0));
    }
    const unknown = { ...samples[0], answers: { civilStatus: 'Unknown value' } };
    assert.equal(demographicRows([unknown], 'civil').find(row => row.label === 'Not provided').count, 1);
    assert.ok(monthlyInsight([], 'age', selection, date).includes('No monthly pattern'));
    assert.ok(demographicInsight([], 'gender').includes('No approved profiles'));
  });
  test('planning insights use known-answer rates and avoid conclusions from empty or missing data', () => {
    const yes = { ...response, answers: { isOsy: 'Yes', workStatus: 'Working Student', nationalVoter: 'Yes', kkAttendance: 'No', age: '17' } };
    const no = { ...response, answers: { isOsy: 'No', workStatus: 'Student', nationalVoter: 'Yes', kkAttendance: 'Yes' } };
    const missing = { ...response, answers: {} };
    const metrics = overviewMetrics([yes, no, missing]);
    assert.equal(metrics.osy.known, 2);
    assert.equal(metrics.osy.value, 50);
    assert.equal(metrics.employment.value, 50);
    assert.equal(metrics.employment.known, 2);
    assert.equal(overviewMetrics([missing]).osy.value, null);
    const insights = strategicInsights([yes, no, missing]);
    assert.ok(insights[0].text.includes('Ask these youth about barriers'));
    assert.ok(insights[1].text.includes('Registration is stronger than assembly involvement'));
    assert.ok(insights[2].text.includes('at profiling'));
    assert.equal(strategicInsights([])[0].title, 'No findings yet');
    assert.ok(strategicInsights([missing])[0].text.includes('missing'));
    const disjointCivicAnswers = [{ ...response, answers: { nationalVoter: 'Yes' } }, { ...response, answers: { kkAttendance: 'No' } }];
    assert.ok(strategicInsights(disjointCivicAnswers)[1].text.includes('Civic answers are incomplete'));
    assert.ok(demographicInsight([missing], 'civil').includes('answers are missing'));
  });
  test('age planning uses each group denominator, flags missing ages and handles ties without a false forecast', () => {
    const makeGroup = (band, total, boundaryCount, boundaryAge, otherAge) => Array.from({ length: total }, (_, index) => ({ ...response, band, answers: { age: String(index < boundaryCount ? boundaryAge : otherAge) } }));
    const records = [...makeGroup('Child Youth', 18, 5, 17, 16), ...makeGroup('Core Youth', 42, 10, 24, 20), ...makeGroup('Young Adult', 30, 6, 30, 27)];
    const insight = agePlanningInsight(records);
    assert.ok(insight.finding.includes('Core Youth (18–24) is the largest group: 42 of 90 (47%)'));
    assert.deepEqual(insight.boundaries.map(group => [group.count, group.total, Math.round(group.percent)]), [[5, 18, 28], [10, 42, 24], [6, 30, 20]]);
    assert.equal(insight.missing, 0);
    assert.ok(insight.action.includes('Check current birthdays'));
    const withMissing = agePlanningInsight([...records, { ...response, band: 'Child Youth', answers: {} }, { ...response, band: 'Young Adult', answers: { age: '31' } }]);
    assert.equal(withMissing.missing, 2);
    assert.equal(withMissing.boundaries[0].total, 19);
    assert.equal(withMissing.boundaries[0].count, 5);
    const tied = agePlanningInsight([...makeGroup('Child Youth', 2, 0, 17, 16), ...makeGroup('Core Youth', 2, 0, 24, 20)]);
    assert.ok(tied.finding.includes('tie for the largest group'));
    assert.ok(agePlanningInsight([]).finding.includes('No approved profiles'));
    assert.ok(agePlanningInsight([{ ...response, band: 'Child Youth', answers: {} }]).meaning.includes('ages are missing'));
  });
  test('grouped monthly bars show every category together and exclude future data', () => {
    const months = [{ month: 1, label: 'Jan', observed: true, counts: [1, 2, 0] }, { month: 2, label: 'Feb', observed: true, counts: [3, 4, 0] }, { month: 3, label: 'Mar', observed: false, counts: [999, 999, 999] }];
    const labels = ['Male', 'Female', 'LGBTQIA+'];
    const chart = monthlyBarSeries(months, labels);
    assert.deepEqual(chart.totals, [4, 6, 0]);
    assert.deepEqual(chart.values, [[1, 2, 0], [3, 4, 0], null]);
    assert.equal(chart.ceiling, 4);
    assert.equal(chart.values[0].length, labels.length);
    assert.deepEqual(monthlyBarSeries([], labels).totals, [0, 0, 0]);
    assert.equal(monthlyBarSeries([], labels).ceiling, 1);
    const selection = { year: '2026', period: 'Q1', band: 'All age groups' };
    const records = selectedApproved(analyticsSamples(date), selection, date);
    for (const group of ['age', 'gender', 'civil']) {
      const totals = demographicRows(records, group);
      const rows = demographicMonths(records, group, selection, date);
      assert.equal(rows.length, 3);
      totals.forEach((row, index) => {
        const chart = monthlyBarSeries(rows, totals.map(item => item.label));
        assert.equal(chart.totals[index], row.count);
        assert.equal(chart.values.reduce((sum, counts) => sum + (counts?.[index] || 0), 0), row.count);
        assert.ok(chart.values.every(counts => counts === null || counts.length === totals.length));
      });
    }
  });
  test('bar axes use round whole-count ticks for the visible monthly peak', () => {
    const labels = ['SK voter', 'National voter', 'Voted in SK election', 'KK assembly'];
    const rows = [
      { month: 1, label: 'Jan', observed: true, counts: [25, 150, 68, 200] },
      { month: 2, label: 'Feb', observed: true, counts: [10, 75, 0, 190] },
      { month: 3, label: 'Mar', observed: false, counts: [9999, 9999, 9999, 9999] },
    ];
    const all = monthlyBarSeries(rows, labels);
    assert.equal(all.tickStep, 50);
    assert.equal(all.ceiling, 200);
    assert.deepEqual(all.totals, [35, 225, 68, 390]);
    const focused = monthlyBarSeries(rows, labels, 0);
    assert.equal(focused.tickStep, 5);
    assert.equal(focused.ceiling, 25);
    assert.deepEqual(focused.totals, all.totals);

    for (const [peak, step, ceiling] of [[0, 1, 1], [1, 1, 1], [68, 20, 80], [201, 50, 250], [12345, 5000, 15000]]) {
      const chart = monthlyBarSeries([{ ...rows[0], counts: [peak] }], labels);
      assert.equal(chart.tickStep, step);
      assert.equal(chart.ceiling, ceiling);
    }
  });
  test('period comparison crosses years, respects first submissions and avoids zero-baseline percentages', () => {
    const record = (at, isOsy, key) => ({ ...response, key, answers: { isOsy }, history: [{ action: 'Profile submitted', at }, { action: 'Corrections submitted', at: '2026-05-01T00:00:00Z' }] });
    const rows = [record('2025-12-20T00:00:00Z', 'Yes', 'prior-1'), record('2025-12-21T00:00:00Z', 'No', 'prior-2'), record('2026-01-01T00:00:00Z', 'Yes', 'now-1'), record('2026-02-01T00:00:00Z', '', 'now-2'), record('2026-03-01T00:00:00Z', 'No', 'now-3')];
    assert.equal(previousPeriod('Quarterly', '2026 Q1'), '2025 Q4');
    assert.equal(previousPeriod('Yearly', '2026'), '2025');
    assert.equal(previousPeriod('Quarterly', 'All periods'), '');
    const comparison = comparePeriods(rows, 'Quarterly', '2026 Q1');
    assert.equal(comparison.currentCount, 3);
    assert.equal(comparison.previousCount, 2);
    assert.equal(comparison.difference, 1);
    assert.equal(comparison.change, 50);
    assert.equal(comparison.currentOsyRate, 50);
    assert.equal(comparison.previousOsyRate, 50);
    assert.equal(comparePeriods(rows, 'Yearly', '2026').currentCount, 3);
    assert.equal(comparePeriods(rows, 'Yearly', '2026').previousCount, 2);
    assert.equal(comparePeriods(rows, 'Quarterly', '2025 Q4').change, null);
    assert.ok(comparisonInsights(rows, 'Quarterly', '2025 Q4').some(text => text.includes('unavailable')));
    assert.ok(comparisonInsights([], 'Yearly', '2026').some(text => text.includes('known Yes/No')));
    assert.ok(comparisonInsights(rows, 'All time', 'All periods')[0].includes('Choose'));
  });
  test('illustrative history covers quarters and years without changing registry or future-month counts', () => {
    const original = JSON.stringify(initialRecords);
    const samples = analyticsSamples(date);
    assert.deepEqual(samples, analyticsSamples(date));
    assert.equal(JSON.stringify(initialRecords), original);
    assert.ok(samples.every(record => record.key.startsWith('illustration-') && !record.kkNumber));
    for (const year of ['2024', '2025']) {
      for (const quarter of [1, 2, 3, 4]) assert.ok(filterPeriod(samples, 'Quarterly', `${year} Q${quarter}`).length > 0);
      assert.ok(monthlyComparison(samples, Number(year)).every(row => row.current > 0));
    }
    const months = monthlyComparison(samples, 2026);
    assert.equal(months.length, 12);
    assert.equal(months.reduce((sum, row) => sum + row.current, 0), filterPeriod(samples, 'Yearly', '2026').length);
    assert.equal(months[10].current, 0);
    assert.equal(months[11].current, 0);
    assert.ok(staffInsights(samples, date).source.every(row => row.label === 'Illustrative history'));
    assert.ok(samples.every(record => record.history[0].at.slice(0, 10) <= date));
    const boundary = { ...response, history: [{ action: 'Profile submitted', at: '2025-12-31T16:01:00Z' }] };
    assert.equal(monthlyComparison([boundary], 2026)[0].current, 1);
    assert.equal(monthlyComparison([boundary], 2026)[11].previous, 0);
  });
  test('QR encoding preserves the fixed fictional basic information and disclaimer', () => {
    const code = QRCode.create(demoQrText, { errorCorrectionLevel: 'M' });
    const encoded = code.segments.map(segment => typeof segment.data === 'string' ? segment.data : Buffer.from(segment.data).toString('utf8')).join('');
    assert.equal(encoded, demoQrText);
    for (const [label, value] of demoQrFields) assert.ok(encoded.includes(`${label}: ${value}`));
    assert.ok(encoded.includes('Name: Alex Demo\nAge: 20\n'));
    assert.ok(encoded.includes('Not a real person'));
    assert.ok(demoQrText.includes('DEMO ONLY'));
    assert.ok(demoQrText.includes('NOT VALID FOR IDENTIFICATION OR EVENT CHECK-IN'));
    assert.ok(!/https?:|RBI|sample-online|example.invalid/.test(demoQrText));
  });
  test('QR fixture is immutable and excludes sensitive or session-derived fields', () => {
    assert.ok(Object.isFrozen(demoQrProfile));
    assert.deepEqual(Object.keys(demoQrProfile), ['name', 'age', 'ageGroup', 'barangay', 'education', 'workStatus']);
    for (const privateValue of ['birthdate', 'phone', 'email', 'address:', 'youthId', 'userId', 'data:image', 'SYNTHETIC YOUTH', 'sample-walkin']) assert.ok(!demoQrText.includes(privateValue));
    assert.ok(Buffer.byteLength(demoQrText, 'utf8') < 512);
  });
} finally { await rm(directory, { recursive: true, force: true }); }

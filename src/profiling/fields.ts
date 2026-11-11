export type Answers = Record<string, string>;
export type Field = {
  id: string; label: string; required?: boolean;
  type?: 'text' | 'date' | 'number' | 'tel' | 'textarea' | 'select' | 'checkbox';
  options?: string[]; hint?: string;
};
export const sections: { title: string; description: string; fields: Field[] }[] = [
  { title: 'Personal information', description: 'Start with the basic details about you.', fields: [
    { id: 'surname', label: 'Surname', required: true, hint: 'Example: DELA CRUZ' },
    { id: 'firstName', label: 'First name', required: true, hint: 'Example: JUAN MIGUEL' },
    { id: 'middleName', label: 'Middle name', hint: 'Example: RIZAL' },
    { id: 'suffix', label: 'Suffix', hint: 'Leave blank if none, e.g. Jr., III.' },
    { id: 'birthdate', label: 'Birthdate', type: 'date', required: true },
    { id: 'age', label: 'Age', type: 'number', required: true },
    { id: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female', 'LGBTQIA+'] },
    { id: 'lgbtqiaDetails', label: 'LGBTQIA+ community specification', hint: 'Example: Gay, Bisexual, etc.' },
    { id: 'civilStatus', label: 'Civil status', type: 'select', required: true, options: ['Single', 'Married', 'Live-in', 'Widowed', 'Separated', 'Annulled'] },
    { id: 'pwdDetails', label: 'For Person with Disability only, please specify', type: 'textarea', hint: "Note: Please leave it blank if you don't have any." },
  ] },
  { title: 'Household & residency', description: 'These answers do not automatically verify residency.', fields: [
    { id: 'contactNumber', label: 'Contact number', type: 'tel', required: true, hint: "Enter 10 digits starting with 9, or paste your 09 number. A guardian’s number is OK." },
    { id: 'houseNumber', label: 'House number', required: true },
    { id: 'street', label: 'Specific street', required: true, hint: 'Choose a Talipapa street suggestion or type the specific street.' },
    { id: 'subdivision', label: 'Subdivision / Village', hint: 'Choose a Talipapa subdivision / village, or leave blank if not applicable.' },
    { id: 'locality', label: 'Barangay / City', required: true, hint: 'This profiling form is restricted to Barangay Talipapa, Quezon City.' },
    { id: 'rbiNumber', label: 'Registry of Barangay Inhabitant (RBI) number', required: true, hint: 'Demo only: use a made-up reference, never a real RBI number.' },
    { id: 'headOfFamily', label: 'Name of head of the family', required: true, hint: 'Surname, First Name, Middle Initial' },
    { id: 'siblings', label: 'Name of siblings and their ages', type: 'textarea', hint: 'Add one row per sibling, or leave the blank row empty if not applicable.' },
    { id: 'ageGroup', label: 'Youth age group', type: 'select', required: true, options: ['Child Youth (15 - 17 yrs old)', 'Core Youth (18 - 24 yrs old)', 'Young Adult (25 - 30 yrs old)'] },
  ] },
  { title: 'Education & livelihood', description: 'Tell us about your studies and work.', fields: [
    { id: 'education', label: 'Educational attainment', type: 'select', required: true, options: ['Elementary Undergraduate', 'Elementary Graduate', 'High School Undergraduate', 'High School Graduate', 'Senior High School Undergraduate', 'Senior High School Completer', 'College Undergraduate', 'College Graduate', 'ALS Diploma (Elementary)', 'ALS Diploma (High School)', 'ALS Diploma (Senior High School)', 'Masters Level', 'Masters Graduate', 'Doctorate Level', 'Doctorate Graduate'] },
    { id: 'workStatus', label: 'Work status', type: 'select', required: true, options: ['Student', 'Working Student', 'Self-Employed', 'Employed', 'Unemployed', 'Business Owner', 'Currently looking for a Job', 'Not Interested in looking for a Job'] },
    { id: 'jobDescription', label: 'What is your Current Job / Business?', type: 'textarea', hint: "Note: For those youth who have a job, please leave it blank if you don't have work or businesses." },
    { id: 'income', label: 'Monthly income', type: 'select', options: ['Below 10,000', '10,000 to 15,000', '16,000 to 20,000', 'More than 20,000'], hint: 'Original form brackets are preserved pending clarification. Leave blank if no option fits.' },
    { id: 'isOsy', label: 'Are you an Out of School Youth (OSY)?', type: 'select', options: ['Yes', 'No'], hint: 'Self-reported; work status alone does not identify OSY.' },
    { id: 'osyFrom', label: 'OSY since — From', type: 'number', hint: 'Only for OSY. Enter the starting year, e.g. 2019.' },
    { id: 'osyTo', label: 'OSY since — To', type: 'number', hint: 'Only for OSY. Enter the ending year, e.g. 2024.' },
  ] },
  { title: 'Family & participation', description: 'Share your household and civic participation answers.', fields: [
    { id: 'children', label: 'Do you have a child?', type: 'select', required: true, options: ['No', 'Yes, only 1', 'Yes, I have 2 kids', 'Yes, I have 3 kids', 'Yes, More than 4 kids'], hint: 'The source form has no option for exactly four children. This needs clarification before live collection.' },
    { id: 'skVoter', label: 'Are you a registered voter of Sangguniang Kabataan?', type: 'select', required: true, options: ['Yes', 'No'] },
    { id: 'election2023', label: 'Did you vote last SK Election 2023? If no, why?', type: 'textarea', required: true },
    { id: 'nationalVoter', label: 'Are you a registered national voter?', type: 'select', required: true, options: ['Yes', 'No'] },
    { id: 'organization', label: "Do you have an Active Youth Organization in your neighborhood or area? If yes, what's the name of the Youth Organization?", type: 'textarea' },
    { id: 'kkAttendance', label: 'Have you already attended Katipunan ng Kabataan (KK) Assembly in your Barangay?', type: 'select', required: true, options: ['No', 'Yes', '2 to 3 times', 'More than 4 times'], hint: 'Original choices are preserved; exactly four attendances needs clarification.' },
  ] },
  { title: 'Your voice & certification', description: 'Help shape future youth programs.', fields: [
    { id: 'suggestions', label: 'Suggested youth projects and activities for your barangay', type: 'textarea' },
    { id: 'message', label: 'Message for the SK Council of Barangay Talipapa', type: 'textarea' },
    { id: 'certification', label: 'I hereby certify that the above information is true and correct to the best of my knowledge.', type: 'checkbox', required: true },
  ] },
];
export const allFields = sections.flatMap(section => section.fields);
export const editableCorrectionFields = allFields.filter(field => !['age', 'ageGroup', 'locality'].includes(field.id));
export function visibleFields(fields: Field[], answers: Answers) {
  return fields.filter(field => (field.id !== 'lgbtqiaDetails' || answers.gender === 'LGBTQIA+') && (!['osyFrom', 'osyTo'].includes(field.id) || answers.isOsy === 'Yes'));
}

export const TALIPAPA_LOCALITY = 'Talipapa, Quezon City';
// User-supplied Talipapa reference list, 2026-10-12. Suggestions do not prove residency.
export const addressSuggestions = {
  street: ["38th Street","Acuña Street","Aguila Street","Alimasag Street","Apahap Street","Arty 1 Road","Arty 2 Road","Aurigue","Ayungin Street","Bangus Street","Belton Drive","Bisugo Street","Branches","Branches Avenue","C. Francisco Street","Cadaing Street","Camia Street","Campo 1","Carnation Street","Carreon Jt Drive","Champaca Street","Dama de Noche Street","Del Mundo Street","Del Nacia Drive","Dela Cruz Street","Diamond Street","Don Raymundo Street","G. del Mundo Drive","Galguerra Drive","J. P. Ramoy Street","Kalapati Street","Karpa Street","Katipunan Avenue","King's Road","Kitang Street","Libra Street","Llano Street","Loro Street","MRC Street","Magnolia Place Drive","Magnolia Street","Makaya Street","Maligaya Street","Marcel Drive","Mindanao Avenue","Old Sauyo Road","Oliva de los Santos Street","Piko Street","Pipit Street","Pugo Street","Queens Road","Quirino Highway","Ramos Street","Rolex Street","Rook's Road","Rosal Street","Rufina Street","Sagittarius Street","Saint Andrew Street","Saint Anthony Street","Saint Charbel Street","Saint Charies Street","Saint Frances Street","Saint Gregory Street","Saint James Street","Saint Joseph Street","Saint Louis Street","Saint Matthew Street","Saint Michael Street","Saint Simon Street","San Leon Street","San Lorenzo Ruiz Street","San Sebastian Street","Santa Sabina Street","Sapsap Street","Siklot Street","Sipa Street","Sungka Street","T. H. Dela Cruz Street","Tamban Street","Tandang Sora Avenue","Tandang Sora Avenue Extension","The Junction Parkway","Topaz Street","Victorino Street","Virgo Street","Waling-waling Street","Yoyo Street"],
  subdivision: ["Arty I Subdivision","Del Nacia Subdivision","Gloria V Subdivision (Gloria Subdivision 5)","Pleasantville Subdivision","Saint Martin Subdivision","Silvina Village","Solville","Suntrust Shanata","Villa Florencia Subdivision","Villilia Village"],
};
export type Sibling = { name: string; age: string; birthdate?: string };
export function siblingRows(value = ''): Sibling[] {
  if (!value) return [{ name: '', age: '' }];
  try { const rows: unknown = JSON.parse(value); if (Array.isArray(rows) && rows.every(row => row && typeof row.name === 'string' && typeof row.age === 'string' && (row.birthdate === undefined || typeof row.birthdate === 'string'))) return rows.length ? rows : [{ name: '', age: '' }]; } catch { /* Legacy fictional answers remain visible. */ }
  return [{ name: value, age: '' }];
}
export function displayAnswer(id: string, answers: Answers): string {
  if (id === 'siblings') return siblingRows(answers.siblings).filter(row => row.name || row.age).map(row => `${row.name}${row.birthdate ? ` · Birthdate: ${row.birthdate}` : ''}${row.age ? ` — ${row.age} years old` : ''}`).join('\n') || 'Not provided';
  return answers[id]?.trim() || 'Not provided';
}

export function displayReviewAnswer(field: Field, answers: Answers): string {
  return field.type === 'checkbox' ? (answers[field.id] === 'true' ? 'Checked' : 'Not checked') : displayAnswer(field.id, answers);
}

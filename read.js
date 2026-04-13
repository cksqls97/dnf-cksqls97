import xlsx from 'xlsx';
const workbook = xlsx.readFile('제목 없는 스프레드시트.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, {header: 1});
console.log("=== HEADERS ===");
console.log(data[0]);
console.log("=== ROW 1 ===");
console.log(data[1]);

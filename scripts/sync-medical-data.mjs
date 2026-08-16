import { mkdir, writeFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

const publishedAt = "2026-06-01";
const sourcePage = "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/iryou/newpage_43373.html";
const files = [
  { type: "病院", kind: "facility", url: "https://www.mhlw.go.jp/content/11121000/01-1_hospital_facility_info_20260601.csv.zip" },
  { type: "病院", kind: "speciality", url: "https://www.mhlw.go.jp/content/11121000/01-2_hospital_speciality_hours_20260601.csv.zip" },
  { type: "診療所", kind: "facility", url: "https://www.mhlw.go.jp/content/11121000/02-1_clinic_facility_info_20260601.csv.zip" },
  { type: "診療所", kind: "speciality", url: "https://www.mhlw.go.jp/content/11121000/02-2_clinic_speciality_hours_20260601.csv.zip" },
];

const wards = new Map([
  ["101", "千代田区"], ["102", "中央区"], ["103", "港区"], ["104", "新宿区"], ["105", "文京区"],
  ["106", "台東区"], ["107", "墨田区"], ["108", "江東区"], ["109", "品川区"], ["110", "目黒区"],
  ["111", "大田区"], ["112", "世田谷区"], ["113", "渋谷区"], ["114", "中野区"], ["115", "杉並区"],
  ["116", "豊島区"], ["117", "北区"], ["118", "荒川区"], ["119", "板橋区"], ["120", "練馬区"],
  ["121", "足立区"], ["122", "葛飾区"], ["123", "江戸川区"],
]);

const extractFirstZipEntry = zip => {
  let eocd = zip.length - 22;
  while (eocd >= 0 && zip.readUInt32LE(eocd) !== 0x06054b50) eocd -= 1;
  if (eocd < 0) throw new Error("ZIP central directory not found");
  const centralOffset = zip.readUInt32LE(eocd + 16);
  if (zip.readUInt32LE(centralOffset) !== 0x02014b50) throw new Error("Invalid ZIP central directory");
  const method = zip.readUInt16LE(centralOffset + 10);
  const compressedSize = zip.readUInt32LE(centralOffset + 20);
  const localOffset = zip.readUInt32LE(centralOffset + 42);
  const nameLength = zip.readUInt16LE(localOffset + 26);
  const extraLength = zip.readUInt16LE(localOffset + 28);
  const start = localOffset + 30 + nameLength + extraLength;
  const compressed = zip.subarray(start, start + compressedSize);
  if (method === 0) return compressed;
  if (method === 8) return inflateRawSync(compressed);
  throw new Error(`Unsupported ZIP compression method: ${method}`);
};

const parseCsv = text => {
  const rows = [];
  let row = [], value = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { value += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(value); value = "";
      if (row.some(cell => cell.length)) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  const headers = rows.shift()?.map(header => header.replace(/^\uFEFF/, "")) ?? [];
  return rows.map(cells => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
};

const loaded = [];
for (const file of files) {
  const response = await fetch(file.url);
  if (!response.ok) throw new Error(`${file.url}: HTTP ${response.status}`);
  const csv = new TextDecoder("utf-8").decode(extractFirstZipEntry(Buffer.from(await response.arrayBuffer())));
  loaded.push({ ...file, rows: parseCsv(csv) });
}

const records = [];
for (const facilityFile of loaded.filter(file => file.kind === "facility")) {
  const specialityFile = loaded.find(file => file.kind === "speciality" && file.type === facilityFile.type);
  const departmentsById = new Map();
  for (const row of specialityFile.rows) {
    if (!/精神|心療内科/.test(row["診療科目名"] ?? "")) continue;
    if (!departmentsById.has(row.ID)) departmentsById.set(row.ID, new Set());
    departmentsById.get(row.ID).add(row["診療科目名"]);
  }

  for (const row of facilityFile.rows) {
    const area = row["都道府県コード"] === "13" ? wards.get(row["市区町村コード"]) : undefined;
    const departments = departmentsById.get(row.ID);
    if (!area || !departments) continue;
    records.push({
      id: `mhlw-${row.ID}`,
      name: row["正式名称"],
      facilityType: facilityFile.type,
      area,
      address: row["所在地"],
      phone: "",
      departments: [...departments].sort((a, b) => a.localeCompare(b, "ja")).join("、"),
      url: row["案内用ホームページアドレス"] || null,
      latitude: Number(row["所在地座標（緯度）"]) || null,
      longitude: Number(row["所在地座標（経度）"]) || null,
      sourceName: "厚生労働省 医療情報ネット オープンデータ",
      sourceUrl: sourcePage,
      datasetId: "mhlw-medical-information-network-20260601",
      resourceId: facilityFile.url.split("/").at(-1),
      dataAsOf: publishedAt,
    });
  }
}

records.sort((a, b) => a.area.localeCompare(b.area, "ja") || a.name.localeCompare(b.name, "ja"));
await mkdir("client/public/data", { recursive: true });
await writeFile(
  "client/public/data/mental-health-medical-institutions.json",
  `${JSON.stringify({ generatedAt: new Date().toISOString(), dataAsOf: publishedAt, coverage: [...wards.values()], items: records }, null, 2)}\n`,
  "utf8"
);
console.log(`Generated ${records.length} mental-health medical institutions across ${new Set(records.map(item => item.area)).size} wards.`);

import { mkdir, writeFile } from "node:fs/promises";

const sources = [
  {
    area: "都立病院",
    datasetId: "096d4841-973d-4982-9a82-257ea99f26c8",
    resourceId: "3c8ff46f-a2a7-41df-8887-83ddb15b7174",
    url: "https://data.storage.data.metro.tokyo.lg.jp/hokeniryou/130001_hospital.csv",
    encoding: "utf-8",
    addressKey: "所在地_連結表記",
  },
  {
    area: "中央区",
    datasetId: "01f90d55-38e7-42b9-9265-3023d7d672a2",
    resourceId: "b0e32fbd-8d5e-4ecd-8d9e-764c75fec939",
    url: "https://www.city.chuo.lg.jp/documents/984/iryoukikan.csv",
    encoding: "shift_jis",
    addressKey: "所在地_連結表記",
  },
  {
    area: "中野区",
    datasetId: "90ede8b4-0358-4028-9a18-5c51ce07bf00",
    resourceId: "baa42ac7-2adc-49be-aaf7-9a1ad9998746",
    url: "https://www2.wagmap.jp/nakanodatamap/nakanodatamap/opendatafile/map_47/CSV/opendata_550030.csv",
    encoding: "utf-8",
    addressKey: "住所",
  },
];

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

const cleanPhone = phone => phone.trim().replace(/^代表/, "");
const getCity = (row, source) => row["所在地_市区町村"] || row["市区町村名"] || source.area;

const records = [];
for (const source of sources) {
  const response = await fetch(source.url);
  if (!response.ok) throw new Error(`${source.url}: HTTP ${response.status}`);
  const text = new TextDecoder(source.encoding).decode(await response.arrayBuffer());
  const rows = parseCsv(text).filter(row => /精神科|心療内科|神経精神科/.test(row["診療科目"] ?? ""));
  for (const [index, row] of rows.entries()) {
    const city = getCity(row, source);
    const rawAddress = row[source.addressKey] ?? "";
    const address = source.area === "中野区" ? `東京都中野区${rawAddress}` : rawAddress;
    records.push({
      id: `${source.area}-${index + 1}`,
      name: row["名称"],
      facilityType: row["医療機関の種類"] || "医療機関",
      area: city,
      address,
      phone: cleanPhone(row["電話番号"] ?? ""),
      departments: row["診療科目"],
      url: row["URL"] || null,
      latitude: Number(row["緯度"]) || null,
      longitude: Number(row["経度"]) || null,
      sourceName: `${source.area} 医療機関オープンデータ`,
      sourceUrl: source.url,
      datasetId: source.datasetId,
      resourceId: source.resourceId,
    });
  }
}

await mkdir("client/public/data", { recursive: true });
await writeFile(
  "client/public/data/mental-health-medical-institutions.json",
  `${JSON.stringify({ generatedAt: new Date().toISOString(), coverage: sources.map(source => source.area), items: records }, null, 2)}\n`,
  "utf8"
);
console.log(`Generated ${records.length} mental-health medical institutions.`);

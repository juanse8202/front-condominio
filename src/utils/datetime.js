// /src/utils/datetime.js
export function toTime(value) {
// Acepta "HH:MM" o "HH:MM:SS" y estandariza a HH:MM:SS
if (!value) return "";
const parts = String(value).split(":");
if (parts.length === 2) return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}:00`;
if (parts.length === 3) return `${parts[0].padStart(2,"0")}:${parts[1].padStart(2,"0")}:${parts[2].padStart(2,"0")}`;
return value;
}


export function fmtDate(isoDate) {
// Espera YYYY-MM-DD
try {
const [y,m,d] = isoDate.split("-").map(Number);
return new Date(y, m-1, d).toLocaleDateString();
} catch { return isoDate; }
}


export function fmtTime(hms) {
try {
const [h,m] = hms.split(":");
return `${h}:${m}`;
} catch { return hms; }
}
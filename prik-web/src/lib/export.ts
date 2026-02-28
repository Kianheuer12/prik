import * as XLSX from "xlsx";

type Reading = { timestamp: number; value: number; type: string; mealOffset?: string; notes?: string };

export function downloadXLSX(readings: Reading[], filename: string) {
  const rows = [...readings]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((r) => ({
      Date: new Date(r.timestamp).toLocaleDateString("en-ZA"),
      Time: new Date(r.timestamp).toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }),
      "Glucose (mmol/L)": r.value,
      Type: r.type === "fasted" ? "Fasted" : "Post-meal",
      "Time After Meal": r.type === "post-meal" ? (r.mealOffset ?? "") : "",
      Notes: r.notes ?? "",
    }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 18 }, { wch: 12 }, { wch: 16 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Glucose Readings");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

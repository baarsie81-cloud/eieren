import { NextResponse } from "next/server";
import { assertTrustedOrigin, isAuthenticated } from "@/lib/auth/guards";
import { parseImportWorkbook } from "@/lib/excel-import";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await isAuthenticated())) return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  try {
    await assertTrustedOrigin();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Kies een bestand." }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "Het bestand is groter dan 5 MB." }, { status: 400 });

    const extension = file.name.toLocaleLowerCase("nl-NL").split(".").pop();
    if (extension === "xls") return NextResponse.json({ error: "Sla dit oude .xls-bestand eerst op als .xlsx." }, { status: 400 });
    if (extension !== "xlsx" && extension !== "csv") return NextResponse.json({ error: "Gebruik een .xlsx- of .csv-bestand." }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const worksheets = await parseImportWorkbook(buffer, extension);
    if (worksheets.length === 0) return NextResponse.json({ error: "Geen gegevens gevonden in het bestand." }, { status: 400 });
    return NextResponse.json({ worksheets });
  } catch (error) {
    console.error("Excel-import kon niet worden gelezen", error);
    return NextResponse.json({ error: "Het bestand kon niet worden gelezen. Controleer de indeling." }, { status: 400 });
  }
}

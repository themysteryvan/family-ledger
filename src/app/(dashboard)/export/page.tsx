import { redirect } from "next/navigation";

export default function ExportPage() {
  redirect("/reports?tab=export");
}

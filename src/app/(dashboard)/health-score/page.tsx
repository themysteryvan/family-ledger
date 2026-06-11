import { redirect } from "next/navigation";

export default function HealthScorePage() {
  redirect("/reports?tab=health-score");
}

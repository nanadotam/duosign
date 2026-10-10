import { redirect } from "next/navigation";

// The full thesis is shared on request.
export default function ThesisPage() {
  redirect("/get-involved?type=research");
}

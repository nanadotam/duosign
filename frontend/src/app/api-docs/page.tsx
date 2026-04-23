import { redirect } from "next/navigation";

export default function ApiDocsRedirect() {
  redirect("/guide?tab=api");
}

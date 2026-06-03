import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { RequestForm } from "@/components/requests/request-form";

export default async function NewRequestPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-4xl mx-auto">
      <RequestForm
        userEmail={user.email}
        userDepartment={user.department}
        userRole={user.role}
      />
    </div>
  );
}

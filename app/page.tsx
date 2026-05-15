import { getRegistrations } from "@/app/_server/data-access";
import { RegistrationFilter } from "@/app/_components/registration-filter";

export default async function DashboardPage() {
  const registrations = await getRegistrations();

  return (
    <div className="min-h-screen bg-bg-primary text-white/90 p-3 xs:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <RegistrationFilter registrations={registrations} />
      </div>
    </div>
  );
}

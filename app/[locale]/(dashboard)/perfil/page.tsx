import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { ProfileForm } from "@/components/profile/profile-form";
import { formatMonthYear } from "@/lib/dates";

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const locale = await getLocale();
  const t = await getTranslations("Profile");

  const profile = await prisma.profile.findUnique({
    where: { userId: session.userId },
  });

  return (
    <div className="space-y-6 px-1 pb-4">
      {/* Header */}
      <div className="px-[18px] pt-4">
        <h1 className="m-0 text-[28px] font-bold leading-tight tracking-[-0.025em] text-[var(--dietista-text)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm font-medium text-[var(--dietista-text-2)]">
          {t("updateDescription")}
        </p>
      </div>

      {/* Profile Card */}
      <div className="mx-[var(--dietista-pad-card)]">
        <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-500)] text-xl font-bold text-white">
              {session.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--dietista-text)]">
                {session.email}
              </p>
              <p className="text-xs text-[var(--dietista-text-2)]">
                {t("memberSince")} {formatMonthYear(new Date(), locale)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="mx-[var(--dietista-pad-card)]">
        <ProfileForm existingProfile={profile} />
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth-config";
import { getProfile } from "@/actions/profile";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function ProfilePage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.userId) {
    redirect("/login");
  }

  const { profile } = await getProfile();
  const t = await getTranslations("Profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {profile ? t("updateDescription") : t("createDescription")}
        </p>
      </div>
      <ProfileTabs
        profile={profile}
        account={{ name: session.name ?? null, email: session.email }}
      />
    </div>
  );
}

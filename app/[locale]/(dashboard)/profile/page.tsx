import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile/profile-form";
import { getTranslations } from "next-intl/server";

export default async function ProfilePage(): Promise<React.ReactElement> {
  const { profile } = await getProfile();
  const t = await getTranslations("Profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-muted-foreground">
          {profile
            ? t("updateDescription")
            : t("createDescription")}
        </p>
      </div>
      <ProfileForm existingProfile={profile} />
    </div>
  );
}

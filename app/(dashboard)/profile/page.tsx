import { getProfile } from "@/actions/profile";
import { ProfileForm } from "@/components/profile/profile-form";

export default async function ProfilePage() {
  const { profile } = await getProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="mt-1 text-muted-foreground">
          {profile
            ? "Update your nutritional parameters for personalized meal plans."
            : "Set up your nutritional profile to generate personalized meal plans."}
        </p>
      </div>
      <ProfileForm existingProfile={profile} />
    </div>
  );
}

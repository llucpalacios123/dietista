"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const errorMessages: Record<string, string> = {
  Configuration: "There is a problem with the server configuration. Please contact support.",
  AccessDenied: "You do not have permission to sign in.",
  Verification: "The verification link has expired or was already used.",
  OAuthSignin: "There was a problem starting the sign in process. Please try again.",
  OAuthCallback: "There was a problem with the sign in provider. Please try again.",
  OAuthCreateAccount: "There was a problem creating your account with the provider. Please try again.",
  EmailCreateAccount: "There was a problem creating your account. Please try again.",
  Callback: "There was a problem with the sign in callback. Please try again.",
  OAuthAccountNotLinked: "This email is already linked to another account. Please sign in with the original provider.",
  EmailSignin: "There was a problem sending the sign in email. Please try again.",
  CredentialsSignin: "Sign in failed. Please check your email and password and try again.",
  SessionRequired: "You must be signed in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
};

export function AuthErrorContent(): React.ReactElement {
  const t = useTranslations("Errors");
  const a = useTranslations("Auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("error") ?? "Default";
  const message = errorMessages[error] ?? errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("authError")}</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/login">{t("backToLogin")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/register">{a("createAccount")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

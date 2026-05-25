"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const errorKeys: Record<string, string> = {
  Configuration: "configuration",
  AccessDenied: "accessDenied",
  Verification: "verification",
  OAuthSignin: "oauthSignin",
  OAuthCallback: "oauthCallback",
  OAuthCreateAccount: "oauthCreateAccount",
  EmailCreateAccount: "emailCreateAccount",
  Callback: "callback",
  OAuthAccountNotLinked: "oauthAccountNotLinked",
  EmailSignin: "emailSignin",
  CredentialsSignin: "credentialsSignin",
  SessionRequired: "sessionRequired",
};

export function AuthErrorContent(): React.ReactElement {
  const t = useTranslations("Errors");
  const a = useTranslations("Auth");
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const messageKey = error ? errorKeys[error] : undefined;
  const message = messageKey ? t(messageKey) : t("defaultError");

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

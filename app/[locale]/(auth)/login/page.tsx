import { Suspense } from "react";
import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Login — Dietista",
  description: "Sign in to your Dietista account",
};

interface LoginFormFallbackProps {
  title: string;
  loadingText: string;
}

function LoginFormFallback({ title, loadingText }: LoginFormFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{loadingText}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function LoginPage(): Promise<React.ReactElement> {
  const t = await getTranslations("Auth");
  const tc = await getTranslations("Common");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700">Dietista</h1>
          <p className="mt-2 text-muted-foreground">
            {t("signInDescription")}
          </p>
        </div>
        <Suspense fallback={<LoginFormFallback title={t("signInTitle")} loadingText={tc("loading")} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

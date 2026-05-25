import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthErrorContent } from "@/components/auth/auth-error-content";

export default async function AuthErrorPage(): Promise<React.ReactElement> {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error de Autenticación</CardTitle>
            <CardDescription>Ha ocurrido un error inesperado. Inténtalo de nuevo.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}

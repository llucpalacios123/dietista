import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — Dietista",
  description: "Create your Dietista account",
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-700">Dietista</h1>
          <p className="mt-2 text-muted-foreground">
            Create your account to get started
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}

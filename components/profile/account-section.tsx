"use client";

import { useActionState, startTransition } from "react";
import type { JSX } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { accountNameSchema, changePasswordSchema } from "@/lib/schemas";
import type { AccountNameSchema, ChangePasswordSchema } from "@/lib/schemas";
import { updateName, changePassword } from "@/actions/account";
import type { AccountActionResult } from "@/actions/account";

// ─── Types ────────────────────────────────────────────────────────────────

export interface AccountSectionProps {
  name: string | null;
  email: string;
}

// ─── AccountSection ───────────────────────────────────────────────────────

export function AccountSection({ name, email }: AccountSectionProps): JSX.Element {
  const t = useTranslations("Profile");

  // ── Name form ──────────────────────────────────────────────────────────
  const [nameResult, nameAction] = useActionState<AccountActionResult | null, FormData>(
    updateName,
    null
  );

  const nameForm = useForm<AccountNameSchema>({
    resolver: zodResolver(accountNameSchema),
    defaultValues: { name: name ?? "" },
    mode: "onSubmit",
  });

  const onNameSubmit = nameForm.handleSubmit((data) => {
    const fd = new FormData();
    fd.set("name", data.name);
    startTransition(() => nameAction(fd));
  });

  // ── Password form ──────────────────────────────────────────────────────
  const [pwResult, pwAction] = useActionState<AccountActionResult | null, FormData>(
    changePassword,
    null
  );

  const pwForm = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    mode: "onSubmit",
  });

  const onPwSubmit = pwForm.handleSubmit((data) => {
    const fd = new FormData();
    fd.set("currentPassword", data.currentPassword);
    fd.set("newPassword", data.newPassword);
    fd.set("confirmPassword", data.confirmPassword);
    startTransition(() => pwAction(fd));
  });

  return (
    <div className="space-y-6">
      {/* ── Display Name ─────────────────────────────────────────────── */}
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <h2 className="mb-4 text-base font-semibold text-[var(--dietista-text)]">
          {t("Account.displayName")}
        </h2>

        {/* Email read-only */}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-[var(--dietista-text-2)]">
            {t("Account.emailLabel")}
          </label>
          <p
            className="rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-3 py-2 text-sm text-[var(--dietista-text-2)]"
            aria-label={t("Account.emailReadOnly")}
          >
            {email}
          </p>
          <p className="mt-1 text-xs text-[var(--dietista-text-3)]">
            {t("Account.emailReadOnly")}
          </p>
        </div>

        {nameResult?.success && (
          <div className="mb-4 rounded-[var(--dietista-r)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {t("Account.updateNameSuccess")}
          </div>
        )}
        {nameResult?.error && (
          <div className="mb-4 rounded-[var(--dietista-r)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {nameResult.error}
          </div>
        )}

        <form onSubmit={onNameSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="display-name"
              className="mb-1 block text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("Account.displayName")}
            </label>
            <input
              id="display-name"
              type="text"
              placeholder={t("Account.displayNamePlaceholder")}
              {...nameForm.register("name")}
              className="w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            />
            {nameForm.formState.errors.name && (
              <p className="mt-1 text-xs text-red-600">
                {nameForm.formState.errors.name.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={nameForm.formState.isSubmitting}
            className="rounded-[var(--dietista-r)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {nameForm.formState.isSubmitting
              ? t("Account.saving")
              : t("Account.saveChanges")}
          </button>
        </form>
      </div>

      {/* ── Change Password ───────────────────────────────────────────── */}
      <div className="rounded-[var(--dietista-r-lg)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-[var(--dietista-pad-card)]">
        <h2 className="mb-4 text-base font-semibold text-[var(--dietista-text)]">
          {t("Account.changePassword")}
        </h2>

        {pwResult?.success && (
          <div className="mb-4 rounded-[var(--dietista-r)] border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {t("Account.changePasswordSuccess")}
          </div>
        )}
        {pwResult?.error && (
          <div className="mb-4 rounded-[var(--dietista-r)] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {pwResult.error}
          </div>
        )}

        <form onSubmit={onPwSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="current-password"
              className="mb-1 block text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("Account.currentPassword")}
            </label>
            <input
              id="current-password"
              type="password"
              autoComplete="current-password"
              {...pwForm.register("currentPassword")}
              className="w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            />
            {pwForm.formState.errors.currentPassword && (
              <p className="mt-1 text-xs text-red-600">
                {pwForm.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-1 block text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("Account.newPassword")}
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...pwForm.register("newPassword")}
              className="w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            />
            {pwForm.formState.errors.newPassword && (
              <p className="mt-1 text-xs text-red-600">
                {pwForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm font-medium text-[var(--dietista-text)]"
            >
              {t("Account.confirmPassword")}
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...pwForm.register("confirmPassword")}
              className="w-full rounded-[var(--dietista-r)] border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-2 text-sm text-[var(--dietista-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
            />
            {pwForm.formState.errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {pwForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={pwForm.formState.isSubmitting}
            className="rounded-[var(--dietista-r)] bg-[var(--brand-500)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pwForm.formState.isSubmitting
              ? t("Account.saving")
              : t("Account.changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { ShoppingListItem } from "@/types/dietista";
import type { UpdateShoppingItemData } from "@/actions/shopping-list";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

/* ---------- shared helpers ---------- */

const CATEGORIES = [
  "frutas_verduras",
  "carnes",
  "lacteos",
  "panaderia",
  "almacen",
  "bebidas",
  "limpieza",
  "otros",
] as const;

/* ---------- props ---------- */

interface ItemRowProps {
  item: ShoppingListItem;
  onToggle: () => void;
  onUpdate: (itemId: string, data: UpdateShoppingItemData) => Promise<void>;
  onDelete: (itemId: string) => Promise<void>;
}

/* ---------- inline edit form ---------- */

interface EditFormProps {
  item: ShoppingListItem;
  t: ReturnType<typeof useTranslations<"Shopping">>;
  onSave: (itemId: string, data: UpdateShoppingItemData) => Promise<void>;
  onCancel: () => void;
}

function EditForm({
  item,
  t,
  onSave,
  onCancel,
}: EditFormProps): React.ReactElement {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity ?? "");
  const [category, setCategory] = useState(item.category ?? "");
  const [price, setPrice] = useState(
    item.price != null ? String(item.price) : "",
  );
  const [order, setOrder] = useState(item.order);
  const [saving, setSaving] = useState(false);

  const handleSave = async (): Promise<void> => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data: UpdateShoppingItemData = {};

      if (name.trim() !== item.name) data.name = name.trim();
      if (quantity !== (item.quantity ?? "")) data.quantity = quantity || undefined;
      if (category !== (item.category ?? ""))
        data.category = (category || undefined) as UpdateShoppingItemData["category"];
      const priceNum =
        price.trim() !== "" ? Number.parseFloat(price) : undefined;
      if (priceNum !== item.price) data.price = priceNum;

      if (order !== item.order) data.order = order;

      await onSave(item.id, data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[var(--dietista-border)] bg-[var(--dietista-surface)] p-3">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`item-name-${item.id}`}
          className="text-[10px] font-medium uppercase tracking-wider text-[var(--dietista-text-3)]"
        >
          {t("itemName")}
        </label>
        <input
          id={`item-name-${item.id}`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-2.5 py-1.5 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:border-[var(--brand-500)] focus:outline-none"
          placeholder={t("itemName")}
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-1.5">
          <label
            htmlFor={`item-qty-${item.id}`}
            className="text-[10px] font-medium uppercase tracking-wider text-[var(--dietista-text-3)]"
          >
            {t("itemQuantity")}
          </label>
          <input
            id={`item-qty-${item.id}`}
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-2.5 py-1.5 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:border-[var(--brand-500)] focus:outline-none"
            placeholder={t("itemQuantity")}
          />
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <label
            htmlFor={`item-price-${item.id}`}
            className="text-[10px] font-medium uppercase tracking-wider text-[var(--dietista-text-3)]"
          >
            {t("itemPrice")}
          </label>
          <input
            id={`item-price-${item.id}`}
            type="number"
            step="0.01"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-2.5 py-1.5 text-sm text-[var(--dietista-text)] placeholder:text-[var(--dietista-text-3)] focus:border-[var(--brand-500)] focus:outline-none"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`item-cat-${item.id}`}
          className="text-[10px] font-medium uppercase tracking-wider text-[var(--dietista-text-3)]"
        >
          {t("itemCategory")}
        </label>
        <select
          id={`item-cat-${item.id}`}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-2.5 py-1.5 text-sm text-[var(--dietista-text)] focus:border-[var(--brand-500)] focus:outline-none"
        >
          <option value="">{t("selectCategory")}</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {t(`categories.${cat}`)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`item-order-${item.id}`}
          className="text-[10px] font-medium uppercase tracking-wider text-[var(--dietista-text-3)]"
        >
          {t("itemOrder")}
        </label>
        <input
          id={`item-order-${item.id}`}
          type="number"
          step="1"
          min="0"
          value={order}
          onChange={(e) => setOrder(Number.parseInt(e.target.value, 10) || 0)}
          className="rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface-2)] px-2.5 py-1.5 text-sm text-[var(--dietista-text)] focus:border-[var(--brand-500)] focus:outline-none"
        />
      </div>

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className="flex-1 rounded-md bg-[var(--brand-500)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--brand-600)] disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveItem")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-[var(--dietista-border)] bg-[var(--dietista-surface)] px-3 py-1.5 text-xs font-medium text-[var(--dietista-text-2)] transition-colors hover:bg-[var(--dietista-surface-2)]"
        >
          {t("cancelEdit")}
        </button>
      </div>
    </div>
  );
}

/* ---------- main component ---------- */

export function ItemRow({
  item,
  onToggle,
  onUpdate,
  onDelete,
}: ItemRowProps): React.ReactElement {
  const t = useTranslations("Shopping");
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors bg-[var(--dietista-surface)] hover:bg-[var(--dietista-surface-2)]">
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${
          item.checked
            ? "border-[var(--brand-500)] bg-[var(--brand-500)]"
            : "border-[var(--dietista-border)]"
        }`}
        aria-label={item.checked ? t("unmarkItem") : t("markItem")}
      >
        {item.checked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="3"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {isEditing ? (
        /* ---------- edit mode ---------- */
        <div className="flex-1">
          <EditForm
            item={item}
            t={t}
            onSave={async (itemId, data) => {
              await onUpdate(itemId, data);
              setIsEditing(false);
            }}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        /* ---------- display mode ---------- */
        <>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex flex-1 items-center gap-2 text-left"
            aria-label={`Editar ${item.name}`}
          >
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${
                  item.checked
                    ? "line-through text-[var(--dietista-text-3)]"
                    : "text-[var(--dietista-text)]"
                }`}
              >
                {item.name}
              </span>
              {item.quantity && (
                <span className="ml-2 text-xs text-[var(--dietista-text-3)]">
                  {item.quantity}
                </span>
              )}
            </div>
            {item.price != null && (
              <span className="flex-shrink-0 text-xs font-medium tnum text-[var(--dietista-text-2)]">
                ${item.price.toFixed(2)}
              </span>
            )}
          </button>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="flex-shrink-0 rounded p-1 text-[var(--dietista-text-3)] hover:bg-[var(--dietista-surface-3)] hover:text-[var(--dietista-text)]"
            aria-label={t("editItem")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          </button>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex-shrink-0 rounded p-1 text-[var(--dietista-text-3)] hover:bg-[var(--dietista-danger-bg)] hover:text-[var(--dietista-danger)]"
            aria-label={t("deleteItem")}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </>
      )}

      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          void onDelete(item.id);
          setShowDeleteConfirm(false);
        }}
        title={t("confirmDeleteItem")}
        message={t("confirmDeleteItemMessage")}
        confirmLabel={t("deleteItem")}
        cancelLabel={t("cancel")}
      />
    </div>
  );
}

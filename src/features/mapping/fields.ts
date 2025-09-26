import type { FieldDef } from "./types";

export const PRODUCT_FIELDS: FieldDef[] = [
  {
    key: "product_name",
    label: "Product Name",
    synonyms: ["name", "title", "product"],
  },
  { key: "sku", label: "SKU", synonyms: ["sku", "item", "id", "code"] },
  {
    key: "description",
    label: "Description",
    synonyms: ["description", "desc", "details"],
  },
  { key: "supplier", label: "Supplier", synonyms: ["supplier", "vendor"] },
  { key: "price", label: "Price", synonyms: ["price", "cost", "amount"] },
  { key: "quantity", label: "Quantity", synonyms: ["qty", "quantity", "units"] },
  {
    key: "purchase_order",
    label: "Purchase Order",
    synonyms: ["po", "purchase order", "order", "purchase_order"],
  },
  { key: "date", label: "Date", synonyms: ["date", "created", "order date"] },
  { key: "amount", label: "Amount", synonyms: ["amount", "value", "total"] },
  { key: "balance", label: "Balance", synonyms: ["balance", "remaining"] },
];

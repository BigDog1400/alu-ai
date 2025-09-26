import type { FieldDef } from "./types";

export const PRODUCT_FIELDS: FieldDef[] = [
  {
    key: "purchase_order",
    label: "Purchase Order",
    synonyms: [
      "purchase order",
      "po",
      "po number",
      "order number",
      "purchase order id",
      "purchase_order",
    ],
  },
  {
    key: "product_name",
    label: "Product Name",
    synonyms: ["product name", "name", "description", "product", "item name"],
  },
  {
    key: "country_of_origin",
    label: "Country of Origin",
    synonyms: ["country of origin", "origin", "made in", "country", "coo"],
  },
  {
    key: "supplier",
    label: "Supplier",
    synonyms: ["supplier", "manufacturer", "vendor", "maker"],
  },
  {
    key: "supplier_email",
    label: "Supplier Email",
    synonyms: ["supplier email", "email", "contact email", "vendor email", "manufacturer email"],
  },
  {
    key: "certifications",
    label: "Certifications",
    synonyms: ["certifications", "certification", "certs", "cert"],
  },
  {
    key: "status_of_certifications",
    label: "Status of Certifications",
    synonyms: [
      "status of certifications",
      "certification status",
      "cert status",
      "status",
      "certifications status",
    ],
  },
  {
    key: "material_composition",
    label: "Material Composition",
    synonyms: ["material composition", "composition", "materials", "material", "fabric", "content"],
  },
  {
    key: "season",
    label: "Season",
    synonyms: ["season", "seasonal", "collection", "season code"],
  },
  {
    key: "group_id",
    label: "Group ID",
    synonyms: ["group id", "group", "collection id", "internal group", "internal id"],
  },
];

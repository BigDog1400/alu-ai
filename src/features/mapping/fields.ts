import type { FieldDef } from "./types";

export const PRODUCT_FIELDS: FieldDef[] = [
  {
    key: "purchase_order",
    label: "Purchase Order",
    description:
      "Unique identifier used to track purchasing documents, often called PO or order number.",
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
    description: "Human readable name or title for the item or SKU.",
    synonyms: ["product name", "name", "description", "product", "item name"],
  },
  {
    key: "country_of_origin",
    label: "Country of Origin",
    description: "Country where the product was manufactured or sourced.",
    synonyms: ["country of origin", "origin", "made in", "country", "coo"],
  },
  {
    key: "supplier",
    label: "Supplier",
    description: "Primary company or vendor responsible for producing the goods.",
    synonyms: ["supplier", "manufacturer", "vendor", "maker"],
  },
  {
    key: "supplier_email",
    label: "Supplier Email",
    description: "Email address for contacting the supplier or vendor representative.",
    synonyms: ["supplier email", "email", "contact email", "vendor email", "manufacturer email"],
  },
  {
    key: "certifications",
    label: "Certifications",
    description: "List of sustainability or compliance certifications associated with the product.",
    synonyms: ["certifications", "certification", "certs", "cert"],
  },
  {
    key: "status_of_certifications",
    label: "Status of Certifications",
    description: "Current validity or state of the product's certifications (e.g., valid, expired).",
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
    description: "Breakdown of materials or fibers used to make the product.",
    synonyms: ["material composition", "composition", "materials", "material", "fabric", "content"],
  },
  {
    key: "season",
    label: "Season",
    description: "Season or collection name that this product belongs to (e.g., Spring '27).",
    synonyms: ["season", "seasonal", "collection", "season code"],
  },
  {
    key: "group_id",
    label: "Group ID",
    description: "Internal grouping identifier, often used to cluster related styles or SKUs.",
    synonyms: ["group id", "group", "collection id", "internal group", "internal id"],
  },
];

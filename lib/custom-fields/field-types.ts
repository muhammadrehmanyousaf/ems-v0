import type { CustomFieldType } from "@/lib/api/customFields";
import type { IconName } from "@/components/dashboard/shared/icon";

/** UI metadata for each field type: label, lucide icon, one-line hint, whether
 * it needs an options editor. Mirrors the backend type registry. */
export const FIELD_TYPE_META: Record<CustomFieldType, { label: string; icon: IconName; hint: string; hasOptions?: boolean }> = {
  text: { label: "Text", icon: "Type", hint: "A short single line" },
  textarea: { label: "Paragraph", icon: "AlignLeft", hint: "Multi-line notes" },
  number: { label: "Number", icon: "Hash", hint: "Any numeric value" },
  money: { label: "Money (PKR)", icon: "Wallet", hint: "An amount in rupees" },
  date: { label: "Date", icon: "Calendar", hint: "A single day" },
  datetime: { label: "Date & time", icon: "Clock", hint: "Day and time" },
  boolean: { label: "Yes / No", icon: "ToggleRight", hint: "A simple checkbox" },
  dropdown: { label: "Dropdown", icon: "ChevronDown", hint: "Pick one option", hasOptions: true },
  multiselect: { label: "Multi-select", icon: "ListChecks", hint: "Pick several", hasOptions: true },
  phone: { label: "Phone", icon: "Phone", hint: "A phone number" },
  email: { label: "Email", icon: "Mail", hint: "An email address" },
  url: { label: "Link", icon: "Link", hint: "A web address" },
  file: { label: "File / photo", icon: "Paperclip", hint: "An attachment link" },
};

export const FIELD_TYPE_ORDER: CustomFieldType[] = [
  "text", "textarea", "number", "money", "date", "datetime",
  "boolean", "dropdown", "multiselect", "phone", "email", "url", "file",
];

/** Which host entities accept custom fields (label shown in the manager). */
export const CUSTOM_FIELD_ENTITIES: { key: string; label: string }[] = [
  { key: "booking", label: "Bookings" },
  { key: "expense", label: "Expenses" },
  { key: "lead", label: "Leads" },
  { key: "staff", label: "Staff" },
  { key: "supplier", label: "Suppliers" },
  { key: "broker", label: "Brokers" },
  { key: "function_sheet", label: "Function sheets" },
  { key: "customer", label: "Customers" },
  { key: "inventory", label: "Inventory" },
  { key: "generator_fuel", label: "Generator fuel" },
  { key: "space", label: "Spaces (halls/floors)" },
];

#!/usr/bin/env node
/**
 * List all available HeroUI v2 components.
 *
 * Usage:
 *   node list_components.mjs
 *
 * Output:
 *   JSON with components array and count
 */

const V2_DOCS_BASE = "https://v2.heroui.com";

// HeroUI v2 components (maintained list)
const COMPONENTS = [
  "Accordion",
  "Autocomplete",
  "Alert",
  "Avatar",
  "Badge",
  "Breadcrumbs",
  "Button",
  "Calendar",
  "Card",
  "Checkbox",
  "Checkbox Group",
  "Chip",
  "Circular Progress",
  "Code",
  "Date Input",
  "Date Picker",
  "Date Range Picker",
  "Divider",
  "Dropdown",
  "Drawer",
  "Form",
  "Image",
  "Input",
  "Input OTP",
  "Kbd",
  "Link",
  "Listbox",
  "Modal",
  "Navbar",
  "Number Input",
  "Pagination",
  "Popover",
  "Progress",
  "Radio Group",
  "Range Calendar",
  "Scroll Shadow",
  "Select",
  "Skeleton",
  "Slider",
  "Snippet",
  "Spacer",
  "Spinner",
  "Switch",
  "Table",
  "Tabs",
  "Toast",
  "Textarea",
  "Time Input",
  "Tooltip",
  "User",
];

/**
 * Convert component name to kebab-case for URL.
 */
function toKebabCase(name) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Try to verify the component exists by fetching its page.
 */
async function verifyComponent(name) {
  const slug = toKebabCase(name);
  const url = `${V2_DOCS_BASE}/docs/components/${slug}`;

  try {
    const response = await fetch(url, {
      method: "HEAD",
      headers: {"User-Agent": "HeroUI-v2-Skill/1.0"},
      signal: AbortSignal.timeout(10000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const verify = args.includes("--verify");

  const result = {
    version: "v2",
    docsBase: V2_DOCS_BASE,
    count: COMPONENTS.length,
    components: COMPONENTS,
  };

  if (verify) {
    console.error("# Verifying component URLs...");
    const verified = [];

    for (const name of COMPONENTS) {
      const exists = await verifyComponent(name);

      if (exists) {
        verified.push(name);
      } else {
        console.error(`# Warning: ${name} not found at expected URL`);
        verified.push(name); // Include anyway
      }
    }

    result.components = verified;
    result.count = verified.length;
  }

  console.log(JSON.stringify(result, null, 2));
  console.error(`\n# Found ${result.count} components (HeroUI v2)`);
}

main();

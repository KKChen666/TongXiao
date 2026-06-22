#!/usr/bin/env node
/**
 * Get component documentation for HeroUI v2 components.
 *
 * Usage:
 *   node get_component_docs.mjs Button
 *   node get_component_docs.mjs Button Card Input
 *
 * Output:
 *   Component documentation in markdown format
 */

const V2_DOCS_BASE = process.env.HEROUI_V2_DOCS_BASE || "https://v2.heroui.com";

/**
 * Convert PascalCase or space-separated name to kebab-case.
 */
function toKebabCase(name) {
  return name
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/**
 * Fetch component documentation from v2 docs site.
 */
async function fetchComponentDocs(component) {
  const kebabName = toKebabCase(component);
  const url = `${V2_DOCS_BASE}/docs/components/${kebabName}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "HeroUI-v2-Skill/1.0",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return {component, error: `HTTP ${response.status} for ${url}`};
    }

    const html = await response.text();

    // Extract main content from HTML
    const content = extractContent(html);

    return {
      component,
      url,
      content: content || `# ${component}\n\nDocs available at: ${url}`,
    };
  } catch (error) {
    return {component, error: `Failed to fetch: ${error.message}`};
  }
}

/**
 * Basic HTML to text extraction for main content.
 */
function extractContent(html) {
  // Try to extract the main article/content area
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  // Extract text between common content markers
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    || text.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
    || text.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (mainMatch) {
    text = mainMatch[1];
  }

  // Basic HTML to markdown-like conversion
  text = text.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "\n#### $1\n");
  text = text.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, "\n```\n$1\n```\n");
  text = text.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<br\s*\/?>/gi, "\n");
  text = text.replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  text = text.replace(/<[^>]+>/g, "");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\n{3,}/g, "\n\n");
  text = text.trim();

  return text;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Usage: node get_component_docs.mjs <Component1> [Component2] ...");
    console.error("Example: node get_component_docs.mjs Button Card");
    process.exit(1);
  }

  const components = args;

  if (components.length === 1) {
    console.error(`# Fetching docs for: ${components[0]}...`);
    const result = await fetchComponentDocs(components[0]);

    if (result.error) {
      console.error(`# Error: ${result.error}`);
      console.log(`# ${components[0]}\n\nDocs: ${V2_DOCS_BASE}/docs/components/${toKebabCase(components[0])}`);
    } else {
      console.log(result.content);
    }
  } else {
    console.error(`# Fetching docs for: ${components.join(", ")}...`);
    const results = [];

    for (const component of components) {
      const result = await fetchComponentDocs(component);
      results.push(result);
    }

    console.log(JSON.stringify(results, null, 2));
  }
}

main();

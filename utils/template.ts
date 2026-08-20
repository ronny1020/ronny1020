/** Replaces every `<!-- generated:<name> -->` marker in the template. */
export function renderTemplate(
  template: string,
  sections: Record<string, string>,
): string {
  return template.replace(
    /<!--\s*generated:([\w-]+)\s*-->/g,
    (marker, name: string) => sections[name] ?? marker,
  )
}

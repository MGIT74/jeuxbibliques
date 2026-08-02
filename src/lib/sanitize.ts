/**
 * Sanitisation stricte du code iframe de don, cote frontend, appliquee au
 * moment de l'affichage (defense en profondeur) : meme si le champ en base
 * contenait autre chose qu'un <iframe> propre (admin compromis, ancienne
 * donnee, erreur de saisie), on ne rend jamais que la balise <iframe>
 * elle-meme, avec un jeu d'attributs autorises — jamais de <script>, jamais
 * de gestionnaire d'evenement (onload, onerror, etc.), jamais de
 * javascript: en valeur d'attribut.
 */

const ALLOWED_ATTRS = new Set([
  'src', 'width', 'height', 'frameborder', 'allow', 'allowfullscreen',
  'style', 'title', 'scrolling', 'loading', 'referrerpolicy', 'name',
]);

export function sanitizeIframeHtml(html: string): string | null {
  if (!html) return null;

  const match = html.match(/<iframe[^>]*>/i);
  if (!match) return null;

  const tag = match[0];
  const attrRegex = /([a-zA-Z-]+)\s*=\s*"([^"]*)"|([a-zA-Z-]+)\s*=\s*'([^']*)'/g;
  const safeAttrs: string[] = [];
  let attrMatch: RegExpExecArray | null;

  while ((attrMatch = attrRegex.exec(tag)) !== null) {
    const name = (attrMatch[1] || attrMatch[3] || '').toLowerCase();
    const value = attrMatch[2] ?? attrMatch[4] ?? '';

    if (!ALLOWED_ATTRS.has(name)) continue;
    // Empeche "javascript:" ou autre schema dangereux dans src/style
    if (/javascript:|data:text\/html/i.test(value)) continue;

    safeAttrs.push(`${name}="${value.replace(/"/g, '&quot;')}"`);
  }

  if (!safeAttrs.some((a) => a.startsWith('src='))) return null;

  return `<iframe ${safeAttrs.join(' ')}></iframe>`;
}

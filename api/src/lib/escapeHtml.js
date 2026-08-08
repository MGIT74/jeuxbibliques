// Echappe les caracteres HTML speciaux avant d'interpoler une valeur
// fournie par l'utilisateur (pseudo, nom...) dans un email au format HTML.
// Sans ca, un pseudo contenant "<img src=x onerror=...>" ou un lien pouvait
// alterer l'affichage/le comportement de l'email recu par l'utilisateur ou
// par un administrateur (notifyAdmins).
function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { escapeHtml };

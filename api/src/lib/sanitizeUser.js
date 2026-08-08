// Retire du renvoi JSON tous les champs qui ne doivent jamais quitter le
// serveur, meme vers un admin ou vers l'utilisateur proprietaire du compte :
// le hash du mot de passe bien sur, mais aussi les tokens de verification
// email / reinitialisation de mot de passe. Ces tokens donnent un acces
// direct au compte tant qu'ils sont valides (48h / 1h) : les exposer dans
// GET /admin/users ou GET /me revenait a offrir un moyen de prise de
// controle de compte a quiconque peut lire cette reponse.
const SENSITIVE_FIELDS = [
  'password',
  'verification_token',
  'verification_token_expires',
  'password_reset_token',
  'password_reset_token_expires',
  'token_version',
];

function sanitizeUser(user) {
  if (!user) return user;
  const clean = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete clean[field];
  }
  return clean;
}

module.exports = { sanitizeUser, SENSITIVE_FIELDS };

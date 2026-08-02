const nodemailer = require('nodemailer');
const pool = require('../db/pool');

// Recupere les reglages SMTP actifs en base (configures depuis l'admin).
async function getSmtpSettings() {
  const [rows] = await pool.query('SELECT * FROM smtp_settings LIMIT 1');
  return rows[0] || null;
}

function buildTransport(settings) {
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port || 587,
    secure: !!settings.secure, // true pour le port 465, false pour 587/25 (STARTTLS)
    auth: settings.username
      ? { user: settings.username, pass: settings.password }
      : undefined,
  });
}

// Envoie un email si le SMTP est configure et actif. Ne leve jamais
// d'exception vers l'appelant : une erreur d'envoi ne doit jamais faire
// echouer une inscription, elle est seulement loguee.
async function sendMail({ to, subject, html }) {
  const settings = await getSmtpSettings();

  if (!settings || !settings.is_active || !settings.host) {
    console.log(`[mailer] SMTP non configure — email a "${to}" non envoye (${subject}).`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const transport = buildTransport(settings);
    await transport.sendMail({
      from: settings.from_name
        ? `"${settings.from_name}" <${settings.from_email || settings.username}>`
        : (settings.from_email || settings.username),
      to,
      subject,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error('[mailer] Echec envoi email:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail, getSmtpSettings, buildTransport };

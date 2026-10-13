// Redimensionne et compresse une image dans le navigateur avant envoi.
// Une photo de telephone (4-5 Mo) devient ~100-250 Ko : l'envoi et
// l'enregistrement sont quasi instantanes.
export async function compressImage(
  file: File,
  opts: { maxWidth?: number; maxHeight?: number; quality?: number } = {}
): Promise<string> {
  const { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = opts;

  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Lecture du fichier impossible'));
    r.readAsDataURL(file);
  });

  // GIF/SVG : on ne touche pas (animation / vectoriel)
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return dataUrl;

  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Image illisible'));
    i.src = dataUrl;
  });

  const ratio = Math.min(1, maxWidth / img.width, maxHeight / img.height);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  // PNG : on garde la transparence ; sinon fond blanc + JPEG (plus leger)
  const keepPng = file.type === 'image/png' && ratio === 1 && file.size < 300 * 1024;
  if (keepPng) return dataUrl;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const out = canvas.toDataURL('image/jpeg', quality);
  return out.length < dataUrl.length ? out : dataUrl;
}

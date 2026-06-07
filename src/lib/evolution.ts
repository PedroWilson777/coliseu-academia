// Cliente da Evolution API - envia mensagens e imagens pro WhatsApp

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'coliseu';

export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('55') && clean.length >= 12) return clean;
  const withoutLeadingZero = clean.startsWith('0') ? clean.slice(1) : clean;
  return '55' + withoutLeadingZero;
}

function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const variants: string[] = [normalized];
  if (normalized.length === 12) { variants.push(normalized.slice(0, 4) + '9' + normalized.slice(4)); }
  if (normalized.length === 13) { variants.push(normalized.slice(0, 4) + normalized.slice(5)); }
  return variants;
}

async function trySendText(number: string, text: string): Promise<boolean> {
  const response = await fetch(EVOLUTION_URL + '/message/sendText/' + EVOLUTION_INSTANCE, {
    method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
    body: JSON.stringify({ number, text }),
  });
  if (!response.ok) {
    console.warn('Evolution ' + number + ' -> ' + response.status + ':', await response.text());
    return false;
  }
  return true;
}

export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) { console.error('Evolution API nao configurada'); return false; }
  const variants = getPhoneVariants(phone);
  try {
    for (const number of variants) {
      const ok = await trySendText(number, text);
      if (ok) { console.log('Enviado para ' + number); return true; }
    }
    console.error('Evolution: falhou em todas as variantes de ' + phone);
    return false;
  } catch (error) { console.error('Erro Evolution:', error); return false; }
}

export async function sendWhatsAppImage(phone: string, imageUrl: string, caption?: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return false;
  const cleanPhone = normalizePhone(phone);
  try {
    const r = await fetch(EVOLUTION_URL + '/message/sendMedia/' + EVOLUTION_INSTANCE, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ number: cleanPhone, mediatype: 'image', media: imageUrl, caption: caption || '' }),
    });
    if (!r.ok) { console.error('Evolution image erro ' + r.status); return false; }
    return true;
  } catch (e) { console.error('Erro envio imagem:', e); return false; }
}

export async function sendWhatsAppAudio(phone: string, audioBase64: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return false;
  const cleanPhone = normalizePhone(phone);
  try {
    const r = await fetch(EVOLUTION_URL + '/message/sendWhatsAppAudio/' + EVOLUTION_INSTANCE, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ number: cleanPhone, audio: audioBase64, encoding: true }),
    });
    if (!r.ok) { console.error('Evolution audio erro ' + r.status + ':', await r.text()); return false; }
    return true;
  } catch (e) { console.error('Erro envio audio:', e); return false; }
}

export async function downloadWhatsAppMedia(messageId: string): Promise<{ base64: string; mimetype: string } | null> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return null;
  try {
    const r = await fetch(EVOLUTION_URL + '/chat/getBase64FromMediaMessage/' + EVOLUTION_INSTANCE, {
      method: 'POST', headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ message: { key: { id: messageId } } }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return { base64: data.base64, mimetype: data.mimetype };
  } catch (e) { console.error('Erro baixando midia:', e); return null; }
}

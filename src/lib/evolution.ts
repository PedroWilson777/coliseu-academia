// Cliente da Evolution API - envia mensagens e imagens pro WhatsApp

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'coliseu';

/**
 * Normaliza telefone para formato Evolution API (Brasil).
 * Garante prefixo 55 (DDI Brasil).
 * Ex: "73991234567" -> "5573991234567"
 */
export function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.startsWith('55') && clean.length >= 12) return clean;
  const withoutLeadingZero = clean.startsWith('0') ? clean.slice(1) : clean;
  return '55' + withoutLeadingZero;
}

/**
 * Retorna variantes do telefone para tentativa com/sem 9 digito.
 * Util para numeros BR antigos (8 digitos) que no WhatsApp tem 9 digitos, e vice-versa.
 */
function getPhoneVariants(phone: string): string[] {
  const normalized = normalizePhone(phone);
  const variants: string[] = [normalized];

  // Brasil: 55 + DDD(2) + numero local
  // 8 digitos locais = 12 total -> tentar com 9 digito inserido apos o DDD
  if (normalized.length === 12) {
    variants.push(normalized.slice(0, 4) + '9' + normalized.slice(4));
  }
  // 9 digitos locais = 13 total -> tentar sem o 9 digito
  if (normalized.length === 13) {
    variants.push(normalized.slice(0, 4) + normalized.slice(5));
  }

  return variants;
}

async function trySendText(number: string, text: string): Promise<boolean> {
  const response = await fetch(
    EVOLUTION_URL + '/message/sendText/' + EVOLUTION_INSTANCE,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: EVOLUTION_KEY },
      body: JSON.stringify({ number, text }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.warn('Evolution sendText ' + number + ' -> ' + response.status + ':', errorBody);
    return false;
  }
  return true;
}

export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.error('Evolution API nao configurada');
    return false;
  }

  const variants = getPhoneVariants(phone);

  try {
    for (const number of variants) {
      const ok = await trySendText(number, text);
      if (ok) {
        console.log('Texto enviado para ' + number);
        return true;
      }
    }
    console.error('Evolution: falhou em todas as variantes de ' + phone);
    return false;
  } catch (error) {
    console.error('Erro Evolution:', error);
    return false;
  }
}

export async function sendWhatsAppImage(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return false;

  const cleanPhone = normalizePhone(phone);

  try {
    const response = await fetch(
      EVOLUTION_URL + '/message/sendMedia/' + EVOLUTION_INSTANCE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          mediatype: 'image',
          media: imageUrl,
          caption: caption || '',
        }),
      }
    );

    if (!response.ok) {
      console.error('Evolution image erro ' + response.status);
      return false;
    }

    console.log('Imagem enviada para ' + cleanPhone);
    return true;
  } catch (error) {
    console.error('Erro envio imagem:', error);
    return false;
  }
}

export async function sendWhatsAppAudio(
  phone: string,
  audioBase64: string,
): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return false;

  const cleanPhone = normalizePhone(phone);

  try {
    const response = await fetch(
      EVOLUTION_URL + '/message/sendWhatsAppAudio/' + EVOLUTION_INSTANCE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          audio: audioBase64,
          encoding: true,
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Evolution audio erro ' + response.status + ':', errorBody);
      return false;
    }

    console.log('Audio enviado para ' + cleanPhone);
    return true;
  } catch (error) {
    console.error('Erro envio audio:', error);
    return false;
  }
}

export async function downloadWhatsAppMedia(
  messageId: string
): Promise<{ base64: string; mimetype: string } | null> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return null;

  try {
    const response = await fetch(
      EVOLUTION_URL + '/chat/getBase64FromMediaMessage/' + EVOLUTION_INSTANCE,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_KEY,
        },
        body: JSON.stringify({ message: { key: { id: messageId } } }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return { base64: data.base64, mimetype: data.mimetype };
  } catch (error) {
    console.error('Erro baixando midia:', error);
    return null;
  }
}

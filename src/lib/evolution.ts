// Cliente da Evolution API - envia mensagens e imagens pro WhatsApp

const EVOLUTION_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || 'coliseu';

export async function sendWhatsAppMessage(phone: string, text: string): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) {
    console.error('❌ Evolution API não configurada');
    return false;
  }

  const cleanPhone = phone.replace(/\D/g, '');

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_KEY,
        },
        body: JSON.stringify({ number: cleanPhone, text }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`❌ Evolution erro ${response.status}:`, errorBody);
      return false;
    }

    console.log(`✅ Texto enviado pra ${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('❌ Erro Evolution:', error);
    return false;
  }
}

export async function sendWhatsAppImage(
  phone: string,
  imageUrl: string,
  caption?: string
): Promise<boolean> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return false;

  const cleanPhone = phone.replace(/\D/g, '');

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/message/sendMedia/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_KEY,
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
      console.error(`❌ Evolution image erro ${response.status}`);
      return false;
    }

    console.log(`🖼️  Imagem enviada pra ${cleanPhone}`);
    return true;
  } catch (error) {
    console.error('❌ Erro envio imagem:', error);
    return false;
  }
}

export async function downloadWhatsAppMedia(
  messageId: string
): Promise<{ base64: string; mimetype: string } | null> {
  if (!EVOLUTION_URL || !EVOLUTION_KEY) return null;

  try {
    const response = await fetch(
      `${EVOLUTION_URL}/chat/getBase64FromMediaMessage/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_KEY,
        },
        body: JSON.stringify({ message: { key: { id: messageId } } }),
      }
    );

    if (!response.ok) return null;
    const data = await response.json();
    return { base64: data.base64, mimetype: data.mimetype };
  } catch (error) {
    console.error('❌ Erro baixando mídia:', error);
    return null;
  }
}

import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function transcribeAudio(audioUrl: string): Promise<string> {
  try {
    // Baixa o áudio
    const response = await fetch(audioUrl);
    if (!response.ok) {
      console.error('❌ Erro baixando áudio:', response.status);
      return '';
    }

    const audioBuffer = await response.arrayBuffer();
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });

    // Transcreve com Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });

    return transcript.text;
  } catch (error) {
    console.error('❌ Erro Whisper:', error);
    return '';
  }
}

export async function transcribeAudioFromBase64(base64Data: string): Promise<string> {
  try {
    const audioBuffer = Buffer.from(base64Data, 'base64');
    const audioFile = new File([audioBuffer], 'audio.ogg', { type: 'audio/ogg' });

    const transcript = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'pt',
    });

    return transcript.text;
  } catch (error) {
    console.error('❌ Erro Whisper (base64):', error);
    return '';
  }
}

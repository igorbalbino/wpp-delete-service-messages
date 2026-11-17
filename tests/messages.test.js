import { describe, expect, it } from 'vitest';
import { isImageMessage } from '../src/whatsapp/messages.js';

describe('isImageMessage', () => {
  it('reconhece foto direta', () => {
    expect(
      isImageMessage({
        message: { imageMessage: { mimetype: 'image/jpeg' } },
      }),
    ).toBe(true);
  });

  it('reconhece foto com legenda', () => {
    expect(
      isImageMessage({
        message: { imageMessage: { caption: 'Faço instalação elétrica', mimetype: 'image/jpeg' } },
      }),
    ).toBe(true);
  });

  it('reconhece foto temporária e de visualização única', () => {
    expect(
      isImageMessage({
        message: {
          ephemeralMessage: { message: { imageMessage: { mimetype: 'image/jpeg' } } },
        },
      }),
    ).toBe(true);

    expect(
      isImageMessage({
        message: {
          viewOnceMessageV2: { message: { imageMessage: { mimetype: 'image/jpeg' } } },
        },
      }),
    ).toBe(true);
  });

  it('ignora texto, vídeo, figurinha e documento', () => {
    expect(isImageMessage({ message: { conversation: 'olá' } })).toBe(false);
    expect(isImageMessage({ message: { videoMessage: { mimetype: 'video/mp4' } } })).toBe(false);
    expect(isImageMessage({ message: { stickerMessage: { mimetype: 'image/webp' } } })).toBe(false);
    expect(
      isImageMessage({
        message: { documentMessage: { mimetype: 'image/png', fileName: 'foto.png' } },
      }),
    ).toBe(false);
  });
});

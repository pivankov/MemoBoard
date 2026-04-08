/**
 * Читает текст из буфера обмена
 * @returns Текст из буфера или null при ошибке
 */
export const readClipboardText = async (): Promise<string | null> => {
  try {
    if (!navigator.clipboard?.readText) {
      return null;
    }

    return await navigator.clipboard.readText();
  } catch (error) {
    console.debug('Не удалось прочитать буфер обмена:', error);
    
    return null;
  }
};
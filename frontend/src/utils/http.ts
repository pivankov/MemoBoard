/**
 * Извлекает имя домена с доменной зоной: mysite.com
 * 
 * @param url - строка содержащая url
 * @returns строка с именем и зоной домена
 */
export const getDomainName = (url: string) => {
  const newUrl = new URL(url);

  return newUrl.hostname.replace('www.', '');
};

/**
 * Проверяет, является ли строка валидным URL
 * @param url - строка для проверки
 * @returns true если строка является валидным URL
 */
export const isValidUrl = (url: string): boolean => {
  if (!url.trim()) return false;
  
  try {
    const urlObject = new URL(url);
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:';
  } catch {
    return false;
  }
};
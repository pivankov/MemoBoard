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

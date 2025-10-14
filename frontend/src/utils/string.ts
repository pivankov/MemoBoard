/**
 * Преобразует первый символ строки в верхний регистр с учётом русской локали
 * 
 * @param str - исходная строка для преобразования
 * @returns строка с первым символом в верхнем регистре
 */
export const capitalizeFirst = (str: string): string => {
  if (!str) {
    return str;
  }

  return str[0].toLocaleUpperCase('ru-RU') + str.slice(1);
};



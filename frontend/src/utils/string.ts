export const capitalizeFirst = (str: string): string => {
  if (!str) {
    return str;
  }

  return str[0].toLocaleUpperCase('ru-RU') + str.slice(1);
};



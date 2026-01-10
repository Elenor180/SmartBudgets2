
import { Currency } from '../types';

export const getCurrencySymbol = (currency: Currency): string => {
  const symbols: Record<Currency, string> = {
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.ZAR]: 'R',
    [Currency.GBP]: '£',
    [Currency.JPY]: '¥'
  };
  return symbols[currency] || '$';
};

export const getCurrencyLocale = (currency: Currency): string => {
  const locales: Record<Currency, string> = {
    [Currency.USD]: 'en-US',
    [Currency.EUR]: 'de-DE',
    [Currency.ZAR]: 'en-ZA',
    [Currency.GBP]: 'en-GB',
    [Currency.JPY]: 'ja-JP'
  };
  return locales[currency] || 'en-US';
};

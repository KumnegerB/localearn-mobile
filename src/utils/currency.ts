export interface CurrencyOption {
  code: string;
  symbol: string;
  label: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'GBP', symbol: '£', label: 'GBP (£)' },
  { code: 'ETB', symbol: 'Br', label: 'ETB (Birr)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD ($)' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD ($)' },
  { code: 'KES', symbol: 'KSh', label: 'KES (KSh)' },
  { code: 'NGN', symbol: '₦', label: 'NGN (₦)' },
  { code: 'INR', symbol: '₹', label: 'INR (₹)' },
];

export const formatPrice = (amount: number, currencyCode?: string | null): string => {
  const code = (currencyCode || 'USD').toUpperCase();
  const matched = SUPPORTED_CURRENCIES.find((c) => c.code === code);
  const symbol = matched ? matched.symbol : '$';
  return `${symbol}${amount.toFixed(0)}`;
};


export const CURRENCY_SYMBOL = "KSh";
export const CURRENCY_CODE = "KES";

export const formatCurrency = (amount: number): string => {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const formatCurrencyDecimal = (amount: number): string => {
  return `${CURRENCY_SYMBOL} ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

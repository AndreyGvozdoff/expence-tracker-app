export interface Transaction extends TransactionForm, TransactionFiltersForm {
  id: number;
  createdOn: Date;
}
export interface TransactionFiltersForm {
  type: string;
  category: []
}
export interface TransactionForm {
  name: string;
  date: Date;
  amount: number
}
export enum TransactionFilterTypesEnum {
  Income = "Income",
  Expense = "Expense",
}

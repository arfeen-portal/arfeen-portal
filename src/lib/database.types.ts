export type Database = {
  public: {
    Tables: {
      invoices: { Row: any }
      invoice_items: { Row: any }
      payments: { Row: any }
      currency_rates: { Row: any }
      agents: { Row: any }
    }
  }
}

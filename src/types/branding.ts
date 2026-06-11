export type HostType = "custom" | "subdomain" | "internal";

export type DomainStatus =
  | "active"
  | "paused"
  | "blocked"
  | "pending";

export type SslStatus =
  | "pending"
  | "active"
  | "failed";

export type PortalTheme = {
  id: string;
  tenant_id: string | null;
  name: string;
  code: string | null;
  is_default: boolean;

  logo_url: string | null;
  favicon_url: string | null;
  login_bg_url: string | null;

  primary_color: string;
  secondary_color: string;
  accent_color: string;

  header_bg: string | null;
  sidebar_bg: string | null;
  card_bg: string | null;

  text_color: string | null;
  muted_text_color: string | null;
  border_color: string | null;

  font_family: string | null;
  border_radius: string | null;
  custom_css: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PortalDomain = {
  id: string;
  tenant_id: string | null;
  theme_id: string | null;

  domain: string;
  subdomain: string | null;

  host_type: HostType;
  status: DomainStatus | null;
  auto_detect: boolean | null;

  is_primary: boolean;
  is_verified: boolean;

  verification_token: string | null;
  ssl_status: SslStatus;

  login_title: string | null;
  login_subtitle: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AgentPortalSetting = {
  id: string;
  tenant_id: string;
  agent_id: string;

  portal_name: string;
  portal_slug: string;

  theme_id: string | null;
  domain_id: string | null;

  show_transport: boolean;
  show_hotels: boolean;
  show_packages: boolean;
  show_ledger: boolean;
  show_invoices: boolean;
  show_reports: boolean;

  can_view_only_own_data: boolean;
  can_book_transport: boolean;
  can_book_hotels: boolean;
  can_book_packages: boolean;

  logo_url: string | null;
  welcome_text: string | null;

  support_phone: string | null;
  support_whatsapp: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ThemeOption = Pick<
  PortalTheme,
  | "id"
  | "name"
  | "logo_url"
  | "primary_color"
  | "secondary_color"
  | "accent_color"
> & {
  brand_name?: string | null;
  domain?: string | null;
};

export type DomainFormState = {
  domain: string;
  host_type: HostType;
  status: DomainStatus;
  auto_detect: boolean;
  theme_id: string;
  login_title: string;
  login_subtitle: string;
  is_primary: boolean;
};
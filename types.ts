export enum Role {
  BROKER = 'BROKER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export enum ClientStatus {
  FIRST_CONTACT = 'Primeiro Atendimento',
  CADENCE_FLOW = 'Fluxo de Cadência',
  HANDLING = 'Tratativa',
  AWAITING_DOC = 'Aguardando Doc',
  DOC_COMPLETE = 'Doc Completa',
  IN_ANALYSIS = 'Em Análise',
  APPROVED = 'Aprovado',
  REPROVED = 'Reprovado',
  SALE_GENERATED = 'Venda Gerada',
  ARCHIVED = 'Arquivado',
  // Legacy statuses for existing data
  CADENCE = 'Cadência',
  DOCS = 'Docs',
  SALE = 'Venda',
}

export enum FollowUpState {
  NO_FOLLOW_UP = 'Sem Follow Up',
  ACTIVE = 'Ativo',
  DELAYED = 'Atrasado',
  COMPLETED = 'Concluido',
  CANCELED = 'Cancelado',
  LOST = 'Perdido',
}


export enum InteractionType {
  NOTE = 'Anotação',
  WHATSAPP = 'WhatsApp',
  CALL_INITIATED = 'Ligação Iniciada',
  LOGGED_CALL = 'Ligação Registrada',
  STATUS_CHANGE = 'Mudança de Status',
  FOLLOW_UP_SCHEDULED = 'Follow-up Agendado',
  FOLLOW_UP_COMPLETED = 'Follow-up Concluído',
  FOLLOW_UP_CANCELED = 'Follow-up Cancelado',
  FOLLOW_UP_LOST = 'Follow-up Perdido',
  CLIENT_CREATED = 'Cliente Cadastrado',
  AUDIO = 'Áudio Enviado',
  INSECURE = 'Cliente Inseguro'
}

export interface Interaction {
  id: string;
  type: InteractionType;
  date: string; // Will be created_at from DB
  observation: string;
  fromStatus?: ClientStatus;
  toStatus?: ClientStatus;
  substituted?: boolean;
}


export interface Client {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: ClientStatus;
  email?: string;
  observations?: string;
  interactions: Interaction[];
  product?: string;
  propertyValue?: string;
  followUpState: FollowUpState;
}

export interface Kpi {
  title: string;
  value: number | string;
  color: string;
}

export interface Activity {
  id: string;
  description: string;
  timestamp: string;
  user: string;
}

// New types for Productivity and Funnel Analytics
export interface ProductivityKpis {
  ligacoes: number;
  ce: number;
  tratativas: number;
  documentacao: number;
  vendas: number;
}

export interface ManagerKpis {
  vgv: number;
  oportunidade: number;
  ligacoes: number;
  vendas: number;
}

export interface BreakdownItem {
  [key: string]: string | number;
}

export interface DailyPoint {
  [key: string]: string | number;
  date: string;
  ligacoes: number;
  ce: number;
  tratativas: number;
  documentacao: number;
  vendas: number;
}

export interface ProductivityData {
  kpis: ProductivityKpis;
  managerKpis?: ManagerKpis;
  timeseries: {
    daily: DailyPoint[];
  };
  breakdown: {
    porOrigem: BreakdownItem[];
    porBroker: BreakdownItem[];
  };
  brokers?: { id: string, name: string }[];
}

export interface FunnelStage {
  stage: string;
  count: number;
}

export interface FunnelAnalyticsData {
  funnel: FunnelStage[];
  conversionRates: Record<string, number>;
}
import { ClientStatus, FollowUpState } from './types';

export const STATUS_COLORS: Record<ClientStatus, string> = {
  [ClientStatus.FIRST_CONTACT]: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  [ClientStatus.CADENCE_FLOW]: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  [ClientStatus.HANDLING]: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  [ClientStatus.AWAITING_DOC]: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
  [ClientStatus.DOC_COMPLETE]: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  [ClientStatus.IN_ANALYSIS]: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  [ClientStatus.APPROVED]: 'bg-lime-500/20 text-lime-300 border border-lime-500/30',
  [ClientStatus.REPROVED]: 'bg-red-500/20 text-red-300 border border-red-500/30',
  [ClientStatus.SALE_GENERATED]: 'bg-green-500/20 text-green-300 border border-green-500/30',
  [ClientStatus.ARCHIVED]: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  // Legacy
  [ClientStatus.CADENCE]: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
  [ClientStatus.DOCS]: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  [ClientStatus.SALE]: 'bg-green-500/20 text-green-300 border border-green-500/30',
};

export const FOLLOW_UP_STATE_COLORS: Record<FollowUpState, string> = {
    [FollowUpState.NO_FOLLOW_UP]: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    [FollowUpState.ACTIVE]: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    [FollowUpState.DELAYED]: 'bg-red-500/20 text-red-300 border border-red-500/30',
    [FollowUpState.COMPLETED]: 'bg-green-500/20 text-green-300 border border-green-500/30',
    [FollowUpState.CANCELED]: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
};

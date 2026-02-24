import type { NetworkRequest } from '../../context/types';
export interface NetworkDetailProps {
  request: NetworkRequest;
  onClose: () => void;
}

export type TabType = 'overview' | 'request' | 'response' | 'timing';

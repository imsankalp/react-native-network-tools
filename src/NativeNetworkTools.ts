import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  getAllRequests(): string;
  getRequestById(id: string): string;
  clearAllRequests(): void;
  getRequestCount(): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NetworkTools');

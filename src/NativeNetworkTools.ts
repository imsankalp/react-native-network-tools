import { TurboModuleRegistry, type TurboModule } from 'react-native';

export interface Spec extends TurboModule {
  getAllRequests(): string;
  getRequestById(id: string): string;
  clearAllRequests(): void;
  getRequestCount(): number;
  addListener(eventType: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NetworkTools');

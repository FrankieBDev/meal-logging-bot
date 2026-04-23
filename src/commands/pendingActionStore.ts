type PendingProductAction = {
  actorId: string;
  kind: "addProduct";
  productId: string;
  productName: string;
  brand?: string;
  category?: string;
  notes?: string;
  source: string;
  confidence: number;
};

type PendingCloseDayAction = {
  actorId: string;
  kind: "closeDay";
  dailyNoteId: string;
  date: string;
  notes?: string;
  mood?: string;
  energy?: string;
  appetite?: string;
  cravings?: string;
  cycleDay?: number;
  source: string;
  confidence: number;
};

type PendingAction = PendingProductAction | PendingCloseDayAction;

const pendingActions = new Map<string, PendingAction>();

export function setPendingAction(action: PendingAction): void {
  pendingActions.set(action.actorId, action);
}

export function getPendingAction(actorId: string): PendingAction | undefined {
  return pendingActions.get(actorId);
}

export function clearPendingAction(actorId: string): void {
  pendingActions.delete(actorId);
}

export function resetPendingActions(): void {
  pendingActions.clear();
}

export type { PendingAction, PendingCloseDayAction, PendingProductAction };

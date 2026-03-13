let counter = 0;

export function generateId(): string {
  return `${Date.now()}_${counter++}_${Math.random().toString(36).slice(2, 9)}`;
}

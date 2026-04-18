import type { Transaction, User } from '@/types';

export const demoManager: User = {
  id: 'demo-manager-001',
  email: 'manager@hsh.com',
  name: 'Manager Demo',
  role: 'manager',
  isActive: true
};

export const demoStaff: User = {
  id: 'demo-staff-001',
  email: 'staff@hsh.com',
  name: 'Staff Demo',
  role: 'staff',
  isActive: true
};

// Demo mode starts with NO opening cash set (user must set it)
// Empty transactions - user adds their own
export const generateDemoTransactions = (): Transaction[] => {
  return [];
};

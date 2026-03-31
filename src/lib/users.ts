// In-memory user store for development.
// Replace with a real database (Postgres, MongoDB, etc.) in production.

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  plan: 'free' | 'pro';
}

const users: User[] = [];

export function findUserByEmail(email: string): User | undefined {
  return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUserById(id: string): User | undefined {
  return users.find((u) => u.id === id);
}

export function createUser(data: Omit<User, 'id' | 'createdAt' | 'plan'>): User {
  const user: User = {
    ...data,
    id: Math.random().toString(36).slice(2),
    createdAt: new Date().toISOString(),
    plan: 'free',
  };
  users.push(user);
  return user;
}

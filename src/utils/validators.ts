/**
 * Input validation utilities for ስራ (Sira)
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim();
  if (!trimmed) {
    return 'Email address is required.';
  }
  if (!isValidEmail(trimmed)) {
    return 'Please enter a valid email address (e.g. name@example.com).';
  }
  return null;
};

export const validatePassword = (password: string, minLength: number = 6): string | null => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return null;
};

export const validateFullName = (name: string): string | null => {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Full name is required.';
  }
  if (trimmed.length < 2) {
    return 'Name must be at least 2 characters.';
  }
  return null;
};

export const validatePhoneNumber = (phone: string): string | null => {
  const trimmed = phone.trim();
  if (!trimmed) {
    return null; // Phone is optional
  }
  // Remove spaces, hyphens, and parens to check digit count
  const digitsOnly = trimmed.replace(/[\s\-\(\)\+]/g, '');
  if (digitsOnly.length < 7 || !PHONE_REGEX.test(trimmed)) {
    return 'Please enter a valid phone number (at least 7 digits).';
  }
  return null;
};

export const validateTaskTitle = (title: string): string | null => {
  const trimmed = title.trim();
  if (!trimmed) {
    return 'Task title is required.';
  }
  if (trimmed.length < 5) {
    return 'Title must be at least 5 characters.';
  }
  if (trimmed.length > 100) {
    return 'Title must be 100 characters or less.';
  }
  return null;
};

export const validateTaskDescription = (desc: string): string | null => {
  const trimmed = desc.trim();
  if (!trimmed) {
    return 'Description is required.';
  }
  if (trimmed.length < 10) {
    return 'Please write at least 10 characters so helpers understand what is needed.';
  }
  return null;
};

export const validateBudget = (budget: string): string | null => {
  const trimmed = budget.trim();
  if (!trimmed) {
    return 'Budget amount is required.';
  }
  const num = parseFloat(trimmed);
  if (isNaN(num) || num <= 0) {
    return 'Please enter a valid budget greater than 0.';
  }
  if (num > 100000) {
    return 'Budget cannot exceed 100,000.';
  }
  return null;
};

export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'sira',
  'localearn',
  'support',
  'help',
  'official',
  'system',
  'moderator',
  'staff',
  'null',
  'undefined',
  'explore',
  'inbox',
  'profile',
  'jobs',
  'tasks',
  'settings',
  'api',
  'auth',
]);

const USERNAME_ALLOWED_REGEX = /^[a-zA-Z0-9_]+$/;

export const validateUsername = (rawUsername: string): { isValid: boolean; error: string | null; normalized: string } => {
  const normalized = rawUsername.trim().toLowerCase();

  if (!normalized) {
    return { isValid: false, error: 'Username is required.', normalized };
  }

  if (normalized.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.', normalized };
  }

  if (normalized.length > 20) {
    return { isValid: false, error: 'Username cannot exceed 20 characters.', normalized };
  }

  if (!USERNAME_ALLOWED_REGEX.test(normalized)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, and underscores.', normalized };
  }

  if (normalized.startsWith('_')) {
    return { isValid: false, error: 'Username cannot start with an underscore.', normalized };
  }

  if (normalized.endsWith('_')) {
    return { isValid: false, error: 'Username cannot end with an underscore.', normalized };
  }

  if (normalized.includes('__')) {
    return { isValid: false, error: 'Username cannot contain consecutive underscores.', normalized };
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return { isValid: false, error: 'This username is reserved. Please pick another one.', normalized };
  }

  return { isValid: true, error: null, normalized };
};



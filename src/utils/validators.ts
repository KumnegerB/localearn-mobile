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


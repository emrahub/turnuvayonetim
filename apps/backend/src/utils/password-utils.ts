import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuthErrorCode } from '../types/auth-types';

// ================================================================
// PASSWORD VALIDATION CONFIGURATION
// ================================================================

export interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidUserInfo: boolean; // Forbid using email, name, etc.
  maxAge: number; // Days before password expires
}

export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
  forbidUserInfo: true,
  maxAge: 90
};

// ================================================================
// PASSWORD VALIDATION
// ================================================================

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: PasswordStrength;
  score: number; // 0-100
}

export enum PasswordStrength {
  VERY_WEAK = 'VERY_WEAK',
  WEAK = 'WEAK',
  FAIR = 'FAIR',
  GOOD = 'GOOD',
  STRONG = 'STRONG'
}

export interface UserInfo {
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
}

/**
 * Validates password against security policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY,
  userInfo?: UserInfo
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  } else {
    score += Math.min(25, (password.length / policy.minLength) * 25);
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character requirement validation
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else if (policy.requireUppercase && /[A-Z]/.test(password)) {
    score += 15;
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else if (policy.requireLowercase && /[a-z]/.test(password)) {
    score += 15;
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (policy.requireNumbers && /\d/.test(password)) {
    score += 15;
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else if (policy.requireSpecialChars && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 15;
  }

  // Common password validation
  if (policy.forbidCommonPasswords && isCommonPassword(password)) {
    errors.push('Password is too common. Please choose a more unique password');
    score = Math.min(score, 30);
  }

  // User info validation
  if (policy.forbidUserInfo && userInfo && containsUserInfo(password, userInfo)) {
    errors.push('Password must not contain personal information');
    score = Math.min(score, 40);
  }

  // Additional complexity scoring
  score += calculateComplexityBonus(password);
  score = Math.min(100, Math.max(0, score));

  const strength = getPasswordStrength(score);

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score
  };
}

/**
 * Calculate additional complexity bonus
 */
function calculateComplexityBonus(password: string): number {
  let bonus = 0;

  // Length bonus
  if (password.length > 12) bonus += 5;
  if (password.length > 16) bonus += 5;

  // Character variety bonus
  const uniqueChars = new Set(password).size;
  if (uniqueChars > password.length * 0.7) bonus += 10;

  // No repeated patterns
  if (!hasRepeatedPatterns(password)) bonus += 5;

  // Mixed case throughout
  if (hasMixedCaseThroughout(password)) bonus += 5;

  return bonus;
}

/**
 * Check for repeated patterns in password
 */
function hasRepeatedPatterns(password: string): boolean {
  // Check for repeated sequences of 3+ characters
  for (let i = 0; i <= password.length - 6; i++) {
    const pattern = password.substring(i, i + 3);
    if (password.indexOf(pattern, i + 3) !== -1) {
      return true;
    }
  }

  // Check for repeated single characters (3+ times)
  return /(.)\1{2,}/.test(password);
}

/**
 * Check if password has mixed case throughout (not just at beginning/end)
 */
function hasMixedCaseThroughout(password: string): boolean {
  const middle = password.slice(1, -1);
  return /[A-Z]/.test(middle) && /[a-z]/.test(middle);
}

/**
 * Check if password contains user information
 */
function containsUserInfo(password: string, userInfo: UserInfo): boolean {
  const lowercasePassword = password.toLowerCase();

  if (userInfo.email) {
    const emailParts = userInfo.email.toLowerCase().split('@');
    if (emailParts[0].length > 3 && lowercasePassword.includes(emailParts[0])) {
      return true;
    }
  }

  if (userInfo.firstName && userInfo.firstName.length > 2) {
    if (lowercasePassword.includes(userInfo.firstName.toLowerCase())) {
      return true;
    }
  }

  if (userInfo.lastName && userInfo.lastName.length > 2) {
    if (lowercasePassword.includes(userInfo.lastName.toLowerCase())) {
      return true;
    }
  }

  if (userInfo.username && userInfo.username.length > 3) {
    if (lowercasePassword.includes(userInfo.username.toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
    'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
    'qwerty123', 'password12', 'password!', 'Password1', 'Password123',
    'welcome123', 'admin123', 'root', 'toor', 'pass', 'test', 'guest',
    'user', 'login', 'changeme', 'secret', 'dragon', 'mustang', 'master',
    'shadow', 'baseball', 'football', 'superman', 'michael', 'jordan',
    'harley', 'ranger', 'hunter', 'buster', 'soccer', 'trustno1'
  ];

  return commonPasswords.includes(password.toLowerCase());
}

/**
 * Get password strength based on score
 */
function getPasswordStrength(score: number): PasswordStrength {
  if (score < 20) return PasswordStrength.VERY_WEAK;
  if (score < 40) return PasswordStrength.WEAK;
  if (score < 60) return PasswordStrength.FAIR;
  if (score < 80) return PasswordStrength.GOOD;
  return PasswordStrength.STRONG;
}

// ================================================================
// PASSWORD HASHING
// ================================================================

export interface HashOptions {
  saltRounds?: number;
  pepper?: string;
}

const DEFAULT_SALT_ROUNDS = 12;

/**
 * Hash password with bcrypt and optional pepper
 */
export async function hashPassword(
  password: string,
  options: HashOptions = {}
): Promise<string> {
  const { saltRounds = DEFAULT_SALT_ROUNDS, pepper } = options;

  // Add pepper if provided
  const passwordWithPepper = pepper ? password + pepper : password;

  return bcrypt.hash(passwordWithPepper, saltRounds);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(
  password: string,
  hash: string,
  pepper?: string
): Promise<boolean> {
  try {
    // Add pepper if provided
    const passwordWithPepper = pepper ? password + pepper : password;

    return bcrypt.compare(passwordWithPepper, hash);
  } catch (error) {
    return false;
  }
}

/**
 * Check if password hash needs rehashing (due to updated salt rounds)
 */
export function needsRehash(
  hash: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS
): boolean {
  try {
    const rounds = bcrypt.getRounds(hash);
    return rounds < saltRounds;
  } catch (error) {
    return true; // If we can't get rounds, assume it needs rehashing
  }
}

// ================================================================
// PASSWORD RESET TOKENS
// ================================================================

export interface ResetTokenOptions {
  expirationMinutes?: number;
  includeTimestamp?: boolean;
}

/**
 * Generate secure password reset token
 */
export function generatePasswordResetToken(
  userId: string,
  options: ResetTokenOptions = {}
): { token: string; expiresAt: Date } {
  const { expirationMinutes = 30, includeTimestamp = true } = options;

  const randomBytes = crypto.randomBytes(32);
  const timestamp = includeTimestamp ? Date.now().toString(36) : '';
  const userIdHash = crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);

  const token = Buffer.concat([
    Buffer.from(timestamp, 'ascii'),
    Buffer.from(userIdHash, 'hex'),
    randomBytes
  ]).toString('base64url');

  const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

  return { token, expiresAt };
}

/**
 * Validate password reset token format
 */
export function validateResetTokenFormat(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64url');
    return decoded.length >= 40; // Minimum expected length
  } catch (error) {
    return false;
  }
}

// ================================================================
// ACCOUNT LOCKOUT MANAGEMENT
// ================================================================

export interface LockoutState {
  isLocked: boolean;
  failedAttempts: number;
  lockoutUntil?: Date;
  lastFailedAttempt?: Date;
}

export interface LockoutPolicy {
  maxAttempts: number;
  lockoutDuration: number; // minutes
  attemptWindow: number; // minutes - window to count attempts
  progressiveLockout: boolean; // increase lockout time with each lockout
}

export const DEFAULT_LOCKOUT_POLICY: LockoutPolicy = {
  maxAttempts: 5,
  lockoutDuration: 15,
  attemptWindow: 15,
  progressiveLockout: true
};

/**
 * Calculate lockout state based on failed attempts
 */
export function calculateLockoutState(
  failedAttempts: number,
  lastFailedAttempt: Date | null,
  policy: LockoutPolicy = DEFAULT_LOCKOUT_POLICY,
  previousLockouts: number = 0
): LockoutState {
  const now = new Date();

  // Reset attempts if outside attempt window
  if (lastFailedAttempt) {
    const timeSinceLastAttempt = now.getTime() - lastFailedAttempt.getTime();
    const attemptWindowMs = policy.attemptWindow * 60 * 1000;

    if (timeSinceLastAttempt > attemptWindowMs) {
      failedAttempts = 0;
    }
  }

  // Check if account should be locked
  if (failedAttempts >= policy.maxAttempts) {
    let lockoutDuration = policy.lockoutDuration;

    // Progressive lockout - increase duration with each lockout
    if (policy.progressiveLockout && previousLockouts > 0) {
      lockoutDuration = policy.lockoutDuration * Math.pow(2, Math.min(previousLockouts, 5));
    }

    const lockoutUntil = new Date(now.getTime() + lockoutDuration * 60 * 1000);

    return {
      isLocked: true,
      failedAttempts,
      lockoutUntil,
      lastFailedAttempt
    };
  }

  return {
    isLocked: false,
    failedAttempts,
    lastFailedAttempt
  };
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(lockoutState: LockoutState): boolean {
  if (!lockoutState.isLocked || !lockoutState.lockoutUntil) {
    return false;
  }

  return new Date() < lockoutState.lockoutUntil;
}

/**
 * Get time remaining until lockout expires
 */
export function getLockoutTimeRemaining(lockoutState: LockoutState): number {
  if (!lockoutState.isLocked || !lockoutState.lockoutUntil) {
    return 0;
  }

  const remaining = lockoutState.lockoutUntil.getTime() - Date.now();
  return Math.max(0, Math.ceil(remaining / 1000)); // seconds
}

// ================================================================
// SECURE RANDOM GENERATION
// ================================================================

/**
 * Generate cryptographically secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * Generate secure backup codes for 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    const formattedCode = code.substring(0, 4) + '-' + code.substring(4, 8);
    codes.push(formattedCode);
  }

  return codes;
}

/**
 * Generate secure session ID
 */
export function generateSessionId(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate JWT ID (jti) for token blacklisting
 */
export function generateJwtId(): string {
  return crypto.randomBytes(16).toString('base64url');
}

// ================================================================
// TIMING ATTACK PREVENTION
// ================================================================

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Add random delay to prevent timing attacks
 */
export async function addRandomDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ================================================================
// PASSWORD BREACH CHECKING
// ================================================================

/**
 * Hash password with SHA-1 for breach checking (k-anonymity)
 */
export function hashPasswordForBreachCheck(password: string): string {
  return crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
}

/**
 * Get k-anonymity prefix for Have I Been Pwned API
 */
export function getBreachCheckPrefix(password: string): string {
  const hash = hashPasswordForBreachCheck(password);
  return hash.substring(0, 5);
}

/**
 * Check if password hash suffix matches any in breach response
 */
export function isPasswordBreached(password: string, breachResponse: string): boolean {
  const hash = hashPasswordForBreachCheck(password);
  const suffix = hash.substring(5);

  const lines = breachResponse.split('\n');
  return lines.some(line => {
    const [breachedSuffix] = line.split(':');
    return breachedSuffix === suffix;
  });
}

// ================================================================
// EXPORTS
// ================================================================
// All types are already exported via their declarations above
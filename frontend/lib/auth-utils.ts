import bcrypt from 'bcryptjs';
import { generateSecret, verifySync } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

// Bcrypt configuration
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash
 * @param password - Plain text password
 * @param hash - Bcrypt hash to verify against
 * @returns True if password matches hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a TOTP secret for 2FA
 * @returns Base32 encoded secret
 */
export function generateTOTPSecret(): string {
  return generateSecret();
}

/**
 * Generate a QR code URL for TOTP setup
 * @param secret - TOTP secret (base32 encoded)
 * @param username - Username for the account
 * @returns Data URL for QR code image
 */
export async function generateTOTPQRCode(
  secret: string,
  username: string
): Promise<string> {
  const issuer = 'HyFern';
  const otpauth = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  return QRCode.toDataURL(otpauth);
}

/**
 * Verify a TOTP token against a secret
 * @param secret - TOTP secret (base32 encoded)
 * @param token - 6-digit TOTP token
 * @returns True if token is valid
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return result.valid;
  } catch (error) {
    return false;
  }
}

/**
 * Generate recovery codes for 2FA backup
 * @returns Array of 10 recovery codes (8 characters each)
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];

  for (let i = 0; i < 10; i++) {
    // Generate 8 character alphanumeric code
    const code = randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }

  return codes;
}

/**
 * Hash a recovery code using bcrypt
 * @param code - Plain text recovery code
 * @returns Hashed recovery code
 */
export async function hashRecoveryCode(code: string): Promise<string> {
  return bcrypt.hash(code, SALT_ROUNDS);
}

/**
 * Verify a recovery code against a hash
 * @param code - Plain text recovery code
 * @param hash - Bcrypt hash to verify against
 * @returns True if code matches hash
 */
export async function verifyRecoveryCode(
  code: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

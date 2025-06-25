import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// 定义更灵活的 payload 类型
type TokenPayload = JWTPayload & Record<string, any>;

/**
 * 生成一个随机验证码。
 * @returns 生成的验证码字符串
 */
export function generateVerificationCode(): string {
  const characterSet = '0123456789';
  let code = '';
  const characterSetLength = characterSet.length;
  // 生成验证码
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characterSetLength);
    code += characterSet[randomIndex];
  }
  return code;
}

/**
 * 生成随机token
 * @returns 生成的token字符串
 */
export function generateToken(): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(32).padStart(2, '0')).join('');
}

/**
 * 生成JWT访问令牌
 * @param payload 要编码的数据
 * @param expiresIn 过期时间，默认1小时
 * @returns JWT token
 */
export async function generateAccessToken(
  payload: TokenPayload,
  expiresIn: string = '24h'
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  return await jwt.sign(secret);
}

/**
 * 生成JWT刷新令牌
 * @param payload 要编码的数据
 * @param expiresIn 过期时间，默认7天
 * @returns JWT refresh token
 */
export async function generateRefreshToken(
  payload: TokenPayload,
  expiresIn: string = '7d'
): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const jwt = new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn);

  return await jwt.sign(secret);
}

/**
 * 验证JWT令牌
 * @param token JWT令牌
 * @returns 解码后的payload或null
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    const secretKey = process.env.JWT_SECRET;
    const secret = new TextEncoder().encode(secretKey);
    const { payload } = await jwtVerify(token, secret);
    return { valid: true, payload };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Invalid token',
    };
  }
}

/**
 * 获取客户端IP地址
 * @param request Request对象
 * @returns IP地址
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return '127.0.0.1';
}

export function getUserFromHeaders(headers: Headers) {
  return {
    userId: headers.get('x-user-id'),
    email: headers.get('x-user-email'),
  };
}

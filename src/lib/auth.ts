import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { NextRequest } from 'next/server'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createToken(payload: any): Promise<string> {
  console.log('🎫 Creating token for payload:', payload)
  console.log('🔑 Secret available for creation:', !!process.env.JWT_SECRET)
  
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
    
  console.log('✅ Token created successfully:', token.substring(0, 30) + '...')
  return token
}

// Alias for backward compatibility
export const generateToken = createToken

export async function verifyToken(tokenOrRequest: string | NextRequest): Promise<any> {
  try {
    let token: string
    
    if (typeof tokenOrRequest === 'string') {
      token = tokenOrRequest
    } else {
      // NextRequest case
      const authHeader = tokenOrRequest.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { success: false, error: 'No valid Bearer token found' }
      }
      token = authHeader.substring(7)
    }
    
    console.log('🔍 Verifying token:', token.substring(0, 20) + '...')
    console.log('🔑 Secret available:', !!process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)
    console.log('✅ Token verified successfully:', payload)
    
    return { success: true, payload }
  } catch (error) {
    console.log('❌ Token verification failed:', error)
    return { success: false, error: 'Invalid token' }
  }
}

export function extractTokenFromHeaders(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  console.log('🔍 Authorization header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'null')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Bearer token found')
    return null
  }
  
  const token = authHeader.substring(7)
  console.log('✅ Token extracted:', token.substring(0, 20) + '...')
  return token
}

export async function generateInvitationToken(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
} 
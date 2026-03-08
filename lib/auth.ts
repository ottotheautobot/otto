import bcrypt from 'bcryptjs'

const PASSWORD_HASH = process.env.AUTH_PASSWORD_HASH

export async function verifyPassword(password: string): Promise<boolean> {
  if (!PASSWORD_HASH) {
    console.error('AUTH_PASSWORD_HASH not set')
    return false
  }
  return bcrypt.compare(password, PASSWORD_HASH)
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function generatePasswordHash(password: string): Promise<string> {
  const hash = await hashPassword(password)
  console.log(`Your AUTH_PASSWORD_HASH is: ${hash}`)
  console.log('Add this to your .env.local file')
  return hash
}

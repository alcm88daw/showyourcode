import { signIn, signOut, fetchUserAttributes } from 'aws-amplify/auth'

export async function login(email, password) {
  const { isSignedIn, nextStep } = await signIn({ username: email, password })
  if (!isSignedIn) throw new Error('Paso adicional requerido: ' + nextStep.signInStep)
  const attrs = await fetchUserAttributes()
  return { email, role: attrs['custom:role'] || 'alumno' }
}

export async function logout() {
  await signOut()
}

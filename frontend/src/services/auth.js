import { signIn, signOut, fetchUserAttributes } from 'aws-amplify/auth'

export async function login(email, password) {
  try {
    const { isSignedIn, nextStep } = await signIn({ username: email, password, options: { authFlowType: 'USER_PASSWORD_AUTH' } })
    if (!isSignedIn) throw new Error('Paso adicional requerido: ' + nextStep.signInStep)
  } catch (err) {
    if (err.name !== 'UserAlreadyAuthenticatedException') throw err
    // Ya hay sesión activa — continuamos a recuperar atributos
  }
  const attrs = await fetchUserAttributes()
  return { email, role: attrs['custom:role'] || 'alumno' }
}

export async function logout() {
  await signOut()
}

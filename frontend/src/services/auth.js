import { signIn, signOut, confirmSignIn, fetchUserAttributes } from 'aws-amplify/auth'

export async function login(email, password) {
  try {
    const { isSignedIn, nextStep } = await signIn({ username: email, password, options: { authFlowType: 'USER_PASSWORD_AUTH' } })
    if (!isSignedIn) {
      if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        return { requiresNewPassword: true }
      }
      throw new Error('Paso adicional requerido: ' + nextStep.signInStep)
    }
  } catch (err) {
    if (err.name !== 'UserAlreadyAuthenticatedException') throw err
  }
  const attrs = await fetchUserAttributes()
  return { email, role: attrs['custom:role'] || 'alumno' }
}

export async function setNewPassword(newPassword) {
  const { isSignedIn } = await confirmSignIn({ challengeResponse: newPassword })
  if (!isSignedIn) throw new Error('No se pudo completar el cambio de contraseña')
  const attrs = await fetchUserAttributes()
  return { role: attrs['custom:role'] || 'alumno' }
}

export async function logout() {
  await signOut()
}

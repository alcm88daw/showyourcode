// Cognito Post Confirmation trigger: asigna rol por defecto al usuario
exports.handler = async (event) => {
  if (event.triggerSource === 'PostConfirmation_ConfirmSignUp') {
    const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand } = await import(
      '@aws-sdk/client-cognito-identity-provider'
    )
    const client = new CognitoIdentityProviderClient()
    await client.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: event.userPoolId,
        Username: event.userName,
        UserAttributes: [{ Name: 'custom:role', Value: 'alumno' }],
      })
    )
  }
  return event
}

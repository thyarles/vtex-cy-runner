// Twilio
Cypress.Commands.add('twilioOtp', (url, sid, token, wait) => {
  cy.wait(wait) // eslint-disable-line cypress/no-unnecessary-waiting
  cy.request({
    method: 'GET',
    url: url,
    form: true,
    auth: {
      username: sid,
      password: token,
    },
    failOnStatusCode: false,
  }).then((response) => {
    let code = response.body.messages[0].body
    return code.substring(0, 6)
  })
})
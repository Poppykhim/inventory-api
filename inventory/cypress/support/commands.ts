// Custom Cypress commands

declare global {
  namespace Cypress {
    interface Chainable {
      loginAs(username: string, password: string): Chainable<void>
      loginAsAdmin(): Chainable<void>
      loginAsUser(): Chainable<void>
      setAuthToken(token: string): Chainable<void>
      apiLogin(username: string, password: string): Chainable<string>
    }
  }
}

// UI login via the login form
Cypress.Commands.add('loginAs', (username: string, password: string) => {
  cy.visit('/login')
  cy.get('[data-cy=input-username]').clear().type(username)
  cy.get('[data-cy=input-password]').clear().type(password)
  cy.get('[data-cy=btn-login]').click()
  cy.url().should('eq', Cypress.config('baseUrl') + '/')
})

// Login via API (faster – skips UI)
Cypress.Commands.add('apiLogin', (username: string, password: string): any => {
  return cy.request({
    method: 'POST',
    url: 'http://127.0.0.1:3000/auth/login',
    body: { username, password },
    failOnStatusCode: false,
  }).then((res) => {
    if (res.status === 201 || res.status === 200) {
      return res.body.access_token as string
    }
    // If login fails, try registering first
    return cy.request({
      method: 'POST',
      url: 'http://127.0.0.1:3000/auth/register',
      body: { username, email: `${username}@test.com`, password, role: username.includes('admin') ? 'admin' : 'user' },
      failOnStatusCode: false,
    }).then(() => {
      return cy.request({
        method: 'POST',
        url: 'http://127.0.0.1:3000/auth/login',
        body: { username, password },
      }).then(r => r.body.access_token as string)
    })
  }) as any
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('data').then((data) => {
    cy.apiLogin(data.adminUser.username, data.adminUser.password).then((token) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify({ username: data.adminUser.username, role: 'admin' }))
    })
  })
})

Cypress.Commands.add('loginAsUser', () => {
  cy.fixture('data').then((data) => {
    cy.apiLogin(data.regularUser.username, data.regularUser.password).then((token) => {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify({ username: data.regularUser.username, role: 'user' }))
    })
  })
})

Cypress.Commands.add('setAuthToken', (token: string) => {
  localStorage.setItem('token', token)
})

export {}

/// <reference types="cypress" />

describe('Error Pages and Error Messages', () => {
  // ── 404 Page ──────────────────────────────────────────────────────────────

  describe('404 Not Found Page', () => {
    it('shows 404 page for unknown route', () => {
      cy.visit('/this-route-does-not-exist', { failOnStatusCode: false })
      cy.get('[data-cy=not-found-page]').should('be.visible')
      cy.contains('404').should('be.visible')
      cy.contains('Page Not Found').should('be.visible')
    })

    it('shows 404 page for deeply nested unknown route', () => {
      cy.visit('/inventory/some/deep/path', { failOnStatusCode: false })
      cy.get('[data-cy=not-found-page]').should('be.visible')
    })

    it('Go to Dashboard button navigates home', () => {
      cy.loginAsAdmin()
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      cy.get('[data-cy=btn-go-home]').click()
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
    })

    it('Go Back button works', () => {
      cy.loginAsAdmin()
      cy.visit('/')
      cy.visit('/nonexistent-page', { failOnStatusCode: false })
      cy.get('[data-cy=btn-go-back]').click()
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
    })
  })

  // ── Auth Error Messages ───────────────────────────────────────────────────

  describe('Auth Error Messages', () => {
    beforeEach(() => cy.clearLocalStorage())

    it('displays inline field error for empty login username', () => {
      cy.visit('/login')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=error-username]').should('be.visible').and('contain', 'Username is required')
    })

    it('displays inline field error for empty login password', () => {
      cy.visit('/login')
      cy.get('[data-cy=input-username]').type('someone')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=error-password]').should('be.visible').and('contain', 'Password is required')
    })

    it('displays API error for wrong login credentials', () => {
      cy.visit('/login')
      cy.get('[data-cy=input-username]').type('nobody_here')
      cy.get('[data-cy=input-password]').type('wrongpass!')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=login-error]', { timeout: 8000 }).should('be.visible')
    })

    it('clears error message when user starts typing again', () => {
      cy.visit('/login')
      cy.get('[data-cy=input-username]').type('nobody')
      cy.get('[data-cy=input-password]').type('wrongpass')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=login-error]', { timeout: 8000 }).should('be.visible')
      cy.get('[data-cy=input-username]').type('a') // triggers clearError
      cy.get('[data-cy=login-error]').should('not.exist')
    })

    it('displays all register validation errors at once', () => {
      cy.visit('/register')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-username]').should('be.visible')
      cy.get('[data-cy=error-email]').should('be.visible')
      cy.get('[data-cy=error-password]').should('be.visible')
    })

    it('shows password mismatch error specifically', () => {
      cy.visit('/register')
      cy.get('[data-cy=input-username]').type('validuser')
      cy.get('[data-cy=input-email]').type('valid@test.com')
      cy.get('[data-cy=input-password]').type('password1')
      cy.get('[data-cy=input-confirm-password]').type('password2')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-confirm-password]').should('contain', 'Passwords do not match')
    })
  })

  // ── Inventory Error Messages ──────────────────────────────────────────────

  describe('Inventory Form Error Messages', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
      cy.visit('/inventory')
    })

    it('shows required field errors in create modal', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=btn-submit-create]').click()
      cy.get('[data-cy=create-name]').closest('.form-group').find('.form-error').should('contain', 'Name is required')
      cy.get('[data-cy=create-sku]').closest('.form-group').find('.form-error').should('contain', 'SKU is required')
      cy.get('[data-cy=create-category]').closest('.form-group').find('.form-error').should('contain', 'Category is required')
    })

    it('shows price validation error for zero price', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=create-name]').type('Test')
      cy.get('[data-cy=create-sku]').type('SKU-001')
      cy.get('[data-cy=create-category]').type('Cat')
      cy.get('[data-cy=create-supplier]').select(1)
      cy.get('[data-cy=create-quantity]').clear().type('10')
      cy.get('[data-cy=create-price]').clear().type('0')
      cy.get('[data-cy=btn-submit-create]').click()
      cy.get('.form-error').should('contain', 'Must be > 0')
    })

    it('shows stock adjustment warning for zero value', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-stock-]').click()
      })
      cy.get('[data-cy=stock-adjustment]').clear().type('0')
      cy.get('[data-cy=btn-submit-stock]').click()
      cy.get('[data-cy=toast-warning]').should('be.visible')
    })
  })

  // ── Supplier Form Error Messages ──────────────────────────────────────────

  describe('Supplier Form Error Messages', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
      cy.visit('/suppliers')
    })

    it('shows all required field errors in create modal', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=btn-submit-supplier]').click()
      cy.get('[data-cy=error-supplier-name]').should('be.visible')
      cy.get('[data-cy=error-supplier-email]').should('be.visible')
      cy.get('[data-cy=error-supplier-phone]').should('be.visible')
      cy.get('[data-cy=error-supplier-address]').should('be.visible')
    })

    it('shows invalid email format error', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=supplier-name]').type('Valid Co')
      cy.get('[data-cy=supplier-email]').type('not-valid-email')
      cy.get('[data-cy=supplier-phone]').type('+1-555-0001')
      cy.get('[data-cy=supplier-address]').type('123 St')
      cy.get('[data-cy=btn-submit-supplier]').click()
      cy.get('[data-cy=error-supplier-email]').should('contain', 'Invalid email')
    })
  })

  // ── Unauthenticated Access Errors ─────────────────────────────────────────

  describe('Unauthenticated Access Redirect', () => {
    it('redirects to login with redirect query param', () => {
      cy.clearLocalStorage()
      cy.visit('/inventory')
      cy.url().should('include', '/login')
      cy.url().should('include', 'redirect')
    })

    it('restores redirect after login', () => {
      cy.clearLocalStorage()
      cy.fixture('data').then((data) => {
        cy.visit('/inventory')
        cy.url().should('include', '/login')
        cy.request({
          method: 'POST',
          url: 'http://127.0.0.1:3000/auth/register',
          body: data.adminUser,
          failOnStatusCode: false,
        })
        cy.get('[data-cy=input-username]').type(data.adminUser.username)
        cy.get('[data-cy=input-password]').type(data.adminUser.password)
        cy.get('[data-cy=btn-login]').click()
        cy.url({ timeout: 8000 }).should('include', '/inventory')
      })
    })
  })
})

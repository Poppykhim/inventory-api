/// <reference types="cypress" />

describe('Authentication UI', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  // ── Login Page ────────────────────────────────────────────────────────────

  describe('Login Page', () => {
    beforeEach(() => cy.visit('/login'))

    it('renders the login form', () => {
      cy.get('[data-cy=login-form]').should('be.visible')
      cy.get('[data-cy=input-username]').should('be.visible')
      cy.get('[data-cy=input-password]').should('be.visible')
      cy.get('[data-cy=btn-login]').should('be.visible').and('contain', 'Sign In')
    })

    it('shows validation errors when submitted empty', () => {
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=error-username]').should('contain', 'Username is required')
      cy.get('[data-cy=error-password]').should('contain', 'Password is required')
    })

    it('shows validation error for empty username only', () => {
      cy.get('[data-cy=input-password]').type('somepassword')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=error-username]').should('contain', 'Username is required')
      cy.get('[data-cy=error-password]').should('not.exist')
    })

    it('shows validation error for empty password only', () => {
      cy.get('[data-cy=input-username]').type('someuser')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=error-password]').should('contain', 'Password is required')
      cy.get('[data-cy=error-username]').should('not.exist')
    })

    it('shows API error message on wrong credentials', () => {
      cy.get('[data-cy=input-username]').type('wronguser')
      cy.get('[data-cy=input-password]').type('wrongpass')
      cy.get('[data-cy=btn-login]').click()
      cy.get('[data-cy=login-error]', { timeout: 8000 }).should('be.visible')
    })

    it('has a link to the register page', () => {
      cy.get('[data-cy=link-register]').click()
      cy.url().should('include', '/register')
    })

    it('redirects to dashboard after successful login', () => {
      cy.fixture('data').then((data) => {
        // Ensure user exists first via API
        cy.request({
          method: 'POST',
          url: 'http://127.0.0.1:3000/auth/register',
          body: data.adminUser,
          failOnStatusCode: false,
        })
        cy.get('[data-cy=input-username]').type(data.adminUser.username)
        cy.get('[data-cy=input-password]').type(data.adminUser.password)
        cy.get('[data-cy=btn-login]').click()
        cy.url({ timeout: 8000 }).should('eq', Cypress.config('baseUrl') + '/')
        cy.get('[data-cy=dashboard-page]').should('be.visible')
      })
    })

    it('shows loading state during login', () => {
      cy.get('[data-cy=input-username]').type('admin')
      cy.get('[data-cy=input-password]').type('admin123')
      cy.get('[data-cy=btn-login]').click()
      // Button should be disabled while loading
      cy.get('[data-cy=btn-login]').should('be.disabled')
    })

    it('redirects already-authenticated user to dashboard', () => {
      cy.loginAsAdmin()
      cy.visit('/login')
      cy.url().should('eq', Cypress.config('baseUrl') + '/')
    })
  })

  // ── Register Page ─────────────────────────────────────────────────────────

  describe('Register Page', () => {
    beforeEach(() => cy.visit('/register'))

    it('renders the register form', () => {
      cy.get('[data-cy=register-form]').should('be.visible')
      cy.get('[data-cy=input-username]').should('be.visible')
      cy.get('[data-cy=input-email]').should('be.visible')
      cy.get('[data-cy=input-password]').should('be.visible')
      cy.get('[data-cy=input-confirm-password]').should('be.visible')
      cy.get('[data-cy=select-role]').should('be.visible')
      cy.get('[data-cy=btn-register]').should('contain', 'Create Account')
    })

    it('shows validation errors when submitted empty', () => {
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-username]').should('contain', 'Username is required')
      cy.get('[data-cy=error-email]').should('contain', 'Email is required')
      cy.get('[data-cy=error-password]').should('contain', 'Password is required')
    })

    it('validates username minimum length', () => {
      cy.get('[data-cy=input-username]').type('ab')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-username]').should('contain', 'Minimum 3 characters')
    })

    it('validates invalid email format', () => {
      cy.get('[data-cy=input-username]').type('testuser')
      cy.get('[data-cy=input-email]').type('not-an-email')
      cy.get('[data-cy=input-password]').type('password123')
      cy.get('[data-cy=input-confirm-password]').type('password123')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-email]').should('contain', 'Invalid email address')
    })

    it('validates password minimum length', () => {
      cy.get('[data-cy=input-username]').type('testuser')
      cy.get('[data-cy=input-email]').type('test@test.com')
      cy.get('[data-cy=input-password]').type('abc')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-password]').should('contain', 'Minimum 6 characters')
    })

    it('validates password confirmation mismatch', () => {
      cy.get('[data-cy=input-username]').type('testuser')
      cy.get('[data-cy=input-email]').type('test@test.com')
      cy.get('[data-cy=input-password]').type('password123')
      cy.get('[data-cy=input-confirm-password]').type('different')
      cy.get('[data-cy=btn-register]').click()
      cy.get('[data-cy=error-confirm-password]').should('contain', 'Passwords do not match')
    })

    it('can select admin role', () => {
      cy.get('[data-cy=select-role]').select('admin')
      cy.get('[data-cy=select-role]').should('have.value', 'admin')
    })

    it('has a link to the login page', () => {
      cy.get('[data-cy=link-login]').click()
      cy.url().should('include', '/login')
    })

    it('shows API error for duplicate username', () => {
      cy.fixture('data').then((data) => {
        // Ensure user already exists
        cy.request({
          method: 'POST',
          url: 'http://127.0.0.1:3000/auth/register',
          body: data.adminUser,
          failOnStatusCode: false,
        })
        cy.get('[data-cy=input-username]').type(data.adminUser.username)
        cy.get('[data-cy=input-email]').type('another@test.com')
        cy.get('[data-cy=input-password]').type(data.adminUser.password)
        cy.get('[data-cy=input-confirm-password]').type(data.adminUser.password)
        cy.get('[data-cy=btn-register]').click()
        cy.get('[data-cy=register-error]', { timeout: 8000 }).should('be.visible')
      })
    })
  })

  // ── Auth Guards ───────────────────────────────────────────────────────────

  describe('Route Guards', () => {
    it('redirects unauthenticated user from dashboard to login', () => {
      cy.clearLocalStorage()
      cy.visit('/')
      cy.url().should('include', '/login')
    })

    it('redirects unauthenticated user from inventory to login', () => {
      cy.clearLocalStorage()
      cy.visit('/inventory')
      cy.url().should('include', '/login')
    })

    it('redirects unauthenticated user from suppliers to login', () => {
      cy.clearLocalStorage()
      cy.visit('/suppliers')
      cy.url().should('include', '/login')
    })
  })

  // ── Navbar & Logout ───────────────────────────────────────────────────────

  describe('Navbar and Logout', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
      cy.visit('/')
    })

    it('shows navbar when authenticated', () => {
      cy.get('[data-cy=navbar]').should('be.visible')
      cy.get('[data-cy=nav-dashboard]').should('be.visible')
      cy.get('[data-cy=nav-inventory]').should('be.visible')
      cy.get('[data-cy=nav-suppliers]').should('be.visible')
    })

    it('can navigate to inventory via navbar', () => {
      cy.get('[data-cy=nav-inventory]').click()
      cy.url().should('include', '/inventory')
      cy.get('[data-cy=inventory-page]').should('be.visible')
    })

    it('can navigate to profile via navbar', () => {
      cy.get('[data-cy=nav-profile]').click()
      cy.url().should('include', '/profile')
      cy.get('[data-cy=profile-page]').should('be.visible')
    })

    it('logs out and redirects to login', () => {
      cy.get('[data-cy=btn-logout]').click()
      cy.url().should('include', '/login')
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null
      })
    })
  })

  // ── Profile Page ──────────────────────────────────────────────────────────

  describe('Profile Page', () => {
    beforeEach(() => {
      cy.loginAsAdmin()
      cy.visit('/profile')
    })

    it('displays user profile information', () => {
      cy.get('[data-cy=profile-page]').should('be.visible')
      cy.get('[data-cy=profile-username]').should('be.visible')
      cy.get('[data-cy=profile-email]').should('be.visible')
      cy.get('[data-cy=profile-role]').should('be.visible')
    })
  })
})

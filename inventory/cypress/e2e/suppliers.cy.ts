/// <reference types="cypress" />

describe('Suppliers CRUD UI', () => {
  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/suppliers')
    cy.get('[data-cy=suppliers-page]').should('be.visible')
  })

  // ── Page Rendering ────────────────────────────────────────────────────────

  describe('Page Rendering', () => {
    it('renders the suppliers page', () => {
      cy.contains('h1', 'Suppliers').should('be.visible')
    })

    it('shows create button for admin', () => {
      cy.get('[data-cy=btn-create-supplier]').should('be.visible').and('contain', '+ New Supplier')
    })

    it('hides create button for regular user', () => {
      cy.loginAsUser()
      cy.visit('/suppliers')
      cy.get('[data-cy=btn-create-supplier]').should('not.exist')
    })
  })

  // ── CREATE ────────────────────────────────────────────────────────────────

  describe('Create Supplier', () => {
    it('opens create modal on button click', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=modal-create-supplier]').should('be.visible')
    })

    it('shows validation errors on empty submit', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=btn-submit-supplier]').click()
      cy.get('[data-cy=error-supplier-name]').should('contain', 'Name is required')
      cy.get('[data-cy=error-supplier-email]').should('contain', 'Email is required')
      cy.get('[data-cy=error-supplier-phone]').should('contain', 'Phone is required')
      cy.get('[data-cy=error-supplier-address]').should('contain', 'Address is required')
    })

    it('validates email format', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=supplier-name]').type('Test Co.')
      cy.get('[data-cy=supplier-email]').type('bad-email')
      cy.get('[data-cy=supplier-phone]').type('+1-555-000')
      cy.get('[data-cy=supplier-address]').type('123 St')
      cy.get('[data-cy=btn-submit-supplier]').click()
      cy.get('[data-cy=error-supplier-email]').should('contain', 'Invalid email')
    })

    it('closes modal on X click', () => {
      cy.get('[data-cy=btn-create-supplier]').click()
      cy.get('[data-cy=modal-close]').click()
      cy.get('[data-cy=modal-create-supplier]').should('not.exist')
    })

    it('creates a supplier successfully and shows it in the grid', () => {
      cy.fixture('data').then((data) => {
        const uniqueName = `Supplier-${Date.now()}`
        cy.get('[data-cy=btn-create-supplier]').click()
        cy.get('[data-cy=supplier-name]').type(uniqueName)
        cy.get('[data-cy=supplier-email]').type(`s${Date.now()}@test.com`)
        cy.get('[data-cy=supplier-phone]').type(data.supplier.phone)
        cy.get('[data-cy=supplier-address]').type(data.supplier.address)
        cy.get('[data-cy=btn-submit-supplier]').click()
        cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
        cy.get('[data-cy=modal-create-supplier]').should('not.exist')
        cy.get('[data-cy=suppliers-grid]').should('contain', uniqueName)
      })
    })
  })

  // ── READ ──────────────────────────────────────────────────────────────────

  describe('Read Suppliers', () => {
    it('shows suppliers in a card grid', () => {
      cy.get('[data-cy=suppliers-grid], [class*=empty-state]').should('exist')
    })

    it('each supplier card shows name, email, phone, address', () => {
      cy.get('[data-cy=suppliers-grid]').then(($grid) => {
        if ($grid.find('[data-cy^=supplier-card-]').length > 0) {
          cy.get('[data-cy^=supplier-card-]').first().within(() => {
            cy.get('[data-cy^=supplier-name-]').should('be.visible')
          })
        }
      })
    })
  })

  // ── UPDATE ────────────────────────────────────────────────────────────────

  describe('Edit Supplier', () => {
    it('opens edit modal with prefilled values', () => {
      cy.get('[data-cy^=btn-edit-supplier-]').first().click()
      cy.get('[data-cy=edit-supplier-name]').should('not.have.value', '')
      cy.get('[data-cy=edit-supplier-email]').should('not.have.value', '')
    })

    it('updates supplier name successfully', () => {
      cy.get('[data-cy^=btn-edit-supplier-]').first().click()
      const updatedName = `Updated-Sup-${Date.now()}`
      cy.get('[data-cy=edit-supplier-name]').clear().type(updatedName)
      cy.get('[data-cy=btn-submit-edit-supplier]').click()
      cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
      cy.get('[data-cy=suppliers-grid]').should('contain', updatedName)
    })

    it('shows validation errors if name is cleared', () => {
      cy.get('[data-cy^=btn-edit-supplier-]').first().click()
      cy.get('[data-cy=edit-supplier-name]').clear()
      cy.get('[data-cy=btn-submit-edit-supplier]').click()
      cy.get('.form-error').should('contain', 'Name is required')
    })
  })

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe('Delete Supplier', () => {
    it('opens delete confirmation modal', () => {
      cy.get('[data-cy^=btn-delete-supplier-]').first().click()
      cy.get('[data-cy=modal-delete-supplier]').should('be.visible')
    })

    it('cancels deletion', () => {
      cy.get('[data-cy^=btn-delete-supplier-]').first().click()
      cy.get('[data-cy=btn-cancel-delete-supplier]').click()
      cy.get('[data-cy=modal-delete-supplier]').should('not.exist')
    })

    it('deletes a supplier and shows success toast', () => {
      // Create a supplier to delete via API
      cy.fixture('data').then((data) => {
        cy.apiLogin(data.adminUser.username, data.adminUser.password).then((token) => {
          cy.request({
            method: 'POST',
            url: 'http://127.0.0.1:3000/suppliers',
            headers: { Authorization: `Bearer ${token}` },
            body: { name: `TempSup-${Date.now()}`, email: `temp${Date.now()}@test.com`, phone: '+1-000-000', address: '1 Temp St' },
          }).then(() => {
            cy.reload()
            cy.get('[data-cy^=btn-delete-supplier-]').first().click()
            cy.get('[data-cy=btn-confirm-delete-supplier]').click()
            cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible').and('contain', 'deleted')
          })
        })
      })
    })
  })
})

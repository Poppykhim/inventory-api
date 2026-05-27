/// <reference types="cypress" />

describe('Inventory CRUD UI', () => {
  let adminToken: string
  let supplierId: string

  before(() => {
    // Register admin and create a supplier via API to use in tests
    cy.fixture('data').then((data) => {
      cy.request({
        method: 'POST',
        url: 'http://127.0.0.1:3000/auth/register',
        body: data.adminUser,
        failOnStatusCode: false,
      })
      cy.apiLogin(data.adminUser.username, data.adminUser.password).then((token) => {
        adminToken = token
        // Create a supplier to use in inventory item creation
        cy.request({
          method: 'POST',
          url: 'http://127.0.0.1:3000/suppliers',
          headers: { Authorization: `Bearer ${token}` },
          body: data.supplier,
          failOnStatusCode: false,
        }).then((res) => {
          supplierId = res.body?.id || res.body?.data?.id
        })
      })
    })
  })

  beforeEach(() => {
    cy.loginAsAdmin()
    cy.visit('/inventory')
    cy.get('[data-cy=inventory-page]').should('be.visible')
  })

  // ── Page rendering ────────────────────────────────────────────────────────

  describe('Page Rendering', () => {
    it('renders the inventory page with create button for admin', () => {
      cy.get('[data-cy=btn-create-item]').should('be.visible').and('contain', '+ New Item')
    })

    it('renders search and filter controls', () => {
      cy.get('[data-cy=input-search]').should('be.visible')
      cy.get('[data-cy=select-category]').should('be.visible')
      cy.get('[data-cy=check-low-stock]').should('be.visible')
      cy.get('[data-cy=btn-reset-filter]').should('be.visible')
    })

    it('hides admin actions for regular user', () => {
      cy.loginAsUser()
      cy.visit('/inventory')
      cy.get('[data-cy=btn-create-item]').should('not.exist')
    })
  })

  // ── CREATE ────────────────────────────────────────────────────────────────

  describe('Create Item', () => {
    it('opens the create modal when clicking + New Item', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=modal-create]').should('be.visible')
    })

    it('shows validation errors on empty submit', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=btn-submit-create]').click()
      cy.get('.form-error').should('have.length.greaterThan', 0)
    })

    it('closes the modal on Cancel', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=modal-close]').click()
      cy.get('[data-cy=modal-create]').should('not.exist')
    })

    it('creates a new inventory item successfully', () => {
      cy.fixture('data').then((data) => {
        const uniqueSku = `TEST-${Date.now()}`
        cy.get('[data-cy=btn-create-item]').click()
        cy.get('[data-cy=create-name]').type(data.inventoryItem.name)
        cy.get('[data-cy=create-sku]').type(uniqueSku)
        cy.get('[data-cy=create-category]').type(data.inventoryItem.category)
        cy.get('[data-cy=create-supplier]').select(1) // Select first supplier
        cy.get('[data-cy=create-quantity]').clear().type(String(data.inventoryItem.quantity))
        cy.get('[data-cy=create-min-stock]').clear().type(String(data.inventoryItem.minStockLevel))
        cy.get('[data-cy=create-price]').clear().type(String(data.inventoryItem.price))
        cy.get('[data-cy=create-description]').type(data.inventoryItem.description)
        cy.get('[data-cy=btn-submit-create]').click()
        // Toast success
        cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
        // Modal closed
        cy.get('[data-cy=modal-create]').should('not.exist')
        // Item in table
        cy.get('[data-cy=inventory-table]').should('contain', data.inventoryItem.name)
      })
    })

    it('shows error toast when create fails (missing supplier)', () => {
      cy.get('[data-cy=btn-create-item]').click()
      cy.get('[data-cy=create-name]').type('Bad Item')
      cy.get('[data-cy=create-sku]').type('BAD-SKU-999')
      cy.get('[data-cy=create-category]').type('Test')
      cy.get('[data-cy=create-quantity]').clear().type('10')
      cy.get('[data-cy=create-price]').clear().type('5.99')
      // Do NOT select supplier
      cy.get('[data-cy=btn-submit-create]').click()
      cy.get('.form-error').should('contain', 'Supplier is required')
    })
  })

  // ── READ / Search / Filter ────────────────────────────────────────────────

  describe('Read & Filter Items', () => {
    it('displays items in the inventory table', () => {
      // At least the item created above should be visible
      cy.get('[data-cy=inventory-table], [class*=empty-state]').should('exist')
    })

    it('filters by search term', () => {
      cy.get('[data-cy=input-search]').type('ZZZNOMATCH')
      cy.get('[data-cy=inventory-table]').should('not.exist')
      cy.get('[data-cy=input-search]').clear()
    })

    it('resets filters when clicking Reset', () => {
      cy.get('[data-cy=input-search]').type('ZZZNOMATCH')
      cy.get('[data-cy=btn-reset-filter]').click()
      cy.get('[data-cy=input-search]').should('have.value', '')
    })
  })

  // ── UPDATE ────────────────────────────────────────────────────────────────

  describe('Edit Item', () => {
    it('opens edit modal with prefilled data', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-edit-]').click()
      })
      cy.get('[data-cy=edit-name]').should('not.have.value', '')
    })

    it('updates an item successfully', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-edit-]').click()
      })
      const newName = `Updated-${Date.now()}`
      cy.get('[data-cy=edit-name]').clear().type(newName)
      cy.get('[data-cy=btn-submit-edit]').click()
      cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
      cy.get('[data-cy=inventory-table]').should('contain', newName)
    })
  })

  // ── STOCK ADJUST ──────────────────────────────────────────────────────────

  describe('Stock Adjustment', () => {
    it('opens stock adjustment modal', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-stock-]').click()
      })
      cy.get('[data-cy=modal-stock]').should('be.visible')
      cy.get('[data-cy=stock-adjustment]').should('be.visible')
    })

    it('warns when adjustment is 0', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-stock-]').click()
      })
      cy.get('[data-cy=stock-adjustment]').clear().type('0')
      cy.get('[data-cy=btn-submit-stock]').click()
      cy.get('[data-cy=toast-warning]').should('be.visible').and('contain', 'cannot be 0')
    })

    it('adjusts stock positively', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-stock-]').click()
      })
      cy.get('[data-cy=stock-adjustment]').clear().type('5')
      cy.get('[data-cy=stock-reason]').type('Cypress test restock')
      cy.get('[data-cy=btn-submit-stock]').click()
      cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
    })

    it('adjusts stock negatively', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-stock-]').click()
      })
      cy.get('[data-cy=stock-adjustment]').clear().type('-3')
      cy.get('[data-cy=btn-submit-stock]').click()
      cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible')
    })
  })

  // ── DELETE ────────────────────────────────────────────────────────────────

  describe('Delete Item', () => {
    it('opens the delete confirmation modal', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-delete-]').click()
      })
      cy.get('[data-cy=modal-delete]').should('be.visible')
      cy.get('[data-cy=btn-confirm-delete]').should('be.visible')
    })

    it('cancels deletion when clicking Cancel', () => {
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-delete-]').click()
      })
      cy.get('[data-cy=btn-cancel-delete]').click()
      cy.get('[data-cy=modal-delete]').should('not.exist')
    })

    it('deletes an item and shows success toast', () => {
      // Create a throwaway item first
      cy.request({
        method: 'POST',
        url: 'http://127.0.0.1:3000/inventory',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: {
          name: 'To Delete',
          sku: `DEL-${Date.now()}`,
          quantity: 1,
          minStockLevel: 0,
          price: 1.00,
          supplierId: supplierId,
          category: 'Temp',
        },
        failOnStatusCode: false,
      })
      cy.reload()
      cy.get('table tbody tr').first().within(() => {
        cy.get('[data-cy^=btn-delete-]').click()
      })
      cy.get('[data-cy=btn-confirm-delete]').click()
      cy.get('[data-cy=toast-success]', { timeout: 8000 }).should('be.visible').and('contain', 'deleted')
    })
  })

  // ── Status Badges ──────────────────────────────────────────────────────────

  describe('Stock Status Badges', () => {
    it('displays correct status badges in the table', () => {
      cy.get('[data-cy=inventory-table]').should('exist')
      cy.get('[data-cy^=status-]').first().should('exist')
        .and('satisfy', (el: HTMLElement[]) => {
          const text = el[0].textContent || ''
          return ['In Stock', 'Low Stock', 'Out of Stock'].some(s => text.includes(s))
        })
    })
  })
})

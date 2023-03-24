import selectors from '../common/selectors'
import { fillContactInfo, saveOrderId, updateRetry } from '../common/support'
import {
  invoiceAPITestCase,
  sendInvoiceTestCase,
  verifyOrderStatus,
  verifyTransactionPaymentsAPITestCase,
  startHandlingOrder,
} from '../common/testcase'
import { verifyOrderInAdyen } from './adyen_apis'

const config = Cypress.env()
const accountHolderCodeJson = '.accountholderCode.json'

// Constants
const { vtex } = config.base
const {
  adyenLoginUrl,
  adyenLoginUsername,
  adyenLoginAccount,
  adyenLoginPassword,
} = config.base.vtex

export function completePaymentWithDinersCard(
  prefix,
  orderIdEnv,
  externalSeller = false
) {
  it(`In ${prefix} - Ordering the product`, updateRetry(2), () => {
    cy.get(selectors.FirstName).then(($el) => {
      if (Cypress.dom.isVisible($el)) {
        fillContactInfo()
      }
    })
    cy.qe('Click Credit Card option in checkout')
    cy.get(selectors.CreditCardLink).click()

    cy.getIframeBody(selectors.PaymentMethodIFrame).then(($body) => {
      if (!$body.find(selectors.CardExist).length) {
        cy.qe('Card not found in the page')
        cy.qe("Let's add new card ")
        // Credit cart not exist
        // https://docs.adyen.com/development-resources/testing/test-card-numbers#diners
        const [cardNumber, cardHolderName, expirationMonth, expirationYear] = [
          '3600 6666 3333 44',
          'Testing',
          '03',
          '30',
        ]

        cy.qe(`Type cardNumber - ${cardNumber}`)
        cy.getIframeBody(selectors.PaymentMethodIFrame)
          .find(selectors.CreditCardNumber)
          .type(cardNumber)
        cy.qe(`Type cardHolderName - ${cardHolderName}`)
        cy.getIframeBody(selectors.PaymentMethodIFrame)
          .find(selectors.CreditCardHolderName)
          .type(cardHolderName)
        cy.qe(`Select CreditCardExpirationMonth - ${expirationMonth}`)
        cy.getIframeBody(selectors.PaymentMethodIFrame)
          .find(selectors.CreditCardExpirationMonth)
          .select(expirationMonth)
        cy.qe(`Select CreditCardExpirationYear - ${expirationYear}`)
        cy.getIframeBody(selectors.PaymentMethodIFrame)
          .find(selectors.CreditCardExpirationYear)
          .select(expirationYear)
      }

      cy.getIframeBody(selectors.PaymentMethodIFrame).then(($paymentBtn) => {
        if ($paymentBtn.find(selectors.PaymentMethodIFrame).length) {
          cy.qe("Diners card found in page let's open it")
          cy.getIframeBody(selectors.PaymentMethodIFrame)
            .find('.SavedCard span[class*=Diners]')
            .click()
        }
      })

      cy.qe('Type CreditCardCode as 737')
      cy.getIframeBody(selectors.PaymentMethodIFrame)
        .find(selectors.CreditCardCode)
        .type('737')
      cy.qe('Click BuyNow button (available at top right side)')
      cy.get(selectors.BuyNowBtn).last().click()
      saveOrderId(orderIdEnv, externalSeller)
    })
  })
}

export function verifyAdyenConnectorSettings() {
  it(`Verify adyen connector settings in UI`, updateRetry(2), () => {
    cy.qe('Visit /admin/adyen')
    cy.visit('/admin/adyen')
    cy.localqe(
      `Find Adyen Merchant Account input field and verify it has value ${vtex.merchantAccount}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('Adyen Merchant Account')
      .find('input')
      .should('have.value', vtex.merchantAccount)
    cy.localqe(
      `Find Adyen API Key input field and verify it has value ${vtex.adyenApiKey}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('Adyen API Key')
      .find('input')
      .should('have.value', vtex.adyenApiKey)
    cy.localqe(
      `Find Adyen Production API URI input field and verify it has value ${vtex.adyenProductionAPI}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('Adyen Production API URI')
      .find('input')
      .should('have.value', vtex.adyenProductionAPI)
    cy.localqe(
      `Find Adyen Webhook Username input field and verify it has value ${vtex.adyenWebhookUsername}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('Adyen Webhook Username')
      .find('input')
      .should('have.value', vtex.adyenWebhookUsername)
    cy.localqe(
      `Find Adyen Webhook Password input field and verify it has value ${vtex.adyenWebhookPassword}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('Adyen Webhook Password')
      .find('input')
      .should('have.value', vtex.adyenWebhookPassword)
    cy.localqe(
      `Find VTEX App Key input field and verify it has value ${vtex.apiKey}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB4)
      .contains('VTEX App Key')
      .find('input')
      .should('have.value', vtex.apiKey)
    cy.localqe(
      `Find VTEX App Token input field and verify it has value ${vtex.apiToken}`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminSectionPB6)
      .contains('VTEX App Token')
      .find('input')
      .should('have.value', vtex.apiToken)
    cy.localqe(
      `Find AdyenAdminUsePlatformToggle and verify it has text Using Adyen for Platforms`
    )
    cy.getIframeBody(selectors.AdyenAdminIframe)
      .find(selectors.AdyenAdminUsePlatformToggle)
      .contains('Using Adyen for Platforms')
      .should('have.text', 'Using Adyen for Platforms')
  })
}

export function verifyAdyenPlatformSettings() {
  it(`Verify adyen platform settings in UI`, updateRetry(2), () => {
    cy.qe('Visit /admin/app/adyen-for-platforms')
    cy.visit('/admin/app/adyen-for-platforms')
    cy.contains('Settings').should('be.visible')
    cy.qe('Settings section should be visible and click it')
    cy.contains('Settings').should('be.visible').click()
    cy.localqe(
      `Verify ${selectors.AdyenPlatformApiKey} should have value ${vtex.adyenPlatformApiKey}`
    )
    cy.get(selectors.AdyenPlatformApiKey).should(
      'have.value',
      vtex.adyenPlatformApiKey
    )
    cy.localqe(
      `Verify ${selectors.AdyenPlatformProductionURI} should have value ${vtex.adyenPlatformProductionAPI}`
    )
    cy.get(selectors.AdyenPlatformProductionURI).should(
      'have.value',
      vtex.adyenPlatformProductionAPI
    )
  })
}

export function createOnBoardingLink(create) {
  it('Create the onboarding link', () => {
    const onBoardingInputField = 'input[value*=onboarding]'

    cy.qe('Visit /admin/app/adyen-for-platforms')
    cy.visit('/admin/app/adyen-for-platforms')
    cy.qe('Adyen for platforms & productusqa2 should be visible')
    cy.contains('Adyen for Platforms').should('be.visible')
    cy.contains('productusqa2').should('be.visible').click()
    if (create) {
      cy.intercept('POST', `${vtex.baseUrl}/**`).as('RefreshOnboarding')
      cy.qe(
        'Intercept RefreshOnboarding and get accountHolderCode from response'
      )
      cy.qe('Click on Create new link button')
      cy.contains('Create New Link').should('be.visible')
      cy.contains('Create New Link').click()

      /* eslint-disable jest/valid-expect-in-promise */
      cy.wait('@RefreshOnboarding')
        .its('response')
        .then((response) => {
          expect(response)
            .to.have.property('body')
            .to.have.property('data')
            .to.have.property('adyenAccountHolder')
            .to.have.property('accountHolderCode')
          cy.qe('RefreshOnboarding should be called')
          cy.qe(
            `Write accountHolderCode - ${response.body.data.adyenAccountHolder.accountHolderCode} to ${accountHolderCodeJson}`
          )
          cy.writeFile(accountHolderCodeJson, {
            accountHolderCode:
              response.body.data.adyenAccountHolder.accountHolderCode,
          })
        })
      cy.qe('onBoardingInputField should be visible')
      cy.get(onBoardingInputField).should('be.visible')
    } else {
      cy.qe('onBoardingInputField should not exist')
      cy.get(onBoardingInputField).should('not.exist')
    }
  })
}

export function loginToAdyen() {
  it('Login to adyen dashboard', updateRetry(2), () => {
    cy.qe(`Visit ${adyenLoginUrl}`)
    cy.visit(adyenLoginUrl)
    cy.get('body').then(($body) => {
      if (!$body.find('div.app').length) {
        cy.qe('We are not logged in')
        cy.localqe(`Type username - ${adyenLoginUsername}`)
        cy.get(selectors.AdyenLoginUsername).type(adyenLoginUsername, {
          log: false,
        })
        cy.localqe('Click Next')
        cy.contains('Next').click()
        cy.localqe(`Type account name - ${adyenLoginAccount}`)
        cy.get(selectors.AdyenLoginAccount).type(adyenLoginAccount, {
          log: false,
        })
        cy.localqe(`Type password - ${adyenLoginPassword}`)
        cy.get(selectors.AdyenLoginPassword).type(adyenLoginPassword, {
          log: false,
        })
        cy.localqe('Submit the form for login')
        cy.get(selectors.AdyenLoginSubmit).click()
      } else {
        cy.qe('We are already logged in to adyen dashboard')
      }
    })
  })
}

export function verifyProductInvoiceTestcase(
  product,
  env,
  externalSeller = false
) {
  verifyOrderStatus({
    product,
    env: env.orderIdEnv,
    status: /handling|invoiced/,
    timeout: 30000,
  })

  startHandlingOrder(product, env.orderIdEnv)

  verifyOrderStatus({
    product,
    env: env.orderIdEnv,
    status: /handling|invoiced/,
    timeout: 30000,
  })

  if (externalSeller === true) {
    verifyExternalSellerInvoice(product, env)
  } else {
    sendInvoiceTestCase({
      product,
      orderIdEnv: env.orderIdEnv,
    })

    invoiceAPITestCase({
      product,
      env: env.orderIdEnv,
      transactionIdEnv: env.transactionIdEnv,
    })

    verifyOrderStatus({
      product,
      env: env.orderIdEnv,
      status: /handling|invoiced/,
      timeout: 30000,
    })
  }

  verifyOrderTransactions(product, env)
}

export function verifyExternalSellerInvoice(externalSeller, env) {
  describe(`Testing Invoice API for Direct Sale`, () => {
    it('Get Direct Sale orderId and update in Cypress env', () => {
      cy.getOrderItems().then((order) => {
        if (!order[externalSeller.directSaleEnv]) {
          throw new Error('Direct Sale Order id is missing')
        }
      })
    })

    sendInvoiceTestCase({
      product: externalSeller,
      orderIdEnv: externalSeller.directSaleEnv,
      externalSellerTestcase: true,
    })

    // Get transactionId from invoiceAPI and store in .orders.json
    invoiceAPITestCase({
      product: externalSeller,
      env: externalSeller.directSaleEnv,
      transactionIdEnv: env.transactionIdEnv,
    })

    verifyOrderStatus({
      product: externalSeller,
      env: env.orderIdEnv,
      status: /handling|invoiced/,
      timeout: 30000,
    })
  })

  describe(`Testing Invoice API for External Sale`, () => {
    it('Get External Sale orderId and update in Cypress env', () => {
      cy.getOrderItems().then((order) => {
        if (!order[externalSeller.externalSaleEnv]) {
          throw new Error('External Sale Order id is missing')
        }
      })
    })

    sendInvoiceTestCase({
      product: externalSeller,
      orderIdEnv: externalSeller.externalSaleEnv,
      externalSellerTestcase: true,
    })

    invoiceAPITestCase({
      product: externalSeller,
      env: externalSeller.externalSaleEnv,
    })

    verifyOrderStatus({
      product: externalSeller,
      env: env.orderIdEnv,
      status: /handling|invoiced/,
      timeout: 30000,
    })
  })
}

function verifyOrderTransactions(product, env) {
  describe('Verify Order Transactions', updateRetry(2), () => {
    verifyTransactionPaymentsAPITestCase(product, env)
    verifyOrderInAdyen(product, env)
  })
}

describe('fail', () => {
  it('just to fail', () => {
    cy.log('Test to ' + fail)
  })
  for (let i = 1; i < 5; i++) {
    it('just to pass ' + i, () => {
      cy.log('Test pass' + i)
    })
  }
})

describe("Authentication Flow", () => {
  it("should successfully log in an admin and redirect to deviations", () => {
    cy.intercept("POST", "**", {
      statusCode: 200,
      body: { token: "mock_token", role: "admin" },
    }).as("loginSuccess");

    cy.visit("/");
    cy.contains("eQMS Login").should("be.visible");

    cy.get('input[placeholder="Enter your username"]').type("administrator");
    cy.get('input[placeholder="••••••••"]').type("123456{enter}");

    cy.wait("@loginSuccess");
    cy.url().should("include", "/deviations");
  });
});

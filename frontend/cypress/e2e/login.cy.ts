describe("Authentication Flow", () => {
  it("should successfully log in an admin and redirect to deviations", () => {
    cy.visit("/");

    cy.contains("eQMS Login").should("be.visible");

    // Type credentials
    cy.get('input[placeholder="Enter your username"]').type("administrator"); // Ensure this matches a valid user in your backend
    cy.get('input[placeholder="••••••••"]').type("123456"); // Ensure this matches a valid user in your backend

    // Click the submit button (targeting by type="submit" is safer now that text changes)
    cy.get('button[type="submit"]').click();

    // Assert that the URL successfully changes to the deviations dashboard
    cy.url().should("include", "/deviations");
    cy.contains("Quality Deviations").should("be.visible");
  });

  it("should show an error message for invalid credentials", () => {
    cy.visit("/");

    cy.get('input[placeholder="Enter your username"]').type("WrongUser");
    cy.get('input[placeholder="••••••••"]').type("badpassword");
    cy.get('button[type="submit"]').click();

    // Since the API returns a 401, wait a split second for the error div to render and check for it
    cy.get(".bg-red-500\\/10", { timeout: 5000 }).should("be.visible");
  });
});

describe("Deviation & AI Triage Workflow", () => {
  // Before each test, let's log in programmatically or via UI so we have a valid token
  beforeEach(() => {
    cy.visit("/");
    cy.get('input[placeholder="Enter your username"]').type("administrator");
    cy.get('input[placeholder="••••••••"]').type("123456");
    cy.get('button[type="submit"]').click();
    cy.url().should("include", "/deviations");
  });

  it("should successfully open the modal, submit a deviation, and view AI assessment results", () => {
    // 1. Click the button to open the new deviation modal
    cy.contains("button", "+ Open New Deviation").click();

    // 2. Verify the modal title is visible
    cy.contains("h2", "Log New Deviation").should("be.visible");

    // 3. Fill out the form fields
    cy.get('input[placeholder="e.g., QA-019"]').type("QA-042");
    cy.get(
      'textarea[placeholder="Describe the non-conformance event..."]',
    ).type(
      "Temperature excursion observed in Incubator #3 during overnight monitoring. Setpoint drifted by +2.5°C.",
    );

    // 4. Submit to the AI engine
    cy.contains("button", "Submit to AI Engine").click();

    // 5. Verify that the AI assessment view renders successfully with calculated metrics
    cy.contains("AI Assessment Complete", { timeout: 20000 }).should("exist");
    cy.contains("Calculated RPN").should("exist");
    cy.contains("QA Narrative Generated").should("exist");

    // 6. Acknowledge and close the modal
    cy.contains("button", "Acknowledge & Close").click();

    // 7. Verify the modal closes and we return to the main dashboard
    cy.contains("h2", "AI Assessment Complete").should("not.exist");
  });
});

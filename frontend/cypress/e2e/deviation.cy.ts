describe("Deviations Module", () => {
  beforeEach(() => {
    cy.login("qa_user");

    cy.intercept({ method: "GET", url: "**/deviations" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 101,
            submitter_id: "QA-001",
            category: "Human Error",
            rpn: 45,
            status: "Open",
            created_at: "2026-08-26T10:00:00Z",
            deviation_text: "Operator dropped a sterile vial on the floor.",
          },
        ],
      });
    }).as("getDeviations");

    cy.visit("/deviations");
    cy.wait("@getDeviations");
  });

  it("Flow 1: Logs a new deviation and displays AI Triage results", () => {
    cy.intercept("POST", "**/assess_deviation", {
      statusCode: 201,
      body: {
        assessment: {
          root_cause_category: "Environmental",
          rpn: 75,
          required_action: "Perform immediate cleaning.",
          qa_narrative: "AI determined high risk.",
        },
      },
    }).as("assessDeviation");

    // THE FIX: Wait for the dynamic table data to render first.
    // This guarantees Next.js has finished hydrating the page and attaching onClick events!
    cy.contains("DEV-101").should("be.visible");

    // Now it is safe to click the button
    cy.contains("button", "Open New Deviation").click({ force: true });

    // The modal will now open successfully
    cy.contains("Log New Deviation").should("exist");

    cy.get('input[placeholder*="QA-019"]').type("QA-099");
    cy.get('textarea[placeholder*="Describe the non-conformance"]').type(
      "HVAC pressure dropped.",
    );

    cy.contains("Submit to AI Engine").click({ force: true });
    cy.wait("@assessDeviation");

    cy.contains("Deviation Logged Successfully").should("exist");
    cy.contains("Environmental").should("exist");

    cy.contains("Acknowledge & Close").click({ force: true });
    cy.contains("Log New Deviation").should("not.exist");
  });

  it("Flow 2: Opens details and edits the deviation text", () => {
    cy.intercept("PUT", "**/deviations/101", { statusCode: 200 }).as(
      "updateDeviation",
    );

    cy.contains("DEV-101").click({ force: true });
    cy.contains("Deviation Details").should("exist");

    cy.contains("Edit Details").click({ force: true });
    cy.get("textarea")
      .clear()
      .type("Updated: Operator dropped two sterile vials.");

    cy.intercept({ method: "GET", url: "**/deviations" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 101,
            submitter_id: "QA-001",
            category: "Human Error",
            rpn: 45,
            status: "Open",
            created_at: "2026-08-26T10:00:00Z",
            deviation_text: "Updated: Operator dropped two sterile vials.",
          },
        ],
      });
    }).as("getUpdatedDeviations");

    cy.contains("Save Changes").click({ force: true });

    cy.wait("@updateDeviation");
    cy.wait("@getUpdatedDeviations");

    cy.contains("Updated: Operator dropped two sterile vials").should("exist");
  });

  it("Flow 3: Escalates to investigation and runs AI Root Cause Analysis", () => {
    cy.intercept("POST", "**/deviations/101/investigate", {
      statusCode: 200,
    }).as("escalateInvestigate");
    cy.intercept("POST", "**/deviations/101/ai_investigate", {
      statusCode: 200,
      body: { root_cause: "Why 1: Dropped vial.", capa: "Update gowning SOP." },
    }).as("aiInvestigate");
    cy.intercept("PUT", "**/deviations/101/investigation", {
      statusCode: 200,
    }).as("saveInvestigation");

    cy.contains("DEV-101").click({ force: true });
    cy.contains("Investigation Module").click({ force: true });

    cy.on("window:confirm", () => true);

    cy.intercept({ method: "GET", url: "**/deviations" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 101,
            submitter_id: "QA-001",
            category: "Human Error",
            rpn: 45,
            status: "Under Investigation",
            created_at: "2026-08-26T10:00:00Z",
            deviation_text: "Operator dropped a sterile vial on the floor.",
          },
        ],
      });
    }).as("getEscalatedDeviations");

    cy.contains("Initiate Formal Investigation").click({ force: true });

    cy.wait("@escalateInvestigate");
    cy.wait("@getEscalatedDeviations");

    // FIX 2: React forces us back to the Overview tab when data refreshes.
    // We must command Cypress to click the Investigation tab again to reveal the AI textarea!
    cy.contains("Investigation Module").click({ force: true });

    cy.contains("Auto-Generate with AI").click({ force: true });
    cy.wait("@aiInvestigate");

    cy.get('textarea[placeholder*="fundamental breakdown"]').should(
      "have.value",
      "Why 1: Dropped vial.",
    );

    cy.contains("Save Investigation Data").click({ force: true });
    cy.wait("@saveInvestigation");
  });
});

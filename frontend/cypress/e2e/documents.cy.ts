describe("Documents & SOP Module", () => {
  beforeEach(() => {
    cy.login("admin");

    // Mock the active documents for the initial page load
    cy.intercept({ method: "GET", url: "**/documents?view=active" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            version_id: 1,
            parent_document_id: 101,
            document_number: "SOP-001",
            title: "Gowning Procedure",
            version: "1.0",
            status: "Authorized",
            uploaded_at: "2026-08-26",
            reviewer: "QA Admin",
          },
        ],
      });
    }).as("getActiveDocuments");

    cy.visit("/documents");
    cy.wait("@getActiveDocuments");
  });

  it("Flow 1: Creates a new document shell and uploads the first PDF revision", () => {
    // 1. Mock creating the shell
    cy.intercept("POST", "**/documents/create", {
      statusCode: 201,
      body: {
        document_id: 999,
        document_number: "SOP-999",
        title: "HVAC Protocol",
      },
    }).as("createDocument");

    // 2. Mock fetching history (empty array means it's a brand new doc)
    cy.intercept("GET", "**/documents/999/revisions", {
      statusCode: 200,
      body: [],
    }).as("getRevisions");

    // 3. Mock fetching reviewers for the dropdown
    cy.intercept("GET", "**/reviewers", {
      statusCode: 200,
      body: [{ id: 1, username: "admin_reviewer" }],
    }).as("getReviewers");

    // 4. Mock the final PDF upload
    cy.intercept("POST", "**/documents/999/revisions", { statusCode: 201 }).as(
      "uploadRevision",
    );

    // Hydration check
    cy.contains("SOP-001").should("be.visible");

    // Open Create Modal
    cy.contains("button", "+ Upload New SOP").click({ force: true });
    cy.contains("Create New Document").should("exist");

    // Fill Title and Submit
    cy.get('input[placeholder*="HVAC"]').type("HVAC Protocol");
    cy.contains("Next: Add Revision").click({ force: true });
    cy.wait("@createDocument");

    // The Revision Modal should auto-open. Wait for network requests to populate it.
    cy.wait("@getRevisions");
    cy.wait("@getReviewers");

    // Verify Revision Modal UI
    cy.contains("Upload New Revision").should("exist");
    cy.contains("SOP-999").should("exist");

    // Select reviewer (Specifically targeting the Reviewer dropdown)
    cy.contains("Assign Reviewer")
      .parent()
      .find("select")
      .select("1", { force: true });

    // Mock attaching a PDF file using Cypress memory buffer
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("dummy pdf content"),
        fileName: "hvac_protocol.pdf",
        mimeType: "application/pdf",
      },
      { force: true },
    );

    // Submit
    cy.contains("Submit Revision").click({ force: true });
    cy.wait("@uploadRevision");

    // Verify it closes and shows the success message
    cy.contains("Revision uploaded successfully!").should("exist");
  });

  it("Flow 2: Navigates to the review tab and approves a document", () => {
    // Mock the "For My Review" tab data
    cy.intercept(
      { method: "GET", url: "**/documents?view=my_reviews" },
      (req) => {
        if (req.headers.accept && req.headers.accept.includes("text/html"))
          return;
        req.reply({
          statusCode: 200,
          body: [
            {
              version_id: 2,
              parent_document_id: 102,
              document_number: "SOP-002",
              title: "Incubator Calibration",
              version: "2.0",
              status: "Pending Review",
              uploaded_at: "2026-08-26",
              reviewer: "admin",
            },
          ],
        });
      },
    ).as("getMyReviews");

    // Mock the approval endpoint
    cy.intercept("PUT", "**/approve_document/2", { statusCode: 200 }).as(
      "approveDoc",
    );

    // Switch Tabs
    cy.contains("button", "For My Review").click({ force: true });
    cy.wait("@getMyReviews");

    // Hydration check for the new tab data
    cy.contains("SOP-002").should("be.visible");

    // Click Approve
    cy.contains("button", "Approve").click({ force: true });
    cy.wait("@approveDoc");

    // Verify Success Message
    cy.contains("Document successfully authorized!").should("exist");
  });

  it("Flow 3: Opens the AI Copilot and chats with the SOP", () => {
    // Mock the AI chat response
    cy.intercept("POST", "**/direct_sops/1/chat", {
      statusCode: 200,
      body: {
        answer:
          "To properly gown, you must first sanitize your hands for 60 seconds.",
      },
    }).as("chatWithSop");

    // Hydration check
    cy.contains("SOP-001").should("be.visible");

    // Open Chat
    cy.contains("button", "Ask AI").click({ force: true });

    // Verify Modal & Greeting
    cy.contains("Ask the SOP").should("exist");
    cy.contains('Hello! I have loaded the SOP: "Gowning Procedure"').should(
      "exist",
    );

    // Ask a question
    cy.get('input[placeholder*="cool down?"]').type(
      "How long do I wash my hands?",
    );

    // Click the send button (target by the SVG/button specifically)
    cy.get('button[type="submit"]').last().click({ force: true });
    cy.wait("@chatWithSop");

    // Verify the mock AI response rendered into the chat bubble
    cy.contains(
      "To properly gown, you must first sanitize your hands for 60 seconds.",
    ).should("exist");
  });
});

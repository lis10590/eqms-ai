describe("Upload SOP Modal", () => {
  beforeEach(() => {
    // 1. Simulate authenticated user
    cy.window().then((win) =>
      win.localStorage.setItem("token", "fake-jwt-token"),
    );

    // 2. Intercept the background dashboard load to prevent race conditions
    cy.intercept("GET", "**/documents*view=active*", { body: [] }).as(
      "getActive",
    );

    // 3. Intercept the Reviewers API call that triggers when the modal opens
    cy.intercept("GET", "**/reviewers", {
      statusCode: 200,
      body: [
        { id: 1, username: "Lis Setgasy" },
        { id: 2, username: "QA Admin" },
      ],
    }).as("getReviewers");

    // 4. Navigate and open the modal
    cy.visit("/documents");
    cy.wait("@getActive");
    cy.contains("button", "+ Upload New SOP").click({ force: true });

    // 5. Wait for the reviewers to load into the dropdown
    cy.wait("@getReviewers");
  });

  it("should successfully fetch and display reviewers in the dropdown", () => {
    cy.contains("h2", "Upload New SOP").should("exist");

    // Target the select specifically inside the form to avoid the Navbar theme dropdown
    cy.get("form select").contains("Lis Setgasy").should("exist");
    cy.get("form select").contains("QA Admin").should("exist");
  });

  it("should successfully upload a PDF document", () => {
    // 1. Fill out the text fields
    cy.get('input[placeholder="e.g., SOP-001"]').type("SOP-999");
    cy.get('input[placeholder="Document Title"]').type(
      "Emergency Backup Protocols",
    );
    cy.get('input[placeholder="1.0"]').type("1.0");

    // 2. Select a reviewer from the dropdown (Targeting the form specifically)
    cy.get("form select").select("1");

    // 3. Create a fake PDF file in memory and attach it to the file input
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("Mock PDF Content Data"),
        fileName: "Emergency_Protocols.pdf",
        mimeType: "application/pdf",
      },
      { force: true },
    );

    // 4. Intercept the POST request to simulate a successful upload
    cy.intercept("POST", "**/upload_sop", {
      statusCode: 200,
      body: { success: true },
    }).as("uploadSop");

    // 5. Intercept the table refresh that happens in the parent component on success
    cy.intercept("GET", "**/documents*view=active*", { body: [] }).as(
      "refreshActive",
    );

    // 6. Submit the form
    cy.contains("button", "Upload Document").click({ force: true });
    cy.wait("@uploadSop");

    // 7. Verify the modal closed and the parent component showed the success message
    cy.contains("New SOP uploaded successfully!").should("exist");
    cy.contains("h2", "Upload New SOP").should("not.exist");
  });

  it("should display an error banner if the API rejects the upload", () => {
    // Fill out the form
    cy.get('input[placeholder="e.g., SOP-001"]').type("SOP-123");
    cy.get('input[placeholder="Document Title"]').type("Failed Doc");
    cy.get('input[placeholder="1.0"]').type("2.0");

    // Target the select specifically inside the form
    cy.get("form select").select("2");

    // Attach mock file
    cy.get('input[type="file"]').selectFile(
      {
        contents: Cypress.Buffer.from("Mock PDF Content Data"),
        fileName: "Failed_Doc.pdf",
        mimeType: "application/pdf",
      },
      { force: true },
    );

    // Force the API to return a 500 server error
    cy.intercept("POST", "**/upload_sop", {
      statusCode: 500,
      body: { error: "AWS S3 Bucket is unreachable." },
    }).as("uploadFail");

    cy.contains("button", "Upload Document").click({ force: true });
    cy.wait("@uploadFail");

    // Verify the red error box renders inside the modal
    cy.contains("AWS S3 Bucket is unreachable.").should("exist");

    // Verify the modal did NOT close
    cy.contains("h2", "Upload New SOP").should("exist");
  });
});

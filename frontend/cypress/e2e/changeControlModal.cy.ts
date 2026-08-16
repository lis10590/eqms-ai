describe("Change Control Modal Workflow", () => {
  beforeEach(() => {
    // 1. Simulate an authenticated user
    cy.window().then((win) =>
      win.localStorage.setItem("token", "fake-jwt-token"),
    );

    // 2. Mock the initial page load so the table doesn't crash
    cy.intercept("GET", "**/change_controls", { statusCode: 200, body: [] }).as(
      "getChanges",
    );

    // 3. Visit the page and open the modal before each test
    cy.visit("/change-controls");
    cy.wait("@getChanges");
    cy.contains("button", "+ Initiate Change").click();

    // 4. Verify the modal opened to Step 1
    cy.contains("h2", "Initiate New Change Control").should("be.visible");
  });

  it("should disable the Analyze button until all fields are filled", () => {
    // The "Analyze with AI" button should be disabled initially
    cy.contains("button", "Analyze with AI").should("be.disabled");

    // Fill out just one field
    cy.get('input[placeholder*="Modify Incubator"]').type(
      "Upgrade HVAC System",
    );

    // Button should still be disabled
    cy.contains("button", "Analyze with AI").should("be.disabled");

    // Fill out the rest
    cy.get('textarea[placeholder*="current process"]').type(
      "HVAC is running on V1 firmware.",
    );
    cy.get('textarea[placeholder*="exactly what will change"]').type(
      "Flashing V2 firmware to all units.",
    );
    cy.get('textarea[placeholder*="regulatory or business"]').type(
      "Required for ISO compliance.",
    );

    // Now the button should be enabled and ready to click!
    cy.contains("button", "Analyze with AI").should("not.be.disabled");
  });

  it("should successfully complete the AI analysis and submit the change control", () => {
    // 1. Fill out the Step 1 Form
    cy.get('input[placeholder*="Modify Incubator"]').type(
      "Update Bioreactor Agitation Speed",
    );
    cy.get('textarea[placeholder*="current process"]').type(
      "Currently at 50 RPM.",
    );
    cy.get('textarea[placeholder*="exactly what will change"]').type(
      "Increase to 75 RPM.",
    );
    cy.get('textarea[placeholder*="regulatory or business"]').type(
      "Optimization of cell yield.",
    );

    // 2. Intercept and Mock the AI Assessment API call
    cy.intercept("POST", "**/assess_change", {
      statusCode: 200,
      body: {
        assessment: {
          Enhanced_Description:
            "The proposed change modifies the baseline agitation speed of the primary bioreactor from 50 RPM to 75 RPM to optimize biological yield.",
          Classification: "Major",
          Classification_Rationale:
            "Impacts critical process parameters (CPP) but does not alter final product composition.",
          Impact_Areas: [
            "Cell Viability",
            "Equipment Wear",
            "SOP Documentation",
          ],
          Suggested_Tasks: [
            {
              Domain: "Engineering",
              Task_Description: "Update PLC agitation logic.",
            },
            {
              Domain: "Quality",
              Task_Description: "Perform 3-batch validation run.",
            },
          ],
        },
      },
    }).as("aiAssessment");

    // 3. Click the Analyze button
    cy.contains("button", "Analyze with AI").click();
    cy.wait("@aiAssessment");

    // 4. Verify we are now on Step 2 (AI Quality Assessment)
    cy.contains("h2", "AI Quality Assessment").should("exist");

    // 5. Verify the mocked AI data rendered correctly in the UI
    cy.contains("Impacts critical process parameters").should("exist");
    cy.contains("Major").should("have.class", "text-amber-500"); // Validating your dynamic colors!
    cy.contains("Perform 3-batch validation run.").should("exist");

    // 6. Intercept and Mock the final submission to the database
    cy.intercept("POST", "**/change_controls", {
      statusCode: 201,
      body: { success: true },
    }).as("submitChange");

    // 7. Intercept the table refresh that happens after success
    cy.intercept("GET", "**/change_controls", {
      statusCode: 200,
      body: [
        {
          id: 99,
          title: "Update Bioreactor Agitation Speed",
          classification: "Major",
          status: "Pending",
        },
      ],
    }).as("refreshTable");

    // 8. Submit to QA
    cy.contains("button", "Submit to QA").click();
    cy.wait("@submitChange");
    cy.wait("@refreshTable");

    // 9. Verify the modal closes automatically
    cy.contains("h2", "AI Quality Assessment").should("not.exist");
  });

  it("should display an error message if the AI API fails", () => {
    // Fill out the form
    cy.get('input[placeholder*="Modify Incubator"]').type("Test Title");
    cy.get('textarea[placeholder*="current process"]').type("Test Current");
    cy.get('textarea[placeholder*="exactly what will change"]').type(
      "Test Proposed",
    );
    cy.get('textarea[placeholder*="regulatory or business"]').type(
      "Test Justification",
    );

    // Force the API to return a 500 error
    cy.intercept("POST", "**/assess_change", {
      statusCode: 500,
      body: { error: "AI Engine is currently unavailable." },
    }).as("aiAssessmentFail");

    cy.contains("button", "Analyze with AI").click();
    cy.wait("@aiAssessmentFail");

    // Verify your red error banner appears with the correct text
    cy.contains("AI Engine is currently unavailable.").should("exist");

    // Verify we did NOT move to step 2
    cy.contains("h2", "Initiate New Change Control").should("exist");
  });
});

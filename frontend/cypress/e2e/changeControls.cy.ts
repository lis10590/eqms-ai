describe("Change Controls Module", () => {
  beforeEach(() => {
    cy.login("admin");

    // Mock the initial dashboard load
    cy.intercept({ method: "GET", url: "**/change_controls" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 202,
            title: "Upgrade Bioreactor Agitation Motor",
            classification: "Major",
            status: "Under Review",
            current_state: "Standard 50 RPM motor installed.",
            proposed_state: "Upgrade to 100 RPM variable motor.",
            justification: "Required for new high-density cell line.",
            classification_rationale: "Impacts mixing sheer stress.",
            impact_areas: ["Quality", "Manufacturing", "Validation"],
            suggested_tasks: [
              {
                Domain: "Validation",
                Task_Description: "Execute IQ/OQ on new motor.",
              },
            ],
            created_at: "2026-08-26",
          },
        ],
      });
    }).as("getChangeControls");

    cy.visit("/change-controls");
    cy.wait("@getChangeControls");
  });

  it("Flow 1: Initiates a new Change Control and processes AI Assessment", () => {
    // 1. Mock the AI Assessment backend
    cy.intercept("POST", "**/assess_change", {
      statusCode: 200,
      body: {
        assessment: {
          Enhanced_Description:
            "AI Optimized: Upgrading the bioreactor motor to support high-density cultures.",
          Classification: "Critical",
          Classification_Rationale: "Direct product contact and yield impact.",
          Impact_Areas: ["Validation", "Regulatory"],
          Suggested_Tasks: [
            { Domain: "Validation", Task_Description: "Perform PQ runs." },
            {
              Domain: "Regulatory",
              Task_Description: "Submit variation to FDA.",
            },
          ],
        },
      },
    }).as("assessChange");

    // 2. Mock the final save
    cy.intercept("POST", "**/change_controls", { statusCode: 201 }).as(
      "saveChange",
    );

    // Hydration check: Wait for the mock table to render before interacting
    cy.contains("CC-202").should("be.visible");

    // Open the Initiate Modal
    cy.contains("button", "+ Initiate Change").click({ force: true });
    cy.contains("Initiate New Change Control").should("exist");

    // Fill out the drafting form using the specific placeholders
    cy.get('input[placeholder*="Incubator Temperature"]').type(
      "Increase Autoclave Sterilization Time",
    );
    cy.get('textarea[placeholder*="current process"]').type(
      "Currently 30 minutes at 121C.",
    );
    cy.get('textarea[placeholder*="exactly what will change"]').type(
      "Increase to 45 minutes at 121C.",
    );
    cy.get('textarea[placeholder*="rationale"]').type(
      "Address biological indicator failures.",
    );

    // Trigger AI
    cy.contains("Analyze with AI").click({ force: true });
    cy.wait("@assessChange");

    // Verify AI Step 2 renders correctly
    cy.contains("AI Quality Assessment").should("exist");
    cy.contains("Critical").should("exist");
    cy.contains("Perform PQ runs.").should("exist");

    // Submit the final payload
    cy.contains("Submit to QA").click({ force: true });
    cy.wait("@saveChange");

    // Verify modal closes
    cy.contains("Initiate New Change Control").should("not.exist");
  });

  it("Flow 2: Navigates tabs, views execution tasks, and edits the proposal", () => {
    cy.intercept("PUT", "**/change_controls/202", { statusCode: 200 }).as(
      "updateChange",
    );

    // Open the details modal
    cy.contains("CC-202").click({ force: true });
    cy.contains("Proposal Overview").should("exist");

    // Navigate to Execution Tasks tab and verify data
    cy.contains("Execution Tasks").click({ force: true });
    cy.contains("Implementation Action Plan").should("exist");
    cy.contains("Execute IQ/OQ on new motor.").should("exist");

    // Return to Overview and Edit
    cy.contains("Proposal Overview").click({ force: true });
    cy.contains("Edit Details").click({ force: true });

    // Update the title input
    cy.get("input").clear().type("Updated: Upgrade Bioreactor Motor & Drive");

    // Override the mock state so the dashboard refreshes correctly after saving
    cy.intercept({ method: "GET", url: "**/change_controls" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 202,
            title: "Updated: Upgrade Bioreactor Motor & Drive", // <--- Updated title
            classification: "Major",
            status: "Under Review",
            current_state: "Standard 50 RPM motor installed.",
            proposed_state: "Upgrade to 100 RPM variable motor.",
            justification: "Required for new high-density cell line.",
            impact_areas: ["Quality"],
            suggested_tasks: [],
            created_at: "2026-08-26",
          },
        ],
      });
    }).as("getUpdatedChanges");

    // Save modifications
    cy.contains("Save Changes").click({ force: true });

    cy.wait("@updateChange");
    cy.wait("@getUpdatedChanges");

    // Verify the UI updated with the new text
    cy.contains("Updated: Upgrade Bioreactor Motor & Drive").should("exist");
  });
});

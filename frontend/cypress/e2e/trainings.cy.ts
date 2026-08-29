describe("Trainings Module", () => {
  beforeEach(() => {
    cy.login("admin");

    // 1. Mock the current user profile (required for permissions/assigned tasks)
    cy.intercept(
      { method: "GET", url: "**/trainings/me" },
      {
        statusCode: 200,
        body: { id: 1, name: "QA Admin", role: "admin" },
      },
    ).as("getMe");

    // 2. Mock the users list for dropdowns
    cy.intercept(
      { method: "GET", url: "**/trainings/users" },
      {
        statusCode: 200,
        body: [{ id: 2, name: "John Operator" }],
      },
    ).as("getUsers");

    // 3. Mock the initial trainings dashboard
    cy.intercept({ method: "GET", url: "**/trainings" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 301,
            employee_id: 1, // Assigned to the admin user so we can take the quiz
            employee_name: "QA Admin",
            training_type: "Self-Reading",
            title: "Aseptic Gowning v1.0",
            status: "Open",
            document_id: "SOP-001",
          },
        ],
      });
    }).as("getTrainings");

    cy.visit("/trainings");
    cy.wait(["@getMe", "@getUsers", "@getTrainings"]);
  });

  it("Flow 1: Assigns a new Self-Reading Training", () => {
    // Mock active SOPs for the dropdown
    cy.intercept("GET", "**/documents?view=active", {
      statusCode: 200,
      body: [
        {
          version_id: 1,
          document_number: "SOP-002",
          title: "HVAC Protocol",
          version: "1.0",
        },
      ],
    }).as("getActiveSops");

    cy.intercept("POST", "**/trainings", { statusCode: 201 }).as(
      "assignTraining",
    );

    // Hydration check
    cy.contains("Aseptic Gowning v1.0").should("be.visible");

    // Open Modal
    cy.contains("button", "+ Assign Training").click({ force: true });
    cy.wait("@getActiveSops");
    cy.contains("Assign Training").should("exist");

    // Select Employee (Scoped specifically to the label to avoid the background table header)
    cy.contains("label", "Employee")
      .parent()
      .find("select")
      .select("2", { force: true });

    // Select Document
    cy.contains("Select Active SOP")
      .parent()
      .find("select")
      .select("SOP-002", { force: true });

    // Ensure Title auto-populated (from the React onChange logic), or type manually
    cy.get('input[placeholder*="Cleanroom Gowning"]')
      .clear()
      .type("HVAC Protocol Training");

    // Submit (Trigger the form directly to avoid Cypress HTML5 linkage quirks)
    cy.get("#training-form").submit();
    cy.wait("@assignTraining");

    // Modal closes
    cy.contains("Record employee qualifications").should("not.exist");
  });

  it("Flow 2: Opens details and completes the AI Comprehension Quiz", () => {
    // 1. Mock the AI Quiz Generation
    cy.intercept("GET", "**/trainings/301/quiz", {
      statusCode: 200,
      body: {
        questions: [
          {
            question: "How long must you sanitize your hands?",
            options: ["10 Seconds", "60 Seconds"],
            correct_index: 1,
            explanation: "SOP requires 60 seconds.",
          },
          {
            question: "What goes on first?",
            options: ["Gloves", "Hairnet"],
            correct_index: 1,
            explanation: "Top-down approach.",
          },
        ],
      },
    }).as("generateQuiz");

    // 2. Mock saving the completed training
    cy.intercept("PUT", "**/trainings/301", { statusCode: 200 }).as(
      "completeTraining",
    );

    // Hydration check & open details
    cy.contains("Aseptic Gowning v1.0").click({ force: true });
    cy.contains("Step 2: Take Comprehension Quiz").should("exist");

    // Override the mock state so the dashboard refreshes properly after passing
    cy.intercept({ method: "GET", url: "**/trainings" }, (req) => {
      if (req.headers.accept && req.headers.accept.includes("text/html"))
        return;
      req.reply({
        statusCode: 200,
        body: [
          {
            id: 301,
            employee_id: 1,
            employee_name: "QA Admin",
            training_type: "Self-Reading",
            title: "Aseptic Gowning v1.0",
            status: "Completed", // <--- Updated status
            document_id: "SOP-001",
          },
        ],
      });
    }).as("getCompletedTrainings");

    // Open Quiz Modal
    cy.contains("Step 2: Take Comprehension Quiz").click({ force: true });
    cy.wait("@generateQuiz");

    // Verify Quiz UI
    cy.contains("Comprehension Check").should("exist");
    cy.contains("How long must you sanitize").should("exist");

    // Select the correct answers (index 1 for both based on our mock data)
    cy.get('input[name="question-0"][value="1"]').check({ force: true });
    cy.get('input[name="question-1"][value="1"]').check({ force: true });

    // Submit Answers
    cy.contains("Submit Answers").click({ force: true });
    cy.wait("@completeTraining");

    // Verify Passing Score Screen
    cy.contains("100%").should("exist");
    cy.contains("Training Passed!").should("exist");

    // Close Modal & Wait for dashboard refresh
    cy.contains("Finish & Close Window").click({ force: true });
    cy.wait("@getCompletedTrainings");

    // Verify Dashboard updated
    cy.contains("Completed").should("exist");
  });
});

describe("Calibration Management Dashboard", () => {
  // Define the backend API URL explicitly
  const apiUrl = Cypress.env("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:5000";

  beforeEach(() => {
    cy.window().then((win) =>
      win.localStorage.setItem("token", "fake-jwt-token"),
    );
  });

  it("should display the empty state when no equipment exists", () => {
    // Specifically target the backend API to avoid intercepting the HTML page load
    cy.intercept("GET", `${apiUrl}/equipment`, {
      statusCode: 200,
      body: [],
    }).as("getEmptyEq");

    // Visit the frontend page
    cy.visit("/equipment");
    cy.wait("@getEmptyEq");

    cy.contains("No equipment registered yet.").should("exist");
  });

  it("should render equipment and dynamically calculate calibration statuses", () => {
    const today = new Date();
    const overdueDate = new Date(today);
    overdueDate.setDate(today.getDate() - 5);

    const dueSoonDate = new Date(today);
    dueSoonDate.setDate(today.getDate() + 15);

    const compliantDate = new Date(today);
    compliantDate.setDate(today.getDate() + 60);

    cy.intercept("GET", `${apiUrl}/equipment`, {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: "Incubator A",
          serial_number: "SN-001",
          location: "Cleanroom 1",
          last_calibration_date: "2026-01-01",
          next_calibration_date: overdueDate.toISOString().split("T")[0],
          status: "Active",
        },
        {
          id: 2,
          name: "pH Meter",
          serial_number: "SN-002",
          location: "Lab 2",
          last_calibration_date: "2026-06-01",
          next_calibration_date: dueSoonDate.toISOString().split("T")[0],
          status: "Active",
        },
        {
          id: 3,
          name: "Centrifuge",
          serial_number: "SN-003",
          location: "Lab 3",
          last_calibration_date: "2026-08-01",
          next_calibration_date: compliantDate.toISOString().split("T")[0],
          status: "Active",
        },
      ],
    }).as("getEq");

    cy.visit("/equipment");
    cy.wait("@getEq");

    cy.contains("Overdue").should("have.class", "text-red-500");
    cy.contains("Due Soon").should("have.class", "text-amber-500");
    cy.contains("Compliant").should("have.class", "text-green-500");
  });

  it("should successfully toggle the form and add new equipment", () => {
    cy.intercept("GET", `${apiUrl}/equipment`, { body: [] }).as("getInitial");
    cy.visit("/equipment");
    cy.wait("@getInitial");

    cy.contains("button", "+ Add Equipment").click({ force: true });

    cy.get('input[placeholder="e.g., pH Meter"]').type("Biosafety Cabinet");
    cy.get('input[placeholder="e.g., SN-102938"]').type("BSC-999");
    cy.get('input[placeholder="e.g., Cleanroom 2"]').type("Cleanroom A");

    cy.get('input[type="date"]').eq(0).type("2026-08-01");
    cy.get('input[type="date"]').eq(1).type("2027-08-01");

    cy.intercept("POST", `${apiUrl}/equipment`, {
      statusCode: 201,
      body: { success: true },
    }).as("postEq");
    cy.intercept("GET", `${apiUrl}/equipment`, {
      statusCode: 200,
      body: [
        {
          id: 99,
          name: "Biosafety Cabinet",
          serial_number: "BSC-999",
          location: "Cleanroom A",
          last_calibration_date: "2026-08-01",
          next_calibration_date: "2027-08-01",
          status: "Active",
        },
      ],
    }).as("getRefreshed");

    cy.contains("button", "Save Equipment").click({ force: true });
    cy.wait("@postEq");
    cy.wait("@getRefreshed");

    cy.contains("Equipment added successfully!").should("exist");
    cy.contains("Biosafety Cabinet").should("exist");
  });
});

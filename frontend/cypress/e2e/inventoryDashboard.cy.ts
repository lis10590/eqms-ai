describe("Warehouse Control Dashboard", () => {
  // Define the backend API URL explicitly
  const apiUrl = Cypress.env("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:5000";

  beforeEach(() => {
    cy.window().then((win) =>
      win.localStorage.setItem("token", "fake-jwt-token"),
    );
  });

  it("should display the empty state when no inventory exists", () => {
    // Specifically target the backend API
    cy.intercept("GET", `${apiUrl}/inventory`, {
      statusCode: 200,
      body: [],
    }).as("getEmptyInv");
    cy.visit("/inventory");
    cy.wait("@getEmptyInv");

    cy.contains("Warehouse is completely empty.").should("exist");
  });

  it("should render inventory and dynamically calculate expiration statuses", () => {
    const today = new Date();

    const expiredDate = new Date(today);
    expiredDate.setDate(today.getDate() - 10);

    const expiringSoonDate = new Date(today);
    expiringSoonDate.setDate(today.getDate() + 10);

    const safeDate = new Date(today);
    safeDate.setDate(today.getDate() + 180);

    cy.intercept("GET", `${apiUrl}/inventory`, {
      statusCode: 200,
      body: [
        {
          id: 1,
          name: "Fetal Bovine Serum",
          category: "Raw Material",
          lot_number: "FBS-111",
          quantity: 5,
          unit: "Bottles",
          expiration_date: expiredDate.toISOString().split("T")[0],
          status: "Released",
        },
        {
          id: 2,
          name: "Isopropyl Alcohol 70%",
          category: "Consumable",
          lot_number: "IPA-222",
          quantity: 20,
          unit: "Liters",
          expiration_date: expiringSoonDate.toISOString().split("T")[0],
          status: "Released",
        },
        {
          id: 3,
          name: "Cell Culture Media",
          category: "Reagent",
          lot_number: "CCM-333",
          quantity: 50,
          unit: "Bags",
          expiration_date: safeDate.toISOString().split("T")[0],
          status: "Released",
        },
      ],
    }).as("getInv");

    cy.visit("/inventory");
    cy.wait("@getInv");

    // Verify the dynamic status logic
    cy.contains("Expired").should("have.class", "text-red-500");
    cy.contains("Exp. Soon").should("have.class", "text-amber-500");
    // Safe items just show the date text normally
    cy.contains(safeDate.toISOString().split("T")[0]).should("exist");
  });

  it("should successfully log new materials to the warehouse", () => {
    cy.intercept("GET", `${apiUrl}/inventory`, { body: [] }).as("getInitial");
    cy.visit("/inventory");
    cy.wait("@getInitial");

    // Open the form
    cy.contains("button", "+ Receive Material").click({ force: true });

    // Fill the form
    cy.get('input[placeholder="e.g., Isopropyl Alcohol"]').type("Wash Buffer");

    // THE FIX: Target the select specifically inside the form to avoid the Navbar dropdown
    cy.get("form select").select("Reagent");

    cy.get('input[placeholder="e.g., L-90210"]').type("WB-2026-A");
    cy.get('input[placeholder="0"]').type("100");
    cy.get('input[placeholder="e.g., Bottles, Boxes, mL"]').type("Liters");
    cy.get('input[type="date"]').type("2028-12-31");

    // Mock the submission
    cy.intercept("POST", `${apiUrl}/inventory`, {
      statusCode: 201,
      body: { success: true },
    }).as("postInv");
    cy.intercept("GET", `${apiUrl}/inventory`, {
      statusCode: 200,
      body: [
        {
          id: 99,
          name: "Wash Buffer",
          category: "Reagent",
          lot_number: "WB-2026-A",
          quantity: 100,
          unit: "Liters",
          expiration_date: "2028-12-31",
          status: "Released",
        },
      ],
    }).as("getRefreshed");

    // Submit
    cy.contains("button", "Log Inventory to Warehouse").click({ force: true });
    cy.wait("@postInv");
    cy.wait("@getRefreshed");

    // Verify success
    cy.contains("Material successfully logged to warehouse.").should("exist");
    cy.contains("Wash Buffer").should("exist");
    cy.contains("100").should("exist");
  });
});

describe("User Registration Page", () => {
  const apiUrl = Cypress.env("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:5000";

  context("Unauthenticated State (Security Check)", () => {
    it("should block registration if the admin token is missing", () => {
      // Ensure no token exists
      cy.clearLocalStorage();
      cy.visit("/register"); // Adjust URL to match your routing

      // Attempt to fill out the form
      cy.get('input[placeholder="Enter username"]').type("rogue_hacker");
      cy.get('input[placeholder="••••••••"]').type("hacked123");

      // Click submit
      cy.contains("button", "Provision Account").click({ force: true });

      // Verify the security block triggers the red error banner
      cy.contains(
        "You must be logged in as an admin to register users.",
      ).should("exist");
    });
  });

  context("Authenticated Admin State", () => {
    beforeEach(() => {
      // Simulate an authenticated admin session
      cy.window().then((win) =>
        win.localStorage.setItem("token", "fake-admin-token"),
      );
      cy.visit("/register");
    });

    it("should successfully provision a new user account", () => {
      // 1. Fill out the registration form
      cy.get('input[placeholder="Enter username"]').type("new_qc_analyst");
      cy.get('input[placeholder="••••••••"]').type("SecurePass!2026");

      // Select the specific role (Using 'form select' to avoid Navbar conflicts)
      cy.get("form select").select("qc_user");

      // 2. Intercept the API to simulate a successful database insert
      cy.intercept("POST", `${apiUrl}/register`, {
        statusCode: 201,
        body: { message: "User new_qc_analyst created successfully." },
      }).as("registerUser");

      // 3. Submit the form
      cy.contains("button", "Provision Account").click({ force: true });
      cy.wait("@registerUser");

      // 4. Verify the green success banner appears
      cy.contains("User new_qc_analyst created successfully.").should("exist");

      // 5. Verify the form inputs are automatically cleared for the next entry
      cy.get('input[placeholder="Enter username"]').should("have.value", "");
      cy.get('input[placeholder="••••••••"]').should("have.value", "");
    });

    it("should display an error banner if the API rejects the registration (e.g., username taken)", () => {
      // Fill out the form
      cy.get('input[placeholder="Enter username"]').type("existing_admin");
      cy.get('input[placeholder="••••••••"]').type("password123");
      cy.get("form select").select("admin");

      // Force the API to return a 400 Bad Request error
      cy.intercept("POST", `${apiUrl}/register`, {
        statusCode: 400,
        body: { error: "Username already exists in the system." },
      }).as("registerFail");

      // Submit the form
      cy.contains("button", "Provision Account").click({ force: true });
      cy.wait("@registerFail");

      // Verify the red error box renders the exact API error message
      cy.contains("Username already exists in the system.").should("exist");

      // Verify the inputs were NOT cleared so the user can fix the typo
      cy.get('input[placeholder="Enter username"]').should(
        "have.value",
        "existing_admin",
      );
    });
  });
});

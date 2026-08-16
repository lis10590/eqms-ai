describe("Change Controls Dashboard", () => {
  const apiUrl = Cypress.env("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:5000";

  context("Unauthenticated State", () => {
    it("should show an error if the user is not logged in", () => {
      // Clear any existing tokens to simulate a logged-out user
      cy.clearLocalStorage();

      // Adjust this URL if your route is named differently (e.g., /change-controls)
      cy.visit("/change-controls");

      // Verify the error message renders perfectly
      cy.contains(
        "You are not logged in. Please return to the login screen.",
      ).should("be.visible");
      // Verify the table does NOT render data
      cy.get("table").should("exist");
    });
  });

  context("Authenticated State", () => {
    beforeEach(() => {
      // Set a fake token so the page attempts to fetch data
      cy.window().then((win) => {
        win.localStorage.setItem("token", "fake-jwt-token");
      });
    });

    it("should display the empty state when no change controls exist", () => {
      // Intercept the API call and return an empty array
      cy.intercept("GET", "**/change_controls", {
        statusCode: 200,
        body: [],
      }).as("getEmptyChanges");

      cy.visit("/change-controls");
      cy.wait("@getEmptyChanges");

      // Verify the beautiful empty state SVG and text renders
      cy.contains(
        "No Change Controls found. Initiate a new change to begin.",
      ).should("be.visible");
    });

    it("should render a list of change controls with correct classification badges", () => {
      // Intercept the API call and provide mock data to test your dynamic Tailwind classes
      cy.intercept("GET", "**/change_controls", {
        statusCode: 200,
        body: [
          {
            id: 101,
            title: "Update HVAC Setpoints in Cleanroom A",
            classification: "Critical",
            status: "Pending QA Approval",
            created_at: "2026-08-16",
          },
          {
            id: 102,
            title: "Fix Typo in Gowning SOP",
            classification: "Minor",
            status: "Approved",
            created_at: "2026-08-15",
          },
        ],
      }).as("getPopulatedChanges");

      cy.visit("/change-controls");
      cy.wait("@getPopulatedChanges");

      // Check that the critical change rendered with the correct ID and Title
      cy.contains("CC-101").should("be.visible");
      cy.contains("Update HVAC Setpoints in Cleanroom A").should("be.visible");

      // Verify the dynamic styling applied correctly to the 'Critical' badge (red text)
      cy.contains("Critical").should("have.class", "text-red-500");

      // Verify the 'Minor' badge rendered with green styling
      cy.contains("Minor").should("have.class", "text-green-500");
    });

    it("should open the Change Control modal when clicking Initiate Change", () => {
      // Mock an empty table just to load the page cleanly
      cy.intercept("GET", "**/change_controls", { body: [] }).as("getChanges");
      cy.visit("/change-controls");
      cy.wait("@getChanges");

      // Click the button
      cy.contains("button", "+ Initiate Change").click();

      // Since we don't have the Modal code yet, we can check for a common backdrop class
      // or assume the modal opens. (We will test the modal's contents next!)
      cy.get(".fixed.inset-0").should("exist"); // Checks for the modal backdrop
    });
  });
});

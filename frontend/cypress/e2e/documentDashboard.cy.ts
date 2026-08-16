describe("Document Control Center Dashboard", () => {
  const apiUrl = Cypress.env("NEXT_PUBLIC_API_URL") || "http://127.0.0.1:5000";

  context("Unauthenticated State", () => {
    it("should show an authentication error if the user has no token", () => {
      cy.clearLocalStorage();
      cy.visit("/documents");

      cy.contains("Authentication error: Please log in again.").should("exist");
    });
  });

  context("Authenticated State", () => {
    beforeEach(() => {
      cy.window().then((win) =>
        win.localStorage.setItem("token", "fake-jwt-token"),
      );
    });

    it("should display the empty state when no documents exist in the active tab", () => {
      cy.intercept("GET", "**/documents*view=active*", {
        statusCode: 200,
        body: [],
      }).as("getEmptyDocs");

      cy.visit("/documents");
      cy.wait("@getEmptyDocs"); // Wait for initial load

      cy.contains("No documents found in this queue.").should("exist");
    });

    it("should render documents and dynamically color status badges", () => {
      cy.intercept("GET", "**/documents*view=active*", {
        statusCode: 200,
        body: [
          {
            version_id: 1,
            document_number: "SOP-001",
            title: "Gowning Procedure",
            version: "2.0",
            status: "Authorized",
            reviewer: "QA Admin",
          },
          {
            version_id: 2,
            document_number: "SOP-002",
            title: "Incubator Maintenance",
            version: "1.1",
            status: "Pending Review",
            reviewer: "QA Admin",
          },
        ],
      }).as("getActiveDocs");

      cy.visit("/documents");
      cy.wait("@getActiveDocs"); // Wait for initial load

      cy.contains("SOP-001").should("exist");
      cy.contains("Gowning Procedure").should("exist");
      cy.contains("Authorized").should("have.class", "text-green-600");
      cy.contains("Pending Review").should("have.class", "text-amber-600");

      cy.contains("button", "Approve").should("not.exist");
    });

    it("should navigate tabs and conditionally show the Approve button", () => {
      cy.intercept("GET", "**/documents*view=active*", {
        statusCode: 200,
        body: [],
      }).as("getActive");
      cy.intercept("GET", "**/documents*view=my_reviews*", {
        statusCode: 200,
        body: [
          {
            version_id: 3,
            document_number: "SOP-042",
            title: "Deviation Handling",
            version: "3.0",
            status: "Pending Review",
            reviewer: "Lis Setgasy",
          },
        ],
      }).as("getMyReviews");

      cy.visit("/documents");
      cy.wait("@getActive"); // Prevent race condition by waiting for page to settle

      // Force click ensures Cypress interacts even if UI animations are happening
      cy.contains("button", "For My Review").click({ force: true });
      cy.wait("@getMyReviews");

      cy.contains("button", "Approve").should("exist");
    });

    it("should successfully approve a document", () => {
      cy.intercept("GET", "**/documents*view=active*", {
        statusCode: 200,
        body: [],
      }).as("getActive");
      cy.intercept("GET", "**/documents*view=my_reviews*", {
        statusCode: 200,
        body: [
          {
            version_id: 4,
            document_number: "SOP-100",
            title: "Test SOP",
            version: "1.0",
            status: "Pending Review",
            reviewer: "Lis",
          },
        ],
      }).as("loadReviews");

      cy.visit("/documents");
      cy.wait("@getActive"); // Prevent race condition

      cy.contains("button", "For My Review").click({ force: true });
      cy.wait("@loadReviews");

      cy.intercept("PUT", "**/approve_document/4", {
        statusCode: 200,
        body: { success: true },
      }).as("approveDoc");

      cy.intercept("GET", "**/documents*view=my_reviews*", {
        statusCode: 200,
        body: [
          {
            version_id: 4,
            document_number: "SOP-100",
            title: "Test SOP",
            version: "1.0",
            status: "Authorized",
            reviewer: "Lis",
          },
        ],
      }).as("refreshReviews");

      cy.contains("button", "Approve").click({ force: true });
      cy.wait("@approveDoc");
      cy.wait("@refreshReviews");

      cy.contains("Document successfully authorized!").should("exist");
    });

    it("should successfully open the PDF in a new tab", () => {
      cy.intercept("GET", "**/documents*view=active*", {
        statusCode: 200,
        body: [
          {
            version_id: 5,
            document_number: "SOP-999",
            title: "PDF Test",
            version: "1.0",
            status: "Authorized",
            reviewer: "Admin",
          },
        ],
      }).as("getDocs");

      cy.intercept("GET", "**/view_document/5", {
        statusCode: 200,
        body: { url: "https://fake-s3-bucket.aws.com/SOP-999.pdf" },
      }).as("viewDoc");

      cy.visit("/documents");
      cy.wait("@getDocs"); // Prevent race condition

      cy.window().then((win) => {
        cy.stub(win, "open").as("windowOpen");
      });

      cy.contains("button", "View PDF").click({ force: true });
      cy.wait("@viewDoc");

      cy.get("@windowOpen").should(
        "have.been.calledWith",
        "https://fake-s3-bucket.aws.com/SOP-999.pdf",
        "_blank",
      );
    });

    it("should trigger the Upload SOP Modal", () => {
      cy.intercept("GET", "**/documents*view=active*", { body: [] }).as(
        "getActive",
      );
      cy.visit("/documents");
      cy.wait("@getActive"); // Crucial wait to let the button attach its onClick handler

      cy.contains("button", "+ Upload New SOP").click({ force: true });

      cy.get(".fixed").should("exist");
    });

    it("should render personalized content in the My Reviews tab based on the logged-in persona", () => {
      cy.intercept("GET", "**/documents*view=active*", { body: [] }).as(
        "getActive",
      );
      cy.visit("/documents");
      cy.wait("@getActive"); // Prevent race condition

      cy.intercept("GET", "**/documents*view=my_reviews*", {
        statusCode: 200,
        body: [
          {
            version_id: 10,
            document_number: "SOP-300",
            title: "Review Bioreactor Logs",
            version: "1.0",
            status: "Pending Review",
            reviewer: "Lis Setgasy",
          },
        ],
      }).as("getLisReviews");

      cy.contains("button", "For My Review").click({ force: true });
      cy.wait("@getLisReviews");
      cy.contains("SOP-300").should("exist");
      cy.contains("Lis Setgasy").should("exist");

      cy.intercept("GET", "**/documents*view=my_reviews*", {
        statusCode: 200,
        body: [],
      }).as("getEmptyReviews");

      cy.contains("button", "Active SOPs").click({ force: true });
      cy.wait("@getActive"); // Wait for Active tab to settle

      cy.contains("button", "For My Review").click({ force: true });
      cy.wait("@getEmptyReviews");

      cy.contains("SOP-300").should("not.exist");
      cy.contains("No documents found in this queue.").should("exist");
    });
  });
});

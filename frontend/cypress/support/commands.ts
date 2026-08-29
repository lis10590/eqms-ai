/// <reference types="cypress" />

// This empty export turns the file into a module, fixing the 'declare global' error
export {};

// 1. Tell TypeScript that our custom cy.login() command exists
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to bypass the login screen by injecting a mock JWT.
       * @example cy.login('qa_user')
       */
      login(role?: string): Chainable<void>;
    }
  }
}

// 2. Define exactly what cy.login() actually does
Cypress.Commands.add("login", (role: string = "admin") => {
  const fakeToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake_payload.fake_signature";

  cy.window().then((win) => {
    win.localStorage.setItem("token", fakeToken);
    win.localStorage.setItem("role", role);
  });
});

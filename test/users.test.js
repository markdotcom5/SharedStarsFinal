const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

describe("User API", () => {
    let authToken; // Store token

    beforeAll(async () => {
        // Create a test user first (if needed)
        await request(app)
            .post("/api/users")
            .send({ name: "Test User", email: "testuser@example.com", password: "testpassword" });

        // Fetch a valid authentication token before running the tests
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({ email: "testuser@example.com", password: "testpassword" });

        authToken = loginResponse.body.token; // Save the token
    });

    afterAll(async () => {
        await mongoose.connection.close(); // Ensure MongoDB disconnects after tests
    });

    test("GET /users should return a list of users", async () => {
        const res = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${authToken}`); // Attach token

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
afterAll(async () => {
    await mongoose.connection.close();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Prevent Jest from hanging
});

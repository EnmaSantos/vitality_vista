import { assertEquals, assertExists } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Context } from "../deps.ts"; // Assuming deps.ts exports Context
import { updateUserProfileHandler } from "./profileController.ts";
import dbClient from "../services/db.ts"; // To mock dbClient
import { UserProfileSchema, USER_PROFILES_TABLE_NAME } from "../models/userProfile.model.ts";

// Mock dbClient
const originalDbClientQueryObject = dbClient.queryObject;
let storedOriginalDbClientQueryObject: typeof dbClient.queryObject; // To store and restore

const mockContext = (
  payload: any,
  userId: string | undefined = "test-user-id",
  hasRequestBody: boolean = true,
): Context => {
  return {
    request: {
      hasBody: hasRequestBody,
      body: () => ({ type: "json", value: Promise.resolve(payload) }),
    },
    response: {
      status: 0,
      body: {},
    },
    state: { userId },
    // Add other properties like cookies, params, etc., if needed by the handler
  } as unknown as Context;
};

Deno.test("updateUserProfileHandler - Main Test Suite", async (t) => {
  // Store the original queryObject function
  storedOriginalDbClientQueryObject = dbClient.queryObject;

  await t.step("Test Case 1: Update height_cm with a float", async () => {
    const mockPayload = { height_cm: 175.75 };
    const ctx = mockContext(mockPayload);
    const expectedDbResult: UserProfileSchema = {
      user_id: "test-user-id",
      height_cm: 175.75,
      weight_kg: null,
      date_of_birth: null,
      gender: null,
      activity_level: null,
      fitness_goals: null,
      dietary_restrictions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbClient.queryObject = () => Promise.resolve({ rows: [expectedDbResult] } as any);

    await updateUserProfileHandler(ctx);

    assertEquals(ctx.response.status, 200);
    assertExists(ctx.response.body);
    const responseBody = ctx.response.body as any;
    assertEquals(responseBody.success, true);
    assertEquals(responseBody.data.height_cm, 175.75);
  });

  await t.step("Test Case 2: Update weight_kg with a float", async () => {
    const mockPayload = { weight_kg: 68.5 };
    const ctx = mockContext(mockPayload);
    const expectedDbResult: UserProfileSchema = {
      user_id: "test-user-id",
      height_cm: null,
      weight_kg: 68.5,
      date_of_birth: null,
      gender: null,
      activity_level: null,
      fitness_goals: null,
      dietary_restrictions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbClient.queryObject = () => Promise.resolve({ rows: [expectedDbResult] } as any);

    await updateUserProfileHandler(ctx);

    assertEquals(ctx.response.status, 200);
    const responseBody = ctx.response.body as any;
    assertEquals(responseBody.success, true);
    assertEquals(responseBody.data.weight_kg, 68.5);
  });

  await t.step("Test Case 3: Update both height_cm and weight_kg with floats", async () => {
    const mockPayload = { height_cm: 160.2, weight_kg: 55.9 };
    const ctx = mockContext(mockPayload);
    const expectedDbResult: UserProfileSchema = {
      user_id: "test-user-id",
      height_cm: 160.2,
      weight_kg: 55.9,
      date_of_birth: null,
      gender: null,
      activity_level: null,
      fitness_goals: null,
      dietary_restrictions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbClient.queryObject = () => Promise.resolve({ rows: [expectedDbResult] } as any);

    await updateUserProfileHandler(ctx);

    assertEquals(ctx.response.status, 200);
    const responseBody = ctx.response.body as any;
    assertEquals(responseBody.success, true);
    assertEquals(responseBody.data.height_cm, 160.2);
    assertEquals(responseBody.data.weight_kg, 55.9);
  });

  await t.step("Test Case 4: Input as string representations of floats", async () => {
    const mockPayload = { height_cm: "176.3", weight_kg: "70.2" };
    const ctx = mockContext(mockPayload);
    const expectedDbResult: UserProfileSchema = {
      user_id: "test-user-id",
      height_cm: 176.3,
      weight_kg: 70.2,
      date_of_birth: null,
      gender: null,
      activity_level: null,
      fitness_goals: null,
      dietary_restrictions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbClient.queryObject = ((_query: string, args: any[]) => {
      assertEquals(typeof args[2], "number");
      assertEquals(args[2], 176.3);
      assertEquals(typeof args[3], "number");
      assertEquals(args[3], 70.2);
      return Promise.resolve({ rows: [expectedDbResult] } as any);
    }) as any;

    await updateUserProfileHandler(ctx);

    assertEquals(ctx.response.status, 200);
    const responseBody = ctx.response.body as any;
    assertEquals(responseBody.success, true);
    assertEquals(responseBody.data.height_cm, 176.3);
    assertEquals(responseBody.data.weight_kg, 70.2);
  });

  await t.step("Test Case 5: Ensure integers and nulls still work", async () => {
    const mockPayload = { height_cm: 180, weight_kg: null };
    const ctx = mockContext(mockPayload);
    const expectedDbResult: UserProfileSchema = {
      user_id: "test-user-id",
      height_cm: 180,
      weight_kg: null,
      date_of_birth: null,
      gender: null,
      activity_level: null,
      fitness_goals: null,
      dietary_restrictions: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dbClient.queryObject = ((_query: string, args: any[]) => {
      assertEquals(args[2], 180);
      assertEquals(args[3], null);
      return Promise.resolve({ rows: [expectedDbResult] } as any);
    }) as any;

    await updateUserProfileHandler(ctx);

    assertEquals(ctx.response.status, 200);
    const responseBody = ctx.response.body as any;
    assertEquals(responseBody.success, true);
    assertEquals(responseBody.data.height_cm, 180);
    assertEquals(responseBody.data.weight_kg, null);
  });
  
  // Teardown: Restore the original dbClient.queryObject
  dbClient.queryObject = storedOriginalDbClientQueryObject;
});

// Test for unauthenticated user
Deno.test("updateUserProfileHandler - Unauthenticated user", async () => {
  const tempOriginalQueryObject = dbClient.queryObject;
  // If dbClient.queryObject is called, it's a flow error.
  // This mock will allow the handler to proceed and likely return 200 if the guard fails.
  dbClient.queryObject = (() => Promise.resolve({ rows: [{ "user_id": "unexpected_db_call" }] } as any)) as any;

  const mockPayload = { height_cm: 170 };
  const ctx = mockContext(mockPayload, null as any); // Pass null for userId to avoid default value

  await updateUserProfileHandler(ctx);

  assertEquals(ctx.response.status, 401);
  const responseBody = ctx.response.body as any;
  assertEquals(responseBody.success, false);
  assertEquals(responseBody.message, "User not authenticated");
  
  dbClient.queryObject = tempOriginalQueryObject; // Restore
});

// Test for missing request body
Deno.test("updateUserProfileHandler - Missing request body", async () => {
  const tempOriginalQueryObject = dbClient.queryObject;
  // If dbClient.queryObject is called, it's a flow error.
  dbClient.queryObject = (() => Promise.resolve({ rows: [{ "user_id": "unexpected_db_call" }] } as any)) as any;
  
  const ctx = mockContext(null, "test-user-id", false); // Payload is null, hasRequestBody is false

  await updateUserProfileHandler(ctx);

  assertEquals(ctx.response.status, 400);
  const responseBody = ctx.response.body as any;
  assertEquals(responseBody.success, false);
  assertEquals(responseBody.message, "Request body is missing");

  dbClient.queryObject = tempOriginalQueryObject; // Restore
});

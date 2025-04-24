// backend/controllers/foodController.ts

import { Context } from "../deps.ts"; // Import Oak's Context type [cite: vitality_vista.zip/backend/deps.ts]
import {
  searchFoods,
  getFoodDetails,
  // Import interfaces if needed for type checking or transformation
  // UsdaSearchResponse,
  // UsdaFoodItem,
} from "../services/usdaApi.ts"; // Import the USDA service functions

/**
 * Handles requests to search for foods via USDA FDC API.
 * Expects a 'query' query parameter (e.g., /api/food/search?query=apple)
 * Optional: 'page' and 'pageSize' query parameters.
 */
export async function searchFoodsHandler(ctx: Context) {
  try {
    const searchParams = ctx.request.url.searchParams;
    const query = searchParams.get("query");
    const pageParam = searchParams.get("page");
    const pageSizeParam = searchParams.get("pageSize");

    if (!query || query.trim() === "") {
      ctx.response.status = 400; // Bad Request
      ctx.response.body = { success: false, message: "Missing 'query' query parameter" };
      return;
    }

    // Parse pagination params, provide defaults
    const pageNumber = pageParam ? parseInt(pageParam, 10) : 1;
    const pageSize = pageSizeParam ? parseInt(pageSizeParam, 10) : 10;

    // Validate parsed numbers
    if (isNaN(pageNumber) || pageNumber < 1) {
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid 'page' parameter, must be a positive integer." };
        return;
    }
     if (isNaN(pageSize) || pageSize < 1 || pageSize > 50) { // Example max page size limit
        ctx.response.status = 400;
        ctx.response.body = { success: false, message: "Invalid 'pageSize' parameter, must be between 1 and 50." };
        return;
    }


    // Call the service function
    const searchResult = await searchFoods(query, pageNumber, pageSize);

    if (searchResult === null) {
        // Indicates an error occurred within the service function (already logged)
        ctx.response.status = 500;
        ctx.response.body = { success: false, message: "Error searching USDA database." };
        return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: searchResult, // Return the full search result object from USDA
    };

  } catch (error) {
    // Catch unexpected errors during parameter processing etc.
    console.error("Error in searchFoodsHandler:", error);
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error processing food search",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Handles requests to get specific food details by FDC ID.
 * Expects the FDC ID as a route parameter (e.g., /api/food/169967)
 */
export async function getFoodDetailsHandler(ctx: Context) {
  try {
    const fdcId = ctx.params.fdcId; // Get fdcId from route parameters

    if (!fdcId) {
       console.error("Error: fdcId parameter missing in route context");
       ctx.response.status = 500;
       ctx.response.body = { success: false, message: "Server configuration error: Missing FDC ID parameter" };
       return;
    }

    // Optional: Validate if fdcId looks like a number, though the service call handles it
    const fdcIdNumber = parseInt(fdcId, 10);
    if (isNaN(fdcIdNumber)) {
       ctx.response.status = 400;
       ctx.response.body = { success: false, message: "Invalid FDC ID format, must be numeric." };
       return;
    }

    // Call the service function
    const foodDetails = await getFoodDetails(fdcIdNumber);

    if (foodDetails === null) {
      // Could be not found or an error in the service (error already logged)
      ctx.response.status = 404; // Not Found (or 500 if service logged error)
      ctx.response.body = { success: false, message: `Food item with FDC ID ${fdcId} not found or error retrieving details.` };
      return;
    }

    // If found, return the food details data
    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: foodDetails,
    };

  } catch (error) {
    console.error(`Error in getFoodDetailsHandler for ID ${ctx.params.fdcId}:`, error);
    ctx.response.status = 500; // Internal Server Error
    ctx.response.body = {
      success: false,
      message: "Server error retrieving food details",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
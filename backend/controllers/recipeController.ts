import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts"; // Adjust version as needed
import {
    searchFatSecretRecipesPlatform,
    getFatSecretRecipeByIdPlatform,
    getFatSecretRecipeTypesPlatform,
    FatSecretRecipeAPISearchParams // Import the param type
} from "../services/nutritionService.ts";

// Helper function to send success response
const sendSuccess = (ctx: RouterContext<any, any>, data: any) => {
    ctx.response.status = 200;
    ctx.response.body = { success: true, data };
};

// Helper function to send error response
const sendError = (ctx: RouterContext<any, any>, message: string, status: number = 500) => {
    console.error(`Controller Error: ${message}`); // Log error server-side
    ctx.response.status = status;
    ctx.response.body = { success: false, message };
};

/**
 * Controller to handle searching FatSecret recipes.
 * Extracts query parameters and calls the service.
 */
export const handleSearchFatSecretRecipes = async (ctx: RouterContext<any, any>) => {
    try {
        // Extract query parameters from the request URL
        const params: FatSecretRecipeAPISearchParams = {
            search_expression: ctx.request.url.searchParams.get("search_expression") || undefined,
            recipe_types: ctx.request.url.searchParams.get("recipe_types") || undefined,
            page_number: ctx.request.url.searchParams.get("page_number") || undefined,
            max_results: ctx.request.url.searchParams.get("max_results") || undefined,
            // Add extraction for other parameters if needed
        };

        // Remove undefined keys to avoid sending empty params
        Object.keys(params).forEach(key => params[key as keyof FatSecretRecipeAPISearchParams] === undefined && delete params[key as keyof FatSecretRecipeAPISearchParams]);

        const result = await searchFatSecretRecipesPlatform(params);
        
        // Check if the result contains an error from FatSecret API
        if (result.error) {
            return sendError(ctx, `FatSecret API error ${result.error.code}: ${result.error.message}`, 400);
        }
        
        sendSuccess(ctx, result);
    } catch (error) {
        sendError(ctx, error instanceof Error ? error.message : "Failed to search recipes");
    }
};

/**
 * Controller to handle getting FatSecret recipe details by ID.
 * Extracts ID from path parameters and calls the service.
 */
export const handleGetFatSecretRecipeById = async (ctx: RouterContext<any, { id: string }>) => { // Define route param type
    try {
        const { id } = ctx.params; // Get ID from route parameters (e.g., /api/fatsecret/recipes/:id)
        if (!id) {
            return sendError(ctx, "Recipe ID is required", 400);
        }
        const result = await getFatSecretRecipeByIdPlatform(id);
        
        // Check if the result contains an error from FatSecret API
        if (result.error) {
            return sendError(ctx, `FatSecret API error ${result.error.code}: ${result.error.message}`, 400);
        }
        
        sendSuccess(ctx, result);
    } catch (error) {
        sendError(ctx, error instanceof Error ? error.message : "Failed to get recipe details");
    }
};

/**
 * Controller to handle getting the list of FatSecret recipe types.
 */
export const handleGetFatSecretRecipeTypes = async (ctx: RouterContext<any, any>) => {
    console.log("Attempting to handle /api/fatsecret/recipes/types");
    try {
        const result = await getFatSecretRecipeTypesPlatform();
        
        // Check if the result contains an error from FatSecret API
        if (result.error) {
            return sendError(ctx, `FatSecret API error ${result.error.code}: ${result.error.message}`, 400);
        }
        
        sendSuccess(ctx, result);
    } catch (error) {
        sendError(ctx, error instanceof Error ? error.message : "Failed to get recipe types");
    }
};


import { searchFoodNutrition } from "./services/nutritionService.ts";

const testFoods = ["flour", "sugar", "milk", "butter", "rice", "chicken breast", "apple"];

async function checkUnits() {
    console.log("Checking serving units for common foods...");
    for (const food of testFoods) {
        try {
            const results = await searchFoodNutrition(food, 1);
            if (results.length > 0) {
                const item = results[0];
                console.log(`\nFood: ${item.name}`);
                console.log(`Reference Serving: ${item.servingSize}`);
                if (item.availableServings) {
                    item.availableServings.forEach(s => {
                        console.log(` - ${s.servingSize} (${s.metricServingAmount} ${s.metricServingUnit})`);
                    });
                }
            }
        } catch (error) {
            console.error(`Error searching ${food}:`, error);
        }
    }
}

checkUnits();

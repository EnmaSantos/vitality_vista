
import { NutritionServing } from "../services/foodLogApi";

// --- Constants & Types ---

export type UnitType = 'weight' | 'volume' | 'piece';

interface UnitDef {
    label: string;
    type: UnitType;
    baseFactor: number; // Factor to convert TO the base unit (g for weight, mL for volume)
}

// Base units: Grams (g) for weight, Milliliters (mL) for volume
export const UNITS: Record<string, UnitDef> = {
    // Weight (Base: g)
    'g': { label: 'g', type: 'weight', baseFactor: 1 },
    'mg': { label: 'mg', type: 'weight', baseFactor: 0.001 },
    'kg': { label: 'kg', type: 'weight', baseFactor: 1000 },
    'oz': { label: 'oz', type: 'weight', baseFactor: 28.3495 },
    'lb': { label: 'lb', type: 'weight', baseFactor: 453.592 },

    // Volume (Base: mL)
    'ml': { label: 'mL', type: 'volume', baseFactor: 1 },
    'l': { label: 'L', type: 'volume', baseFactor: 1000 },
    'tsp': { label: 'tsp', type: 'volume', baseFactor: 4.92892 },
    'tbsp': { label: 'tbsp', type: 'volume', baseFactor: 14.7868 },
    'fl oz': { label: 'fl oz', type: 'volume', baseFactor: 29.5735 },
    'cup': { label: 'cup', type: 'volume', baseFactor: 236.588 },
    'pt': { label: 'pt', type: 'volume', baseFactor: 473.176 },
    'qt': { label: 'qt', type: 'volume', baseFactor: 946.353 },
    'gal': { label: 'gal', type: 'volume', baseFactor: 3785.41 },
};

// Densities in g/mL (which is roughly g/cm^3)
// Derived from "g per cup" table: Density = (g per cup) / 236.588
const DENSITIES: Record<string, number> = {
    // Water default
    'water': 1.0,

    // Baking
    'flour': 120 / 236.588,       // ~0.51 - Average of all-purpose
    'bread flour': 130 / 236.588,
    'cake flour': 115 / 236.588,
    'sugar': 200 / 236.588,       // Granulated
    'brown sugar': 220 / 236.588, // Packed
    'powdered sugar': 120 / 236.588,
    'butter': 227 / 236.588,      // ~0.96
    'cocoa': 90 / 236.588,        // ~0.38

    // Liquids
    'milk': 245 / 236.588,        // ~1.04
    'oil': 218 / 236.588,         // ~0.92 (Vegetable)
    'honey': 340 / 236.588,       // ~1.44

    // Grains
    'oats': 90 / 236.588,         // Rolled
    'rice': 185 / 236.588,        // Uncooked

    // Condiments
    'salt': 292 / 236.588,        // Table salt
};

// Helper to determine density from food name
function getDensity(foodName: string): number | null {
    const lowerName = foodName.toLowerCase();

    // Specific checks first
    if (lowerName.includes('brown sugar')) return DENSITIES['brown sugar'];
    if (lowerName.includes('powdered sugar') || lowerName.includes('confectioners')) return DENSITIES['powdered sugar'];
    if (lowerName.includes('bread flour')) return DENSITIES['bread flour'];
    if (lowerName.includes('cake flour')) return DENSITIES['cake flour'];

    // General checks
    if (lowerName.includes('flour')) return DENSITIES['flour'];
    if (lowerName.includes('sugar')) return DENSITIES['sugar'];
    if (lowerName.includes('butter')) return DENSITIES['butter'];
    if (lowerName.includes('milk')) return DENSITIES['milk'];
    if (lowerName.includes('oil')) return DENSITIES['oil'];
    if (lowerName.includes('honey')) return DENSITIES['honey'];
    if (lowerName.includes('oat')) return DENSITIES['oats'];
    if (lowerName.includes('rice')) return DENSITIES['rice'];
    if (lowerName.includes('salt')) return DENSITIES['salt'];
    if (lowerName.includes('consumer water') || lowerName === 'water') return DENSITIES['water'];

    return null;
}

// --- Parsing Logic ---

interface ParsedServing {
    amount: number;
    unit: string; // The key from UNITS
    unitType: UnitType;
}

export function parseServingString(description: string): ParsedServing | null {
    if (!description) return null;
    const lowerDesc = description.toLowerCase().trim();

    // Regex to match "100 g", "1.5 cup", "1/2 tsp"
    // Handles fractions like "1/2" and decimals
    const regex = /^([\d\.]+(?:\/[\d\.]+)?)\s*([a-z\s]+)$/;
    const match = lowerDesc.match(regex);

    // If not a simple "Number Unit" string (e.g. "1 medium apple"), we check if it contains keywords
    // But strict parsing is better for the bridge unit identification
    if (!match) return null;

    let amountStr = match[1];
    let unitLabel = match[2].trim();

    // Handle fraction
    let amount = 0;
    if (amountStr.includes('/')) {
        const [num, den] = amountStr.split('/').map(Number);
        if (!isNaN(num) && !isNaN(den) && den !== 0) {
            amount = num / den;
        }
    } else {
        amount = parseFloat(amountStr);
    }

    if (isNaN(amount)) return null;

    // Normalize unit label to one of our keys
    let unitKey: string | null = null;

    // Direct match
    if (UNITS[unitLabel]) unitKey = unitLabel;

    // Common variations
    else if (unitLabel === 'gram' || unitLabel === 'grams') unitKey = 'g';
    else if (unitLabel === 'ounce' || unitLabel === 'ounces') unitKey = 'oz';
    else if (unitLabel === 'pound' || unitLabel === 'pounds') unitKey = 'lb';
    else if (unitLabel === 'kilogram' || unitLabel === 'kilograms') unitKey = 'kg';
    else if (unitLabel === 'milliliter' || unitLabel === 'milliliters') unitKey = 'ml';
    else if (unitLabel === 'liter' || unitLabel === 'liters') unitKey = 'l';
    else if (unitLabel === 'teaspoon' || unitLabel === 'teaspoons') unitKey = 'tsp';
    else if (unitLabel === 'tablespoon' || unitLabel === 'tablespoons') unitKey = 'tbsp';
    else if (unitLabel === 'fluid ounce' || unitLabel === 'fl oz') unitKey = 'fl oz';
    else if (unitLabel === 'cup' || unitLabel === 'cups') unitKey = 'cup';
    else if (unitLabel === 'pint' || unitLabel === 'pints') unitKey = 'pt';
    else if (unitLabel === 'quart' || unitLabel === 'quarts') unitKey = 'qt';
    else if (unitLabel === 'gallon' || unitLabel === 'gallons') unitKey = 'gal';

    if (!unitKey) return null;

    return {
        amount,
        unit: unitKey,
        unitType: UNITS[unitKey].type
    };
}

// --- Conversion Logic ---

export interface ConvertedOption {
    label: string;
    factor: number; // Multiply original nutrition by this factor
}

export function getAvailableConversions(
    foodName: string,
    availableServings: NutritionServing[]
): { options: ConvertedOption[], bridgeServingId: string | null } {

    let options: ConvertedOption[] = [];
    let bridgeServing: NutritionServing | null = null;
    let bridgeParsed: ParsedServing | null = null;

    // 1. Find a bridge serving (prioritize 100g, then any weight, then any volume)
    for (const s of availableServings) {
        const parsed = parseServingString(s.servingSize);
        if (parsed) {
            if (parsed.unit === 'g' && parsed.amount === 100) {
                bridgeServing = s;
                bridgeParsed = parsed;
                break; // Gold standard
            }
            if (!bridgeServing && parsed.unitType === 'weight') {
                bridgeServing = s;
                bridgeParsed = parsed;
            }
            // If we don't have a weight bridge yet, accept volume (but keep looking for weight)
            if (!bridgeServing && parsed.unitType === 'volume') {
                bridgeServing = s;
                bridgeParsed = parsed;
            }
        }
    }

    if (!bridgeServing || !bridgeParsed) {
        return { options: [], bridgeServingId: null };
    }

    const bridgeId = bridgeServing.servingId;
    const density = getDensity(foodName); // g/mL

    // 2. Generate options for all supported units
    for (const [key, def] of Object.entries(UNITS)) {
        let conversionFactor = 0;

        // Same Type conversion (Weight->Weight or Volume->Volume)
        if (def.type === bridgeParsed.unitType) {
            // Factor =  (TargetUnitInBase) / (BridgeAmount * BridgeUnitInBase)
            // Wait. We want multiplier for nutrition.
            // If I have 100g (Bridge) -> X cals.
            // I want to know cals for 1 oz.
            // 1 oz = 28.35g.
            // Factor = (28.35 / 100) = 0.2835.

            // Formula: (1 * TargetUnitBaseFactor) / (BridgeAmount * BridgeUnitBaseFactor)
            conversionFactor = (1 * def.baseFactor) / (bridgeParsed.amount * UNITS[bridgeParsed.unit].baseFactor);
        }

        // Cross Type conversion with Density
        else if (density) {
            if (bridgeParsed.unitType === 'weight' && def.type === 'volume') {
                // Bridge is Weight (e.g. 100g). Target is Volume (e.g. 1 cup).
                // 1 cup = 236.58 mL.
                // Mass = Volume * Density = 236.58 * density (g).
                // Factor = (Mass_Target) / (Mass_Bridge)
                const targetMassG = (1 * def.baseFactor) * density;
                const bridgeMassG = bridgeParsed.amount * UNITS[bridgeParsed.unit].baseFactor;

                conversionFactor = targetMassG / bridgeMassG;

            } else if (bridgeParsed.unitType === 'volume' && def.type === 'weight') {
                // Bridge is Volume (e.g. 1 cup). Target is Weight (e.g. 1 oz).
                // 1 cup = 236.58 mL.
                // Bridge Mass = 236.58 * density.
                // Target Mass = 1 oz = 28.35 g.
                // Factor = TargetMass / BridgeMass

                const targetMassG = 1 * def.baseFactor;
                const bridgeMassG = (bridgeParsed.amount * UNITS[bridgeParsed.unit].baseFactor) * density;

                conversionFactor = targetMassG / bridgeMassG;
            }
        }

        if (conversionFactor > 0) {
            options.push({
                label: `1 ${def.label}`, // Always 1 unit options for simplicity? Or keep user "quantity" input separate?
                // The user inputs "Quantity: X" in the UI. 
                // If they select "oz", the multiplier is for "1 oz". Then multiplied by quantity.
                factor: conversionFactor
            });
        }
    }

    return { options, bridgeServingId: bridgeId };
}

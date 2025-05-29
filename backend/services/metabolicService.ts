// backend/services/metabolicService.ts

interface MetabolicInputs {
  date_of_birth: string; // ISO string e.g., "1990-01-15"
  weight_kg: number;
  height_cm: number;
  gender: 'male' | 'female' | string; // Allow other strings, but calculation might be specific
  activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'extra_active' | string;
}

interface MetabolicOutputs {
  age: number | null;
  bmr: number | null;
  tdee: number | null;
}

/**
 * Calculates age from date of birth.
 * @param dateOfBirth ISO string (YYYY-MM-DD)
 * @returns Age in years, or null if dateOfBirth is invalid.
 */
function calculateAge(dateOfBirth: string): number | null {
  try {
    const birthDate = new Date(dateOfBirth);
    if (isNaN(birthDate.getTime())) {
      return null; // Invalid date
    }
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age < 0 ? 0 : age; // Handle potential edge case of future date for DOB
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
}

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.
 * @param weight_kg Weight in kilograms.
 * @param height_cm Height in centimeters.
 * @param age Age in years.
 * @param gender 'male' or 'female'.
 * @returns BMR in calories, or null if inputs are invalid or gender is not 'male' or 'female'.
 */
function calculateBMR(weight_kg: number, height_cm: number, age: number, gender: string): number | null {
  if (weight_kg <= 0 || height_cm <= 0 || age < 0) {
    return null;
  }

  if (gender === 'male') {
    return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
  } else if (gender === 'female') {
    return (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  } else {
    // For 'other' or 'prefer_not_to_say', BMR calculation with Mifflin-St Jeor is not directly applicable.
    // Consider an average or alternative if needed, or return null.
    // For now, returning null if not strictly 'male' or 'female'.
    console.warn(`BMR calculation is not supported for gender: ${gender} with Mifflin-St Jeor. Returning null.`);
    return null;
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * @param bmr Basal Metabolic Rate.
 * @param activity_level User's activity level.
 * @returns TDEE in calories, or null if BMR is null or activity level is unrecognized.
 */
function calculateTDEE(bmr: number | null, activity_level: string): number | null {
  if (bmr === null) {
    return null;
  }

  let multiplier: number;
  switch (activity_level) {
    case 'sedentary':
      multiplier = 1.2;
      break;
    case 'light': // Deno lint prefers 'light' over 'lightly_active' to match provided values
      multiplier = 1.375;
      break;
    case 'moderate':
      multiplier = 1.55;
      break;
    case 'active': // Deno lint prefers 'active' over 'very_active'
      multiplier = 1.725;
      break;
    case 'extra_active':
      multiplier = 1.9;
      break;
    default:
      console.warn(`Unrecognized activity_level for TDEE calculation: ${activity_level}. Returning null.`);
      return null; // Unrecognized activity level
  }
  return bmr * multiplier;
}

/**
 * Calculates age, BMR, and TDEE based on user profile inputs.
 */
export function calculateMetabolicData(inputs: MetabolicInputs): MetabolicOutputs {
  const { date_of_birth, weight_kg, height_cm, gender, activity_level } = inputs;

  const age = calculateAge(date_of_birth);
  let bmr: number | null = null;
  let tdee: number | null = null;

  if (age !== null && weight_kg > 0 && height_cm > 0) {
    bmr = calculateBMR(weight_kg, height_cm, age, gender.toLowerCase()); // Ensure gender is lowercase
    if (bmr !== null) {
      tdee = calculateTDEE(bmr, activity_level);
    }
  }

  return {
    age,
    bmr: bmr !== null ? Math.round(bmr) : null, // Return rounded whole numbers for calories
    tdee: tdee !== null ? Math.round(tdee) : null,
  };
}

// Example Usage (for testing - can be removed or commented out)
/*
const exampleInputs: MetabolicInputs = {
  date_of_birth: "1990-05-15",
  weight_kg: 70,
  height_cm: 175,
  gender: 'male',
  activity_level: 'moderate'
};

const results = calculateMetabolicData(exampleInputs);
console.log("Example Metabolic Calculation Results:", results);
// Expected output for example: Age ~35 (depending on current date), BMR for male, TDEE based on moderate
*/ 
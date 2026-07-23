import exercises from "../data/exercises.json" with { type: "json" };

type Difficulty = "beginner" | "intermediate" | "advanced";
type Format = "straight_sets" | "circuit" | "interval" | "mobility_flow";

interface RoutineSeed {
  name: string;
  summary: string;
  difficulty: Difficulty;
  duration: number;
  goals: string[];
  bodyRegions: string[];
  sports: string[];
  equipment: string[];
  format: Format;
  rounds: number;
  wellness: boolean;
  sourceIds: [string, string, string, string, string, string];
}

const CATALOG_VERSION = "2026.1";
const ATTRIBUTION = "Vitality Vista / Enma Santos";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";
const exerciseBySourceId = new Map(
  exercises.map((exercise) => [exercise.sourceId, exercise]),
);

const routines: RoutineSeed[] = [
  // General and bodyweight (12)
  seed("First Steps Full Body", "A welcoming full-body session built around fundamental movement patterns.", "beginner", 20, ["general fitness", "strength"], ["shoulders", "chest", "abdominals", "glutes", "quadriceps"], [], ["body only"], "straight_sets", 2, false, ["Arm_Circles", "Bodyweight_Squat", "Incline_Push-Up", "Butt_Lift_Bridge", "Dead_Bug", "Childs_Pose"]),
  seed("Low-Impact Full Body", "Steady full-body training without jumping.", "beginner", 25, ["general fitness", "low impact"], ["shoulders", "chest", "abdominals", "glutes", "quadriceps"], [], ["body only"], "circuit", 3, false, ["Arm_Circles", "Bodyweight_Squat", "Incline_Push-Up_Medium", "Butt_Lift_Bridge", "Plank", "Seated_Floor_Hamstring_Stretch"]),
  seed("Ten-Minute Energy", "A short circuit for moving the whole body when time is limited.", "beginner", 10, ["general fitness", "conditioning"], ["shoulders", "chest", "abdominals", "quadriceps"], [], ["body only"], "interval", 2, false, ["Arm_Circles", "Bodyweight_Squat", "Incline_Push-Up", "Front_Leg_Raises", "Dead_Bug", "Dynamic_Chest_Stretch"]),
  seed("Bodyweight Strength I", "A balanced introduction to progressive bodyweight strength.", "intermediate", 25, ["strength"], ["chest", "triceps", "abdominals", "glutes", "quadriceps"], [], ["body only"], "straight_sets", 3, false, ["Arm_Circles", "Bodyweight_Walking_Lunge", "Push-Up_Wide", "Single_Leg_Glute_Bridge", "Plank", "Childs_Pose"]),
  seed("Bodyweight Strength II", "A demanding bodyweight session with more challenging variations.", "advanced", 35, ["strength", "endurance"], ["shoulders", "chest", "triceps", "abdominals", "quadriceps"], [], ["body only"], "straight_sets", 4, false, ["Arm_Circles", "Decline_Push-Up", "Body_Tricep_Press", "Bodyweight_Walking_Lunge", "Side_Bridge", "Hamstring_Stretch"]),
  seed("Full-Body Circuit", "A multi-round strength circuit covering upper body, lower body, and trunk.", "advanced", 35, ["strength", "conditioning"], ["chest", "middle back", "abdominals", "glutes", "quadriceps"], [], ["body only", "other"], "circuit", 5, false, ["Arm_Circles", "Bodyweight_Squat", "Push-Up_Wide", "Bodyweight_Mid_Row", "Single_Leg_Glute_Bridge", "Childs_Pose"]),
  seed("Morning Movement", "A gentle sequence to start the day with comfortable whole-body movement.", "beginner", 15, ["mobility", "general fitness"], ["neck", "shoulders", "lower back", "glutes", "hamstrings"], [], ["body only"], "mobility_flow", 1, false, ["Chin_To_Chest_Stretch", "Arm_Circles", "Cat_Stretch", "One_Knee_To_Chest", "90_90_Hamstring", "Childs_Pose"]),
  seed("No-Jump Conditioning", "Low-impact intervals that raise effort without jumping.", "beginner", 20, ["conditioning", "low impact"], ["shoulders", "abdominals", "glutes", "quadriceps", "hamstrings"], [], ["body only"], "interval", 3, false, ["Arm_Circles", "Bodyweight_Squat", "Front_Leg_Raises", "Rear_Leg_Raises", "Plank", "Standing_Hamstring_and_Calf_Stretch"]),
  seed("Core Foundations", "Foundational trunk work emphasizing controlled positions.", "beginner", 20, ["core stability"], ["abdominals", "lower back", "glutes"], [], ["body only"], "straight_sets", 3, false, ["Cat_Stretch", "Dead_Bug", "Plank", "Butt_Lift_Bridge", "Superman", "Childs_Pose"]),
  seed("Bodyweight Upper Body", "Upper-body bodyweight strength for pushing, pulling, and trunk control.", "intermediate", 25, ["strength"], ["shoulders", "chest", "lats", "middle back", "triceps", "abdominals"], [], ["body only", "other"], "straight_sets", 3, false, ["Arm_Circles", "Push-Up_Wide", "Bodyweight_Mid_Row", "Body_Tricep_Press", "Plank", "Shoulder_Stretch"]),
  seed("Bodyweight Lower Body", "Lower-body strength for the hips, thighs, and calves.", "intermediate", 25, ["strength"], ["glutes", "quadriceps", "hamstrings", "calves", "adductors", "abductors"], [], ["body only"], "straight_sets", 3, false, ["Hip_Circles_prone", "Bodyweight_Squat", "Bodyweight_Walking_Lunge", "Side_Leg_Raises", "Single_Leg_Glute_Bridge", "Standing_Hamstring_and_Calf_Stretch"]),
  seed("Full-Body Endurance", "Higher-volume bodyweight work for sustained muscular effort.", "advanced", 40, ["endurance", "conditioning"], ["shoulders", "chest", "abdominals", "glutes", "quadriceps", "hamstrings"], [], ["body only"], "circuit", 5, false, ["Arm_Circles", "Bodyweight_Walking_Lunge", "Push-Up_Wide", "Front_Leg_Raises", "Plank", "Seated_Floor_Hamstring_Stretch"]),

  // Equipment (10)
  seed("Dumbbell Full Body", "A balanced dumbbell session for major movement patterns.", "intermediate", 35, ["strength"], ["shoulders", "chest", "middle back", "quadriceps", "hamstrings"], [], ["dumbbell"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Squat", "Dumbbell_Bench_Press", "Bent_Over_Two-Dumbbell_Row", "Stiff-Legged_Dumbbell_Deadlift", "Hamstring_Stretch"]),
  seed("Dumbbell Upper Body", "Dumbbell pushing and pulling for the upper body.", "intermediate", 30, ["strength"], ["shoulders", "chest", "middle back", "biceps", "triceps"], [], ["dumbbell"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Bench_Press", "Bent_Over_Two-Dumbbell_Row", "Dumbbell_Shoulder_Press", "Dumbbell_Alternate_Bicep_Curl", "Shoulder_Stretch"]),
  seed("Dumbbell Lower Body", "Dumbbell strength for the hips and legs.", "intermediate", 30, ["strength"], ["glutes", "quadriceps", "hamstrings", "calves"], [], ["dumbbell"], "straight_sets", 3, false, ["Hip_Circles_prone", "Dumbbell_Squat", "Dumbbell_Lunges", "Stiff-Legged_Dumbbell_Deadlift", "Standing_Dumbbell_Calf_Raise", "Hamstring_Stretch"]),
  seed("Dumbbell Push", "Advanced dumbbell pressing volume for chest, shoulders, and triceps.", "advanced", 35, ["strength"], ["shoulders", "chest", "triceps"], [], ["dumbbell"], "straight_sets", 4, false, ["Arm_Circles", "Dumbbell_Bench_Press", "Arnold_Dumbbell_Press", "Decline_Dumbbell_Bench_Press", "Standing_Dumbbell_Triceps_Extension", "Dynamic_Chest_Stretch"]),
  seed("Dumbbell Pull", "Advanced dumbbell pulling volume for the back, biceps, and forearms.", "advanced", 35, ["strength"], ["traps", "lats", "middle back", "biceps", "forearms"], [], ["dumbbell"], "straight_sets", 4, false, ["Arm_Circles", "Bent_Over_Two-Dumbbell_Row", "Dumbbell_Incline_Row", "Reverse_Flyes", "Alternate_Hammer_Curl", "Shoulder_Stretch"]),
  seed("Kettlebell Fundamentals", "Foundational kettlebell strength with controlled, repeatable movements.", "intermediate", 30, ["strength", "conditioning"], ["shoulders", "middle back", "abdominals", "glutes", "hamstrings"], [], ["kettlebells"], "circuit", 3, false, ["Arm_Circles", "One-Arm_Kettlebell_Swings", "Alternating_Kettlebell_Row", "Alternating_Kettlebell_Press", "Lunge_Pass_Through", "Hamstring_Stretch"]),
  seed("Resistance Band Full Body", "Accessible band training for the upper body, hips, and calves.", "beginner", 25, ["strength", "low impact"], ["shoulders", "middle back", "glutes", "calves", "adductors"], [], ["bands"], "circuit", 3, false, ["Arm_Circles", "Band_Pull_Apart", "Hip_Extension_with_Bands", "Band_Hip_Adductions", "Calf_Raises_-_With_Bands", "Shoulder_Stretch"]),
  seed("Barbell Foundations", "A focused barbell session for experienced lifters with sound technique.", "advanced", 40, ["strength"], ["shoulders", "chest", "middle back", "lower back", "quadriceps", "hamstrings"], [], ["barbell"], "straight_sets", 4, false, ["Bodyweight_Squat", "Barbell_Squat", "Barbell_Bench_Press_-_Medium_Grip", "Bent_Over_Barbell_Row", "Romanian_Deadlift", "Childs_Pose"]),
  seed("Cable Machine Full Body", "A challenging cable session spanning upper and lower body.", "advanced", 35, ["strength"], ["shoulders", "chest", "lats", "biceps", "triceps", "quadriceps"], [], ["cable"], "straight_sets", 4, false, ["Arm_Circles", "Cable_Chest_Press", "Wide-Grip_Lat_Pulldown", "Cable_Deadlifts", "Cable_Rope_Overhead_Triceps_Extension", "Shoulder_Stretch"]),
  seed("Stability Ball Strength", "Controlled stability-ball work for trunk and posterior-chain strength.", "beginner", 25, ["strength", "core stability"], ["chest", "abdominals", "lower back", "glutes", "hamstrings"], [], ["exercise ball"], "straight_sets", 3, false, ["Cat_Stretch", "Ball_Leg_Curl", "Exercise_Ball_Crunch", "Physioball_Hip_Bridge", "Chest_Stretch_on_Stability_Ball", "Childs_Pose"]),

  // Body-region focus (10)
  seed("Chest & Triceps", "Pressing strength for the chest and triceps.", "intermediate", 30, ["strength"], ["chest", "triceps", "shoulders"], [], ["body only", "dumbbell"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Bench_Press", "Push-Ups_-_Close_Triceps_Position", "Dumbbell_Flyes", "Dumbbell_One-Arm_Triceps_Extension", "Dynamic_Chest_Stretch"]),
  seed("Back & Biceps", "Pulling strength for the back and biceps.", "intermediate", 30, ["strength"], ["traps", "lats", "middle back", "biceps", "forearms"], [], ["dumbbell", "other"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Incline_Row", "Bodyweight_Mid_Row", "Dumbbell_Bicep_Curl", "Reverse_Flyes", "Childs_Pose"]),
  seed("Shoulder Strength", "Balanced shoulder work across pressing, raising, and rotation.", "intermediate", 25, ["strength"], ["shoulders", "traps", "triceps"], [], ["dumbbell", "bands"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Shoulder_Press", "Side_Lateral_Raise", "Reverse_Flyes", "External_Rotation_with_Band", "Shoulder_Stretch"]),
  seed("Arm Builder", "Direct biceps, triceps, and forearm training.", "intermediate", 30, ["strength"], ["biceps", "triceps", "forearms"], [], ["dumbbell"], "straight_sets", 3, false, ["Arm_Circles", "Dumbbell_Alternate_Bicep_Curl", "Standing_Dumbbell_Triceps_Extension", "Alternate_Hammer_Curl", "Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench", "Triceps_Stretch"]),
  seed("Core Stability", "Controlled trunk work for bracing and position changes.", "intermediate", 25, ["core stability"], ["abdominals", "lower back", "glutes"], [], ["body only"], "straight_sets", 3, false, ["Cat_Stretch", "Dead_Bug", "Side_Bridge", "Plank", "Superman", "Childs_Pose"]),
  seed("Quad Strength", "Knee-dominant strength for the front of the thighs.", "intermediate", 30, ["strength"], ["quadriceps", "glutes", "adductors"], [], ["dumbbell", "body only"], "straight_sets", 3, false, ["All_Fours_Quad_Stretch", "Dumbbell_Squat", "Dumbbell_Lunges", "Dumbbell_Step_Ups", "Side_Leg_Raises", "Kneeling_Hip_Flexor"]),
  seed("Posterior Chain", "Advanced strength for the hamstrings, glutes, and back.", "advanced", 35, ["strength"], ["traps", "lower back", "glutes", "hamstrings"], [], ["barbell", "body only"], "straight_sets", 4, false, ["Cat_Stretch", "Romanian_Deadlift", "Barbell_Deadlift", "Single_Leg_Glute_Bridge", "Superman", "Hamstring_Stretch"]),
  seed("Glute Strength", "Glute-focused strength with hip extension and single-leg work.", "intermediate", 30, ["strength"], ["glutes", "hamstrings", "abductors"], [], ["body only", "bands"], "straight_sets", 3, false, ["Hip_Circles_prone", "Single_Leg_Glute_Bridge", "Glute_Kickback", "Hip_Extension_with_Bands", "Crossover_Reverse_Lunge", "Lying_Glute"]),
  seed("Calf & Ankle Strength", "Lower-leg strength and mobility for the calves and ankles.", "beginner", 20, ["strength", "mobility"], ["calves", "quadriceps", "hamstrings"], [], ["body only", "bands"], "straight_sets", 3, false, ["Seated_Calf_Stretch", "Calf_Raises_-_With_Bands", "Front_Leg_Raises", "Rear_Leg_Raises", "Bodyweight_Squat", "Standing_Gastrocnemius_Calf_Stretch"]),
  seed("Back Strength & Posture Support", "General back and shoulder strength for everyday upright movement.", "beginner", 25, ["strength", "mobility"], ["neck", "shoulders", "traps", "lats", "middle back", "lower back"], [], ["bands", "body only"], "straight_sets", 3, true, ["Chin_To_Chest_Stretch", "Band_Pull_Apart", "External_Rotation_with_Band", "Superman", "Scapular_Pull-Up", "Childs_Pose"]),

  // Sports support (10). These are general fitness support, not coaching or injury prevention.
  seed("Running Support", "General strength and mobility that complements recreational running.", "beginner", 25, ["sports support", "strength"], ["glutes", "quadriceps", "hamstrings", "calves"], ["running"], ["body only"], "circuit", 3, false, ["Hip_Circles_prone", "Bodyweight_Squat", "Bodyweight_Walking_Lunge", "Single_Leg_Glute_Bridge", "Front_Leg_Raises", "Standing_Hamstring_and_Calf_Stretch"]),
  seed("Cycling Support", "General trunk and lower-body fitness that complements recreational cycling.", "intermediate", 30, ["sports support", "strength"], ["abdominals", "glutes", "quadriceps", "hamstrings", "calves"], ["cycling"], ["body only"], "circuit", 3, false, ["Kneeling_Hip_Flexor", "Bodyweight_Squat", "Single_Leg_Glute_Bridge", "Dead_Bug", "Calf_Raises_-_With_Bands", "Hamstring_Stretch"]),
  seed("Soccer Support", "General lower-body strength, trunk control, and movement capacity for recreational soccer.", "intermediate", 30, ["sports support", "conditioning"], ["abdominals", "glutes", "quadriceps", "hamstrings", "adductors", "abductors"], ["soccer"], ["body only"], "circuit", 4, false, ["Hip_Circles_prone", "Bodyweight_Walking_Lunge", "Side_Leg_Raises", "Rear_Leg_Raises", "Plank", "Adductor_Groin"]),
  seed("Basketball Support", "General full-body strength and conditioning for recreational basketball.", "intermediate", 30, ["sports support", "conditioning"], ["shoulders", "abdominals", "glutes", "quadriceps", "calves"], ["basketball"], ["body only"], "interval", 4, false, ["Arm_Circles", "Bodyweight_Squat", "Bodyweight_Walking_Lunge", "Push-Up_Wide", "Plank", "Standing_Gastrocnemius_Calf_Stretch"]),
  seed("Tennis & Pickleball Support", "General rotational, shoulder, and leg fitness for recreational racquet sports.", "intermediate", 30, ["sports support", "strength"], ["shoulders", "forearms", "abdominals", "glutes", "quadriceps", "abductors"], ["tennis", "pickleball"], ["body only", "bands"], "circuit", 3, false, ["Arm_Circles", "Torso_Rotation", "External_Rotation_with_Band", "Crossover_Reverse_Lunge", "Side_Leg_Raises", "Shoulder_Stretch"]),
  seed("Swimming Dryland Support", "General shoulder, back, and trunk strength away from the pool.", "intermediate", 30, ["sports support", "strength"], ["shoulders", "traps", "lats", "middle back", "abdominals"], ["swimming"], ["bands", "body only"], "circuit", 3, false, ["Arm_Circles", "Band_Pull_Apart", "External_Rotation_with_Band", "Plank", "Superman", "Shoulder_Stretch"]),
  seed("Hiking Support", "General leg, hip, calf, and trunk strength for recreational hiking.", "beginner", 30, ["sports support", "endurance"], ["abdominals", "glutes", "quadriceps", "hamstrings", "calves"], ["hiking"], ["body only", "bands"], "circuit", 3, false, ["Hip_Circles_prone", "Bodyweight_Squat", "Bodyweight_Walking_Lunge", "Calf_Raises_-_With_Bands", "Plank", "Standing_Hamstring_and_Calf_Stretch"]),
  seed("Golf Support", "General rotational, hip, and back fitness for recreational golf.", "intermediate", 25, ["sports support", "mobility"], ["shoulders", "middle back", "abdominals", "lower back", "glutes"], ["golf"], ["body only", "bands"], "circuit", 3, false, ["Arm_Circles", "Torso_Rotation", "Band_Pull_Apart", "Single_Leg_Glute_Bridge", "Dead_Bug", "Childs_Pose"]),
  seed("Volleyball Support", "A demanding general strength session for recreational volleyball.", "advanced", 35, ["sports support", "strength"], ["shoulders", "chest", "triceps", "abdominals", "glutes", "quadriceps", "calves"], ["volleyball"], ["body only", "dumbbell"], "circuit", 4, false, ["Arm_Circles", "Dumbbell_Squat", "Dumbbell_Shoulder_Press", "Push-Up_Wide", "Calf_Raise_On_A_Dumbbell", "Shoulder_Stretch"]),
  seed("Martial Arts Support", "A demanding general strength and mobility session for recreational martial arts.", "advanced", 35, ["sports support", "strength", "mobility"], ["shoulders", "abdominals", "glutes", "quadriceps", "hamstrings", "adductors", "abductors"], ["martial arts"], ["body only", "kettlebells"], "circuit", 4, false, ["Hip_Circles_prone", "Lunge_Pass_Through", "Plank", "Side_Leg_Raises", "Alternating_Kettlebell_Press", "Adductor_Groin"]),

  // Mobility and recovery (8)
  seed("Neck & Shoulder Reset", "A gentle neck and shoulder mobility sequence for general education.", "beginner", 12, ["mobility", "recovery"], ["neck", "shoulders", "traps"], [], ["body only"], "mobility_flow", 1, true, ["Chin_To_Chest_Stretch", "Side_Neck_Stretch", "Arm_Circles", "Shoulder_Stretch", "Isometric_Neck_Exercise_-_Sides", "Childs_Pose"]),
  seed("Wrist & Forearm Mobility", "A light wrist and forearm sequence for general movement breaks.", "beginner", 10, ["mobility", "recovery"], ["biceps", "triceps", "forearms"], [], ["body only", "dumbbell"], "mobility_flow", 1, true, ["Arm_Circles", "Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench", "Seated_Dumbbell_Palms-Down_Wrist_Curl", "Alternate_Hammer_Curl", "Triceps_Stretch", "Shoulder_Stretch"]),
  seed("Upper Back Mobility", "A gentle upper-back and shoulder mobility flow.", "beginner", 15, ["mobility", "recovery"], ["neck", "shoulders", "traps", "lats", "middle back"], [], ["body only", "bands"], "mobility_flow", 1, true, ["Chin_To_Chest_Stretch", "Arm_Circles", "Band_Pull_Apart", "Cat_Stretch", "Shoulder_Stretch", "Childs_Pose"]),
  seed("Gentle Lower Back Mobility", "A gentle trunk and hip mobility flow for general education.", "beginner", 15, ["mobility", "recovery"], ["abdominals", "lower back", "glutes", "hamstrings"], [], ["body only"], "mobility_flow", 1, true, ["Cat_Stretch", "One_Knee_To_Chest", "Pelvic_Tilt_Into_Bridge", "Dead_Bug", "90_90_Hamstring", "Childs_Pose"]),
  seed("Hip Mobility", "A controlled mobility flow for the hips and surrounding muscles.", "beginner", 15, ["mobility", "recovery"], ["glutes", "quadriceps", "hamstrings", "adductors", "abductors"], [], ["body only"], "mobility_flow", 1, true, ["Hip_Circles_prone", "Kneeling_Hip_Flexor", "Crossover_Reverse_Lunge", "Adductor_Groin", "One_Knee_To_Chest", "Lying_Glute"]),
  seed("Hamstring & Calf Flexibility", "A gentle sequence for the backs of the legs and calves.", "beginner", 15, ["mobility", "recovery", "flexibility"], ["hamstrings", "calves", "glutes"], [], ["body only"], "mobility_flow", 1, true, ["Front_Leg_Raises", "90_90_Hamstring", "Seated_Floor_Hamstring_Stretch", "Seated_Calf_Stretch", "Standing_Gastrocnemius_Calf_Stretch", "Lying_Glute"]),
  seed("Ankle Mobility", "A gentle lower-leg and ankle movement sequence.", "beginner", 10, ["mobility", "recovery"], ["calves", "quadriceps", "hamstrings"], [], ["body only"], "mobility_flow", 1, true, ["Front_Leg_Raises", "Rear_Leg_Raises", "Seated_Calf_Stretch", "Calf_Stretch_Hands_Against_Wall", "Standing_Gastrocnemius_Calf_Stretch", "Standing_Hamstring_and_Calf_Stretch"]),
  seed("Full-Body Recovery Flow", "A calm full-body mobility sequence for easy movement days.", "beginner", 20, ["mobility", "recovery"], ["neck", "shoulders", "chest", "middle back", "lower back", "glutes", "hamstrings", "calves"], [], ["body only"], "mobility_flow", 1, true, ["Chin_To_Chest_Stretch", "Arm_Circles", "Dynamic_Chest_Stretch", "Cat_Stretch", "90_90_Hamstring", "Childs_Pose"]),
];

function seed(
  name: string,
  summary: string,
  difficulty: Difficulty,
  duration: number,
  goals: string[],
  bodyRegions: string[],
  sports: string[],
  equipment: string[],
  format: Format,
  rounds: number,
  wellness: boolean,
  sourceIds: RoutineSeed["sourceIds"],
): RoutineSeed {
  return { name, summary, difficulty, duration, goals, bodyRegions, sports, equipment, format, rounds, wellness, sourceIds };
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const compiledRoutines = routines.map((routine) => ({
  slug: slugify(routine.name),
  name: routine.name,
  summary: routine.summary,
  difficulty: routine.difficulty,
  estimatedDurationMinutes: routine.duration,
  goals: routine.goals,
  bodyRegions: routine.bodyRegions,
  sports: routine.sports,
  equipment: routine.equipment,
  format: routine.format,
  rounds: routine.rounds,
  wellness: routine.wellness,
  catalogVersion: CATALOG_VERSION,
  attribution: ATTRIBUTION,
  license: "CC BY 4.0",
  exercises: routine.sourceIds.map((sourceId, index) => {
    const phase = index === 0 ? "warmup" : index === 5 ? "cooldown" : "work";
    const timed = routine.format === "interval" || routine.format === "mobility_flow" || phase !== "work";
    return {
      sourceId,
      phase,
      order: index + 1,
      sets: phase === "work" && routine.format === "straight_sets" ? routine.rounds : null,
      reps: phase === "work" && !timed ? (routine.difficulty === "beginner" ? "8-10" : routine.difficulty === "intermediate" ? "10-12" : "12-15") : null,
      durationSeconds: timed ? (routine.format === "mobility_flow" ? 60 : phase === "work" ? 40 : 45) : null,
      restSeconds: phase === "work" ? (routine.difficulty === "advanced" ? 60 : routine.difficulty === "intermediate" ? 45 : 30) : 15,
      sideGuidance: "Use both sides where the movement is unilateral.",
      notes: phase === "warmup" ? "Move comfortably and prepare for the session." : phase === "cooldown" ? "Finish with easy, controlled breathing." : "Use controlled form and choose your own appropriate resistance.",
    };
  }),
}));

const bodyRegions = [
  ["neck", "Neck", "front", "Neck"],
  ["shoulders", "Shoulders", "front", "Shoulders"],
  ["chest", "Chest", "front", "Chest"],
  ["biceps", "Biceps", "front", "Biceps"],
  ["triceps", "Triceps", "back", "Triceps"],
  ["forearms", "Forearms", "front", "Forearms"],
  ["abdominals", "Abdominals", "front", "Abdominals"],
  ["traps", "Traps", "back", "Traps"],
  ["lats", "Lats", "back", "Lats"],
  ["middle back", "Middle Back", "back", "Middle back"],
  ["lower back", "Lower Back", "back", "Lower back"],
  ["glutes", "Glutes", "back", "Glutes"],
  ["quadriceps", "Quadriceps", "front", "Quadriceps"],
  ["hamstrings", "Hamstrings", "back", "Hamstrings"],
  ["calves", "Calves", "back", "Calves"],
  ["adductors", "Adductors", "front", "Inner thighs"],
  ["abductors", "Abductors", "front", "Outer hips"],
].map(([id, label, view, description]) => ({ id, label, view, description }));

const difficultyRank: Record<Difficulty, number> = { beginner: 0, intermediate: 1, advanced: 2 };
const recommendationMap = new Map<string, { difficulties: Difficulty[]; sports: Set<string> }>();
for (const routine of compiledRoutines) {
  for (const item of routine.exercises) {
    const current = recommendationMap.get(item.sourceId) ?? { difficulties: [], sports: new Set<string>() };
    current.difficulties.push(routine.difficulty);
    routine.sports.forEach((sport) => current.sports.add(sport));
    recommendationMap.set(item.sourceId, current);
  }
}

const movementPatternByRegion: Record<string, string> = {
  abdominals: "brace", abductors: "hip movement", adductors: "hip movement", biceps: "pull", calves: "ankle movement", chest: "push", forearms: "grip", glutes: "hip hinge", hamstrings: "hip hinge", lats: "pull", "lower back": "trunk control", "middle back": "pull", neck: "mobility", quadriceps: "squat", shoulders: "upper-body movement", traps: "pull", triceps: "push",
};
const recommendations = [...recommendationMap.entries()].map(([sourceId, usage]) => {
  const exercise = exerciseBySourceId.get(sourceId);
  if (!exercise) throw new Error(`Unknown exercise sourceId: ${sourceId}`);
  const difficulty = usage.difficulties.sort((a, b) => difficultyRank[a] - difficultyRank[b])[0];
  return {
    sourceId,
    recommendation: {
      difficulty,
      impactLevel: exercise.category === "plyometrics" ? "high" : exercise.category === "strength" ? "moderate" : "low",
      movementPatterns: [movementPatternByRegion[exercise.bodyPart] ?? "general movement"],
      sportTags: [...usage.sports].sort(),
      wellnessRegions: bodyRegions.filter((region) => [exercise.bodyPart, ...exercise.secondaryMuscles].includes(region.id)).map((region) => region.id),
      routineEligibility: true,
    },
  };
});

const metadata = {
  catalogVersion: CATALOG_VERSION,
  publishedAt: "2026-07-17",
  routineCount: compiledRoutines.length,
  attribution: ATTRIBUTION,
  license: "CC BY 4.0",
  licenseUrl: LICENSE_URL,
  provenance: "Original Vitality Vista routine programming and body-region mapping authored for this project. Exercise metadata and media are sourced separately from the Anatome / Free Exercise DB CC0 collection.",
  exerciseSource: {
    name: "Anatome / Free Exercise DB",
    repository: "https://github.com/Rippy1911/anatome",
    license: "CC0 1.0 Universal",
  },
  wellnessNotice: "These routines are general education, not medical care. Stop if a movement causes sharp or worsening discomfort. For injuries or persistent symptoms, seek qualified care.",
  sportsNotice: "Sports routines provide general fitness support and are not sport coaching or injury prevention.",
};

await Deno.writeTextFile("data/routines.json", `${JSON.stringify(compiledRoutines, null, 2)}\n`);
await Deno.writeTextFile("data/body-regions.json", `${JSON.stringify(bodyRegions, null, 2)}\n`);
await Deno.writeTextFile("data/exercise-recommendations.json", `${JSON.stringify(recommendations, null, 2)}\n`);
await Deno.writeTextFile("data/routines.metadata.json", `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Generated ${compiledRoutines.length} routines and ${recommendations.length} curated exercise recommendations.`);

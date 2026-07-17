import metadata from "../data/routines.metadata.json" with { type: "json" };

const paginationParameters = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1 } },
];

function listOperation(summary: string, parameters: unknown[] = []) {
  return {
    summary,
    parameters: [...parameters, ...paginationParameters],
    responses: {
      "200": { description: "A paginated catalog response" },
      "429": { description: "Per-instance request limit exceeded" },
    },
  };
}

export const openApiContract = {
  openapi: "3.1.0",
  info: {
    title: "Vitality Vista Exercise and Routine API",
    version: metadata.catalogVersion,
    description: "Public, read-only access to the Vitality Vista exercise catalog, original routines, body regions, and sports-support tags.",
    license: { name: metadata.license, url: metadata.licenseUrl },
  },
  servers: [
    { url: "https://vitality-vista.enmasantos.deno.net/api/v1", description: "Production" },
    { url: "http://localhost:8000/api/v1", description: "Local development" },
  ],
  paths: {
    "/meta": { get: { summary: "Get catalog metadata and provenance", responses: { "200": { description: "Catalog metadata" } } } },
    "/exercises": { get: listOperation("Browse exercises", [
      { name: "search", in: "query", schema: { type: "string" } },
      { name: "category", in: "query", schema: { type: "string" } },
      { name: "equipment", in: "query", schema: { type: "string" } },
      { name: "muscle", in: "query", schema: { type: "string" } },
      { name: "bodyRegion", in: "query", schema: { type: "string" } },
      { name: "sport", in: "query", schema: { type: "string" } },
      { name: "difficulty", in: "query", schema: { type: "string", enum: ["beginner", "intermediate", "advanced"] } },
      { name: "impact", in: "query", schema: { type: "string", enum: ["low", "moderate", "high"] } },
    ]) },
    "/exercises/{id}": { get: { summary: "Get one exercise", parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Exercise" }, "404": { description: "Not found" } } } },
    "/routines": { get: listOperation("Browse original Vitality Vista routines", [
      { name: "search", in: "query", schema: { type: "string" } },
      { name: "goal", in: "query", schema: { type: "string" } },
      { name: "equipment", in: "query", schema: { type: "string" } },
      { name: "difficulty", in: "query", schema: { type: "string", enum: ["beginner", "intermediate", "advanced"] } },
      { name: "format", in: "query", schema: { type: "string", enum: ["straight_sets", "circuit", "interval", "mobility_flow"] } },
      { name: "bodyRegion", in: "query", schema: { type: "string" } },
      { name: "sport", in: "query", schema: { type: "string" } },
      { name: "maxDuration", in: "query", schema: { type: "integer", minimum: 10, maximum: 45 } },
      { name: "wellness", in: "query", schema: { type: "boolean" } },
    ]) },
    "/routines/{slug}": { get: { summary: "Get one fully resolved routine", parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }], responses: { "200": { description: "Routine with resolved exercises" }, "404": { description: "Not found" } } } },
    "/body-regions": { get: { summary: "List body regions and catalog coverage", responses: { "200": { description: "Body regions" } } } },
    "/sports": { get: { summary: "List explicitly curated sports-support tags", responses: { "200": { description: "Sports" } } } },
    "/openapi.json": { get: { summary: "Get this OpenAPI document", responses: { "200": { description: "OpenAPI 3.1 contract" } } } },
  },
  externalDocs: { description: "Interactive documentation", url: "https://vitalityvista.enmasantos.dev/developers/api" },
};

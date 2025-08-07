import { z } from "zod";

/**
 * Standard pagination size parameter
 */
export const pageSizeSchema = z.number().int()
  .min(1).max(1000)
  .default(100)
  .describe("Number of items to return per page");

// =========================
// Dev Portal Tools
// =========================

export const authenticateDevPortalDeveloperParameters = () => z.object({
  portalId: z.string()
    .describe("Portal ID to authenticate with (obtainable from list-portals tool)"),
  username: z.string()
    .optional()
    .describe("Developer username (email) for authentication (optional, defaults to DEV_PORTAL_USER environment variable)"),
  password: z.string()
    .optional()
    .describe("Developer password for authentication (optional, defaults to DEV_PORTAL_PASSWORD environment variable)")
});

export const listApisParameters = () => z.object({
  pageSize: z.number().int()
    .min(1).max(1000)
    .default(10)
    .describe("Number of APIs per page"),
  pageNumber: z.number().int()
    .min(1)
    .optional()
    .describe("Page number to retrieve"),
  filterName: z.string()
    .optional()
    .describe("Filter APIs by name (contains)"),
  filterPublished: z.boolean()
    .optional()
    .describe("Filter by published status"),
  sort: z.string()
    .optional()
    .describe("Sort field and direction (e.g. 'name,-created_at')"),
  portalId: z.string()
    .describe("Portal ID to use for direct portal API access (obtainable from list-portals tool)"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication with the portal API"),
});

export const getApiSpecificationsParameters = () => z.object({
  apiId: z.string()
    .describe("ID or slug of the API to get specifications for"),
  portalId: z.string()
    .optional()
    .describe("Portal ID to use portal-specific endpoint"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication"),
});

export const listPortalsParameters = () => z.object({
  pageSize: z.number().int()
    .min(1).max(1000)
    .default(10)
    .describe("Number of portals per page"),
  pageNumber: z.number().int()
    .min(1)
    .optional()
    .describe("Page number to retrieve"),
});

export const subscribeToApiParameters = () => z.object({
  apiId: z.string()
    .describe("API ID to subscribe to (obtainable from list-apis tool)"),
  applicationId: z.string()
    .describe("Application ID to subscribe with (obtainable from list-applications tool, or use 'new' to create a new application)"),
  appName: z.string()
    .optional()
    .describe("Name for the new application (required if applicationId is 'new')"),
  appDescription: z.string()
    .optional()
    .describe("Description for the new application (optional, used only if applicationId is 'new')"),
  portalId: z.string()
    .optional()
    .describe("Portal ID to use for direct portal API access (obtainable from list-portals tool)"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication with the portal API"),
});

export const generateApiKeyParameters = () => z.object({
  applicationId: z.string()
    .describe("Application ID to generate key for (obtainable from list-applications tool)"),
  name: z.string()
    .optional()
    .default("API Key")
    .describe("Name for the API key"),
  expiresIn: z.number().int()
    .optional()
    .describe("Time in seconds until the key expires (optional)"),
  portalId: z.string()
    .optional()
    .describe("Portal ID to use for direct portal API access (obtainable from list-portals tool)"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication with the portal API"),
});

export const listApplicationsParameters = () => z.object({
  pageSize: z.number().int()
    .min(1).max(1000)
    .default(10)
    .describe("Number of applications per page"),
  pageNumber: z.number().int()
    .min(1)
    .optional()
    .describe("Page number to retrieve"),
  filterName: z.string()
    .optional()
    .describe("Filter applications by name (contains)"),
  sort: z.string()
    .optional()
    .describe("Sort field and direction (e.g. 'name,-created_at')"),
  portalId: z.string()
    .optional()
    .describe("Portal ID to use for direct portal API access (obtainable from list-portals tool)"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication with the portal API"),
});

export const listSubscriptionsParameters = () => z.object({
  applicationId: z.string()
    .optional()
    .describe("Filter by application ID (obtainable from list-applications tool)"),
  apiId: z.string()
    .optional()
    .describe("Filter by API ID (obtainable from list-apis tool)"),
  pageSize: z.number().int()
    .min(1).max(1000)
    .default(10)
    .describe("Number of subscriptions per page"),
  pageNumber: z.number().int()
    .min(1)
    .optional()
    .describe("Page number to retrieve"),
  status: z.string()
    .optional()
    .describe("Filter by subscription status (e.g., 'approved', 'pending')"),
  sort: z.string()
    .optional()
    .describe("Sort field and direction (e.g. 'created_at,-status')"),
  portalId: z.string()
    .optional()
    .describe("Portal ID to use for direct portal API access (obtainable from list-portals tool)"),
  portalAccessToken: z.string()
    .optional()
    .describe("Portal access token for authentication with the portal API"),
});

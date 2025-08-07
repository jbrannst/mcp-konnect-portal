import { KongApi } from "../api.js";

/**
 * Authenticate as a developer to the Dev Portal
 */
export async function authenticateDevPortalDeveloper(
  api: KongApi,
  portalId: string,
  username?: string,
  password?: string
) {
  try {
    const result = await api.authenticateDevPortalDeveloper(
      portalId,
      username,
      password
    );

    // The authenticate endpoint returns a 204 No Content response with Set-Cookie headers
    // The cookies are handled by the KongApi class, so we just need to return a success message
    return {
      authentication: {
        status: "success",
        message: "Successfully authenticated with the developer portal"
      },
      usage: {
        instructions: "You are now authenticated with the developer portal. You can use other Dev Portal tools without providing a portalAccessToken.",
        security: "Your authentication is stored in cookies managed by the API client."
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List all available portals in Kong Konnect
 */
export async function listPortals(
  api: KongApi,
  pageSize = 10,
  pageNumber?: number
) {
  try {
    const result = await api.listDevPortalPortals(
      pageSize,
      pageNumber
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        pageSize,
        pageNumber: pageNumber || 1,
        totalPages: result.meta?.page_count || 0,
        totalCount: result.meta?.total_count || 0
      },
      portals: result.data.map((portal: any) => ({
        portalId: portal.id,
        name: portal.name,
        description: portal.description,
        active: portal.active,
        metadata: {
          createdAt: portal.created_at,
          updatedAt: portal.updated_at
        }
      })),
      relatedTools: [
        "Use authenticate-developer-portal to get access also to private APIs",
        "Use list-apis to find APIs published to these portals",
        "Use list-applications to see applications that can subscribe to APIs"
      ]
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List all available APIs in the Dev Portal
 */
export async function listApis(
  api: KongApi,
  pageSize = 10,
  pageNumber?: number,
  filterName?: string,
  filterPublished?: boolean,
  sort?: string,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    const result = await api.listDevPortalApis(
      pageSize,
      pageNumber,
      filterName,
      filterPublished,
      sort,
      portalId,
      portalAccessToken
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        pageSize,
        pageNumber: pageNumber || 1,
        totalPages: result.meta?.page_count || 0,
        totalCount: result.meta?.total_count || 0,
        filters: {
          name: filterName || null,
          published: filterPublished !== undefined ? filterPublished : null
        },
        sort: sort || null
      },
      apis: result.data.map((api: any) => ({
        apiId: api.id,
        name: api.name,
        description: api.description,
        version: api.version,
        published: api.published,
        deprecated: api.deprecated,
        documentation: {
          specification: api.specification,
          specificationFormat: api.specification_format
        },
        metadata: {
          createdAt: api.created_at,
          updatedAt: api.updated_at
        }
      })),
      relatedTools: [
        "Use authenticate-developer-portal to get access also to private APIs",
        "Use subscribe-to-api to subscribe to an API",
        "Use generate-api-key to generate an API key for a subscription"
      ]
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Get all specifications for an API in the Dev Portal
 */
export async function getApiSpecifications(
  api: KongApi,
  apiId: string,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    const result = await api.getDevPortalApiSpecifications(
      apiId,
      portalId,
      portalAccessToken
    );

    // Transform the response to have consistent field names
    return {
      specifications: result.data.map((spec: any) => ({
        id: spec.id,
        type: spec.api_type,
        content: spec.content
      })),
      relatedTools: [
        "Use list-apis to find more APIs",
        "Use subscribe-to-api to subscribe to this API"
      ]
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Subscribe to an API in the Dev Portal
 */
export async function subscribeToApi(
  api: KongApi,
  apiId: string,
  applicationId: string,
  appName?: string,
  appDescription?: string,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    // If applicationId is "new", create a new application first
    let finalApplicationId = applicationId;
    
    if (applicationId === "new" && appName) {
      const newApp = await api.createDevPortalApplication(
        appName,
        appDescription || "",
        portalId,
        portalAccessToken
      );
      finalApplicationId = newApp.id;
    }

    const result = await api.createDevPortalSubscription(
      apiId,
      finalApplicationId,
      portalId,
      portalAccessToken
    );

    return {
      subscription: {
        subscriptionId: result.id,
        apiId: result.api_id,
        apiName: result.api_name,
        applicationId: result.application_id,
        applicationName: result.application_name,
        status: result.status,
        metadata: {
          createdAt: result.created_at,
          updatedAt: result.updated_at
        }
      },
      relatedTools: [
        "Use generate-api-key to generate an API key for this subscription",
        "Use list-apis to find more APIs to subscribe to"
      ]
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Generate an API key for an application
 */
export async function generateApiKey(
  api: KongApi,
  applicationId: string,
  name?: string,
  expiresIn?: number,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    const result = await api.createDevPortalApiKey(
      applicationId,
      name || "API Key",
      expiresIn,
      portalId,
      portalAccessToken
    );

    // Format the response based on the structure returned by the API
    return {
      apiKey: {
        id: result.id,
        key: result.credential, // The actual API key value
        name: result.display_name,
        applicationId: applicationId,
        expiresAt: result.expires_at,
        metadata: {
          createdAt: result.created_at,
          updatedAt: result.updated_at
        }
      },
      usage: {
        instructions: "Use this API key in your requests to the API with the header: 'apikey: YOUR_API_KEY'",
        security: "Store this API key securely. For security reasons, you won't be able to retrieve the full key value again."
      }
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List applications in the Dev Portal
 */
export async function listApplications(
  api: KongApi,
  pageSize = 10,
  pageNumber?: number,
  filterName?: string,
  sort?: string,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    const result = await api.listDevPortalApplications(
      pageSize,
      pageNumber,
      filterName,
      sort,
      portalId,
      portalAccessToken
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        pageSize,
        pageNumber: pageNumber || 1,
        totalPages: result.meta?.page_count || 0,
        totalCount: result.meta?.total_count || 0,
        filters: {
          name: filterName || null
        },
        sort: sort || null
      },
      applications: result.data.map((app: any) => ({
        applicationId: app.id,
        name: app.name,
        description: app.description,
        status: app.status,
        metadata: {
          createdAt: app.created_at,
          updatedAt: app.updated_at
        }
      })),
      relatedTools: [
        "Use subscribe-to-api to subscribe an application to an API",
        "Use list-apis to find APIs to subscribe to"
      ]
    };
  } catch (error) {
    throw error;
  }
}

/**
 * List subscriptions in the Dev Portal
 */
export async function listSubscriptions(
  api: KongApi,
  applicationId?: string,
  apiId?: string,
  pageSize = 10,
  pageNumber?: number,
  status?: string,
  sort?: string,
  portalId?: string,
  portalAccessToken?: string
) {
  try {
    const result = await api.listDevPortalSubscriptions(
      applicationId,
      apiId,
      pageSize,
      pageNumber,
      status,
      sort,
      portalId,
      portalAccessToken
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        pageSize,
        pageNumber: pageNumber || 1,
        totalPages: result.meta?.page_count || 0,
        totalCount: result.meta?.total_count || 0,
        filters: {
          applicationId: applicationId || null,
          apiId: apiId || null,
          status: status || null
        },
        sort: sort || null
      },
      subscriptions: result.data.map((sub: any) => ({
        subscriptionId: sub.id,
        apiId: sub.api.id,
        apiName: sub.api.name,
        applicationId: sub.application.id,
        applicationName: sub.application.name,
        status: sub.status,
        metadata: {
          createdAt: sub.created_at,
          updatedAt: sub.updated_at
        }
      })),
      relatedTools: [
        "Use generate-api-key to generate an API key for a subscription",
        "Use subscribe-to-api to create a new subscription"
      ]
    };
  } catch (error) {
    throw error;
  }
}

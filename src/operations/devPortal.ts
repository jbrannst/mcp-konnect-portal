import { KongApi } from "../api.js";

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
  controlPlaneId: string,
  pageSize = 10,
  pageNumber?: number,
  filterName?: string,
  filterPublished?: boolean,
  sort?: string
) {
  try {
    const result = await api.listDevPortalApis(
      controlPlaneId,
      pageSize,
      pageNumber,
      filterName,
      filterPublished,
      sort
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        controlPlaneId,
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
        "Use subscribe-to-api to subscribe to an API",
        "Use generate-api-key to generate an API key for a subscription"
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
  controlPlaneId: string,
  apiId: string,
  applicationId: string,
  appName?: string,
  appDescription?: string
) {
  try {
    // If applicationId is "new", create a new application first
    let finalApplicationId = applicationId;
    
    if (applicationId === "new" && appName) {
      const newApp = await api.createDevPortalApplication(
        controlPlaneId,
        appName,
        appDescription || ""
      );
      finalApplicationId = newApp.data.id;
    }

    const result = await api.createDevPortalSubscription(
      controlPlaneId,
      apiId,
      finalApplicationId
    );

    return {
      subscription: {
        subscriptionId: result.data.id,
        apiId: result.data.api.id,
        apiName: result.data.api.name,
        applicationId: result.data.application.id,
        applicationName: result.data.application.name,
        status: result.data.status,
        metadata: {
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at
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
 * Generate an API key for a subscription
 */
export async function generateApiKey(
  api: KongApi,
  controlPlaneId: string,
  subscriptionId: string,
  name?: string,
  expiresIn?: number
) {
  try {
    const result = await api.createDevPortalApiKey(
      controlPlaneId,
      subscriptionId,
      name || "API Key",
      expiresIn
    );

    return {
      apiKey: {
        id: result.data.id,
        key: result.data.key, // The actual API key value
        name: result.data.name,
        subscriptionId: result.data.subscription.id,
        apiId: result.data.subscription.api.id,
        apiName: result.data.subscription.api.name,
        applicationId: result.data.subscription.application.id,
        applicationName: result.data.subscription.application.name,
        expiresAt: result.data.expires_at,
        metadata: {
          createdAt: result.data.created_at,
          updatedAt: result.data.updated_at
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
  controlPlaneId: string,
  pageSize = 10,
  pageNumber?: number,
  filterName?: string,
  sort?: string
) {
  try {
    const result = await api.listDevPortalApplications(
      controlPlaneId,
      pageSize,
      pageNumber,
      filterName,
      sort
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        controlPlaneId,
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
  controlPlaneId: string,
  applicationId?: string,
  apiId?: string,
  pageSize = 10,
  pageNumber?: number,
  status?: string,
  sort?: string
) {
  try {
    const result = await api.listDevPortalSubscriptions(
      controlPlaneId,
      applicationId,
      apiId,
      pageSize,
      pageNumber,
      status,
      sort
    );

    // Transform the response to have consistent field names
    return {
      metadata: {
        controlPlaneId,
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

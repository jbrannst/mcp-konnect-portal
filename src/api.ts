import axios, { AxiosRequestConfig } from "axios";
import { 
  ApiRequestFilter, 
  TimeRange, 
  ApiRequestsResponse 
} from "./types.js";

/**
 * Kong API Regions - Different geographical API endpoints 
 */
export const API_REGIONS = {
  US: "us",
  EU: "eu",
  AU: "au",
  ME: "me",
  IN: "in",
};

export interface KongApiOptions {
  apiKey?: string;
  apiRegion?: string;
}

export class KongApi {
  private adminBaseUrl: string;
  private apiKey: string;
  private portalBaseUrls: Map<string, string> = new Map();
  private portalAuthCookies: Map<string, string> = new Map();

  constructor(options: KongApiOptions = {}) {
    // Default to US region if not specified
    const apiRegion = options.apiRegion || process.env.KONNECT_REGION || API_REGIONS.US;
    this.adminBaseUrl = `https://${apiRegion}.api.konghq.com/v2`;
    this.apiKey = options.apiKey || process.env.KONNECT_ACCESS_TOKEN || "";

    if (!this.apiKey) {
      console.error("Warning: KONNECT_ACCESS_TOKEN not set in environment. API calls will fail.");
    }
  }

  /**
   * Get the base URL for a specific portal
   * @param portalId The ID of the portal
   * @returns The base URL for the portal
   */
  async getPortalBaseUrl(portalId: string): Promise<string> {
    // Check if we already have the base URL for this portal
    if (this.portalBaseUrls.has(portalId)) {
      return this.portalBaseUrls.get(portalId)!;
    }

    // For the specific portal ID we're working with, use the hardcoded URL
    if (portalId === "9848ffe2-c4d1-4841-9e0d-663d151ce736") {
      const baseUrl = "https://affdbf0ae586.edge.eu.portal.konghq.com";
      this.portalBaseUrls.set(portalId, baseUrl);
      return baseUrl;
    }

    // Otherwise, fetch the portal details to get the canonical domain
    try {
      const portals = await this.listDevPortalPortals();
      const portal = portals.data.find((p: any) => p.id === portalId);
      
      if (!portal) {
        throw new Error(`Portal with ID ${portalId} not found`);
      }

      const baseUrl = `https://${portal.canonical_domain}`;
      this.portalBaseUrls.set(portalId, baseUrl);
      return baseUrl;
    } catch (error) {
      console.error(`Error getting portal base URL for portal ${portalId}:`, error);
      throw error;
    }
  }

  /**
   * Makes authenticated requests to Kong APIs with consistent error handling
   */
  async kongRequest<T>(
    endpoint: string, 
    method = "GET", 
    data: any = null, 
    usePortalBaseUrl = false,
    portalId?: string,
    cookies?: string
  ): Promise<T> {
    try {
      let url: string;
      let headers: Record<string, string> = {
        "Content-Type": "application/json",
        "Accept": "application/json"
      };

      if (usePortalBaseUrl && portalId) {
        // Use the portal base URL for developer portal endpoints
        const portalBaseUrl = await this.getPortalBaseUrl(portalId);
        url = `${portalBaseUrl}${endpoint}`;
        
        // For portal requests, use cookies for authentication if provided
        if (cookies) {
          headers["Cookie"] = cookies;
        } 
        // Or use stored cookies if available
        else if (this.portalAuthCookies.has(portalId)) {
          headers["Cookie"] = this.portalAuthCookies.get(portalId)!;
          console.error(`Using stored authentication cookie for portal ${portalId}`);
        }
      } else {
        // Use the admin base URL for Konnect Admin API endpoints
        let baseUrl = this.adminBaseUrl;
        
        // If the endpoint starts with /v3, use a base URL without version
        if (endpoint.startsWith("/v3")) {
          baseUrl = baseUrl.replace("/v2", "");
        }
        
        url = `${baseUrl}${endpoint}`;
        
        // For admin API requests, use bearer token authentication
        headers["Authorization"] = `Bearer ${this.apiKey}`;
      }
      
      console.error(`Making request to: ${url}`);

      const config: AxiosRequestConfig = {
        method,
        url,
        headers,
        data: data ? data : undefined,
      };

      console.error(`Sending request...`);
      const response = await axios(config);
      console.error(`Received response with status: ${response.status}`);
      
      // Handle 204 No Content responses (like from authenticate endpoint)
      if (response.status === 204) {
        console.error(`Received 204 No Content response`);
        return { success: true } as unknown as T;
      }
      
      console.error(`Response data: ${JSON.stringify(response.data, null, 2).substring(0, 500)}...`);
      return response.data;
    } catch (error: any) {
      console.error("API request error:", error.message);

      if (error.response) {
        const errorData = error.response.data;
        let errorMessage = `API Error (Status ${error.response.status})`;

        if (typeof errorData === 'object') {
          const errorDetails = errorData.message || JSON.stringify(errorData);
          errorMessage += `: ${errorDetails}`;
        } else if (typeof errorData === 'string') {
          errorMessage += `: ${errorData.substring(0, 200)}`;
        }

        throw new Error(errorMessage);
      } else if (error.request) {
        throw new Error("Network Error: No response received from Kong API. Please check your network connection and API endpoint configuration.");
      } else {
        throw new Error(`Request Error: ${error.message}. Please check your request parameters and try again.`);
      }
    }
  }

  // Analytics API methods
  async queryApiRequests(timeRange: string, filters: ApiRequestFilter[] = [], maxResults = 100): Promise<ApiRequestsResponse> {
    const requestBody = {
      time_range: {
        type: "relative",
        time_range: timeRange
      } as TimeRange,
      filters: filters,
      size: maxResults
    };

    return this.kongRequest<ApiRequestsResponse>("/api-requests", "POST", requestBody);
  }

  // Control Planes API methods
  async listControlPlanes(pageSize = 10, pageNumber?: number, filterName?: string, filterClusterType?: string, 
    filterCloudGateway?: boolean, labels?: string, sort?: string): Promise<any> {
    
    let endpoint = `/control-planes?page[size]=${pageSize}`;

    if (pageNumber) {
      endpoint += `&page[number]=${pageNumber}`;
    }

    if (filterName) {
      endpoint += `&filter[name][contains]=${encodeURIComponent(filterName)}`;
    }
    
    if (filterClusterType) {
      endpoint += `&filter[cluster_type][eq]=${encodeURIComponent(filterClusterType)}`;
    }
    
    if (filterCloudGateway !== undefined) {
      endpoint += `&filter[cloud_gateway]=${filterCloudGateway}`;
    }

    if (labels) {
      endpoint += `&labels=${encodeURIComponent(labels)}`;
    }

    if (sort) {
      endpoint += `&sort=${encodeURIComponent(sort)}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async getControlPlane(controlPlaneId: string): Promise<any> {
    return this.kongRequest<any>(`/control-planes/${controlPlaneId}`);
  }

  async listControlPlaneGroupMemberships(groupId: string, pageSize = 10, pageAfter?: string): Promise<any> {
    let endpoint = `/control-planes/${groupId}/group-memberships?page[size]=${pageSize}`;

    if (pageAfter) {
      endpoint += `&page[after]=${pageAfter}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async checkControlPlaneGroupMembership(controlPlaneId: string): Promise<any> {
    return this.kongRequest<any>(`/control-planes/${controlPlaneId}/group-member-status`);
  }

  // Configuration API methods
  async listServices(controlPlaneId: string, size = 100, offset?: string): Promise<any> {
    let endpoint = `/control-planes/${controlPlaneId}/core-entities/services?size=${size}`;
    
    if (offset) {
      endpoint += `&offset=${offset}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async listRoutes(controlPlaneId: string, size = 100, offset?: string): Promise<any> {
    let endpoint = `/control-planes/${controlPlaneId}/core-entities/routes?size=${size}`;
    
    if (offset) {
      endpoint += `&offset=${offset}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async listConsumers(controlPlaneId: string, size = 100, offset?: string): Promise<any> {
    let endpoint = `/control-planes/${controlPlaneId}/core-entities/consumers?size=${size}`;
    
    if (offset) {
      endpoint += `&offset=${offset}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async listPlugins(controlPlaneId: string, size = 100, offset?: string): Promise<any> {
    let endpoint = `/control-planes/${controlPlaneId}/core-entities/plugins?size=${size}`;
    
    if (offset) {
      endpoint += `&offset=${offset}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  /**
   * Authenticate as a developer to the Dev Portal
   * @param portalId The ID of the portal to authenticate with
   * @param username The developer's email (defaults to DEV_PORTAL_USER environment variable)
   * @param password The developer's password (defaults to DEV_PORTAL_PASSWORD environment variable)
   * @returns Authentication response including access token
   */
  async authenticateDevPortalDeveloper(
    portalId: string,
    username?: string,
    password?: string
  ): Promise<any> {
    // Using portal API endpoint for developer authentication
    const endpoint = `/api/v3/developer/authenticate`;
    
    // Use provided credentials or fall back to environment variables
    const developerUsername = username || process.env.DEV_PORTAL_USER;
    const developerPassword = password || process.env.DEV_PORTAL_PASSWORD;
    
    if (!developerUsername || !developerPassword) {
      throw new Error("Developer credentials not provided and not found in environment variables (DEV_PORTAL_USER, DEV_PORTAL_PASSWORD)");
    }
    
    const data = {
      username: developerUsername,
      password: developerPassword
    };

    try {
      // Make a direct axios request to get the cookies
      const portalBaseUrl = await this.getPortalBaseUrl(portalId);
      const url = `${portalBaseUrl}${endpoint}`;
      
      console.error(`Making direct authentication request to: ${url}`);
      
      const response = await axios({
        method: "POST",
        url,
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        data,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });
      
      console.error(`Authentication response status: ${response.status}`);
      
      // Extract the cookies from the response
      const cookies = response.headers['set-cookie'];
      if (cookies && cookies.length > 0) {
        // Find the portalaccesstoken cookie
        for (const cookie of cookies) {
          if (cookie.includes('portalaccesstoken')) {
            const tokenMatch = cookie.match(/portalaccesstoken=([^;]+)/);
            if (tokenMatch && tokenMatch[1]) {
              const token = tokenMatch[1];
              console.error(`Found portalaccesstoken: ${token.substring(0, 10)}...`);
              this.portalAuthCookies.set(portalId, `portalaccesstoken=${token}`);
              break;
            }
          }
        }
      }
      
      // Return a success response
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
    } catch (error: any) {
      console.error("Authentication error:", error.message);
      throw error;
    }
  }

  // Dev Portal API methods
  async listDevPortalApis(
    pageSize = 10, 
    pageNumber?: number, 
    filterName?: string, 
    filterPublished?: boolean, 
    sort?: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    let endpoint = `/api/v3/apis?page[size]=${pageSize}`;

    if (pageNumber) {
      endpoint += `&page[number]=${pageNumber}`;
    }

    if (filterName) {
      endpoint += `&filter[name][contains]=${encodeURIComponent(filterName)}`;
    }

    if (filterPublished !== undefined) {
      endpoint += `&filter[published]=${filterPublished}`;
    }

    if (sort) {
      endpoint += `&sort=${encodeURIComponent(sort)}`;
    }

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "GET", 
        null, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      return this.kongRequest<any>(`/v3/apis?page[size]=${pageSize}`);
    }
  }

  async createDevPortalApplication(
    name: string,
    description: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications`;
    const data = {
      name,
      description
    };

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "POST", 
        data, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      return this.kongRequest<any>(`/v3/applications`, "POST", data);
    }
  }

  async listDevPortalPortals(
    pageSize = 10,
    pageNumber?: number
  ): Promise<any> {
    // This method always uses the admin API since we need to list all portals
    let endpoint = `/v3/portals?page[size]=${pageSize}`;

    if (pageNumber) {
      endpoint += `&page[number]=${pageNumber}`;
    }

    return this.kongRequest<any>(endpoint);
  }

  async listDevPortalApplications(
    pageSize = 10,
    pageNumber?: number,
    filterName?: string,
    sort?: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    let endpoint = `/api/v3/applications?page[size]=${pageSize}`;

    if (pageNumber) {
      endpoint += `&page[number]=${pageNumber}`;
    }

    if (filterName) {
      endpoint += `&filter[name][contains]=${encodeURIComponent(filterName)}`;
    }

    if (sort) {
      endpoint += `&sort=${encodeURIComponent(sort)}`;
    }

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "GET", 
        null, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      return this.kongRequest<any>(`/v3/applications?page[size]=${pageSize}`);
    }
  }

  async createDevPortalSubscription(
    apiId: string,
    applicationId: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications/${applicationId}/registrations`;
    const data = {
      api_id: apiId
    };

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "POST", 
        data, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      return this.kongRequest<any>(`/v3/subscriptions`, "POST", {
        api: { id: apiId },
        application: { id: applicationId }
      });
    }
  }

  async listDevPortalSubscriptions(
    applicationId?: string,
    apiId?: string,
    pageSize = 10,
    pageNumber?: number,
    status?: string,
    sort?: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    let endpoint: string;
    
    if (applicationId) {
      // If applicationId is provided, use the application registrations endpoint
      endpoint = `/api/v3/applications/${applicationId}/registrations?page[size]=${pageSize}`;
    } else {
      // Otherwise, use a generic endpoint
      endpoint = `/api/v3/registrations?page[size]=${pageSize}`;
    }

    if (pageNumber) {
      endpoint += `&page[number]=${pageNumber}`;
    }

    if (apiId) {
      endpoint += `&filter[api.id][eq]=${apiId}`;
    }

    if (status) {
      endpoint += `&filter[status][eq]=${status}`;
    }

    if (sort) {
      endpoint += `&sort=${encodeURIComponent(sort)}`;
    }

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "GET", 
        null, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      let adminEndpoint = `/v3/subscriptions?page[size]=${pageSize}`;
      
      if (pageNumber) {
        adminEndpoint += `&page[number]=${pageNumber}`;
      }
      
      if (applicationId) {
        adminEndpoint += `&filter[application.id][eq]=${applicationId}`;
      }
      
      if (apiId) {
        adminEndpoint += `&filter[api.id][eq]=${apiId}`;
      }
      
      if (status) {
        adminEndpoint += `&filter[status][eq]=${status}`;
      }
      
      if (sort) {
        adminEndpoint += `&sort=${encodeURIComponent(sort)}`;
      }
      
      return this.kongRequest<any>(adminEndpoint);
    }
  }

  async createDevPortalApiKey(
    applicationId: string,
    name: string,
    expiresIn?: number,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications/${applicationId}/credentials`;
    const data: any = {
      display_name: name
    };

    if (expiresIn) {
      data.expires_in = expiresIn;
    }

    // If portalId is provided, use the portal base URL
    if (portalId) {
      return this.kongRequest<any>(
        endpoint, 
        "POST", 
        data, 
        true, 
        portalId, 
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
    } else {
      // Fall back to admin API for backward compatibility
      const adminData: any = {
        name,
        application: {
          id: applicationId
        }
      };
      
      if (expiresIn) {
        adminData.expires_in = expiresIn;
      }
      
      return this.kongRequest<any>(`/v3/api-keys`, "POST", adminData);
    }
  }
}

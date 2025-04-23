import axios, { AxiosRequestConfig } from "axios";

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
        
        // Make sure endpoint starts with /api/ for portal requests
        if (!endpoint.startsWith("/api/") && endpoint.startsWith("/v3")) {
          endpoint = `/api${endpoint}`;
        }
        
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
    // Portal ID is required for listing APIs
    if (!portalId) {
      throw new Error("Portal ID is required for listing APIs. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

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

    return this.kongRequest<any>(
      endpoint, 
      "GET", 
      null, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );
  }

  async createDevPortalApplication(
    name: string,
    description: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Portal ID is required for creating applications
    if (!portalId) {
      throw new Error("Portal ID is required for creating applications. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications`;
    const data = {
      name,
      description
    };

    return this.kongRequest<any>(
      endpoint, 
      "POST", 
      data, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );
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

    // Portal ID is required for listing applications
    if (!portalId) {
      throw new Error("Portal ID is required for listing applications. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

    // Use the portal base URL
    return this.kongRequest<any>(
      endpoint, 
      "GET", 
      null, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );
  }

  async createDevPortalSubscription(
    apiId: string,
    applicationId: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Portal ID is required for creating subscriptions
    if (!portalId) {
      throw new Error("Portal ID is required for creating subscriptions. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications/${applicationId}/registrations`;
    const data = {
      api_id: apiId
    };

    const response = await this.kongRequest<any>(
      endpoint, 
      "POST", 
      data, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );

    // Return the response in a consistent format
    return {
      subscription: {
        subscriptionId: response.id,
        apiId: response.api_id,
        apiName: response.api_name,
        applicationId: response.application_id,
        status: response.status,
        metadata: {
          created_at: response.created_at,
          updated_at: response.updated_at
        }
      }
    };
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
    // Portal ID is required for listing subscriptions
    if (!portalId) {
      throw new Error("Portal ID is required for listing subscriptions. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

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
      endpoint += `&filter[api_id][eq]=${apiId}`;  // Updated to use flat api_id field
    }

    if (status) {
      endpoint += `&filter[status][eq]=${status}`;
    }

    if (sort) {
      endpoint += `&sort=${encodeURIComponent(sort)}`;
    }

    const response = await this.kongRequest<any>(
      endpoint, 
      "GET", 
      null, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );

    // Transform the response to match the expected format
    return {
      meta: response.meta,
      data: response.data.map((item: any) => ({
        subscription: {
          subscriptionId: item.id,
          apiId: item.api_id,
          apiName: item.api_name,
          applicationId: item.application_id,
          status: item.status,
          metadata: {
            created_at: item.created_at,
            updated_at: item.updated_at
          }
        }
      }))
    };
  }

  /**
   * Get all specifications for an API
   * @param apiId The ID or slug of the API
   * @param portalId Portal ID to use portal-specific endpoint
   * @param portalAccessToken Optional portal access token
   * @returns List of API specifications
   */
  async getDevPortalApiSpecifications(
    apiId: string,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Portal ID is required for getting API specifications
    if (!portalId) {
      throw new Error("Portal ID is required for getting API specifications. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

    // First get the list of specifications
    const endpoint = `/api/v3/apis/${apiId}/specifications`;
    const specList = await this.kongRequest<any>(
      endpoint,
      "GET",
      null,
      true,
      portalId,
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );

    console.error(`Specification list response: ${JSON.stringify(specList)}`);
    
    // Check if we have specifications data
    if (!specList || !specList.data || !Array.isArray(specList.data)) {
      console.error("No specifications found or invalid response format");
      return {
        data: [],
        meta: specList?.meta || { page: { size: 0, total: 0, number: 1 } }
      };
    }

    // Then fetch the content for each specification
    const specifications = [];
    for (const spec of specList.data) {
      const specEndpoint = `/api/v3/apis/${apiId}/specifications/${spec.id}`;
      const specContent = await this.kongRequest<any>(
        specEndpoint,
        "GET",
        null,
        true,
        portalId,
        portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
      );
      
      specifications.push({
        id: spec.id,
        type: spec.type,
        content: specContent.content
      });
    }

    return {
      data: specifications,
      meta: specList.meta
    };
  }

  async createDevPortalApiKey(
    applicationId: string,
    name: string,
    expiresIn?: number,
    portalId?: string,
    portalAccessToken?: string
  ): Promise<any> {
    // Portal ID is required for generating API keys
    if (!portalId) {
      throw new Error("Portal ID is required for generating API keys. Use the list-portals tool to get a portal ID, then authenticate with that portal using authenticate-developer-portal.");
    }

    // Using portal API endpoint for Dev Portal
    const endpoint = `/api/v3/applications/${applicationId}/credentials`;
    const data: any = {
      display_name: name
    };

    if (expiresIn) {
      data.expires_in = expiresIn;
    }

    return this.kongRequest<any>(
      endpoint, 
      "POST", 
      data, 
      true, 
      portalId, 
      portalAccessToken ? `portalaccesstoken=${portalAccessToken}` : undefined
    );
  }
}

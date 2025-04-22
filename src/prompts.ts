// Dev Portal Prompts
export const authenticateDevPortalDeveloperPrompt = () => `
Authenticate as a developer to the Kong Konnect Dev Portal.

INPUT:
  - portalId: String - ID of the portal to authenticate with
  - username: String (optional) - Developer username (email) for authentication (defaults to DEV_PORTAL_USER environment variable)
  - password: String (optional) - Developer password for authentication (defaults to DEV_PORTAL_PASSWORD environment variable)

OUTPUT:
  - authentication: Object - Authentication details including:
    - accessToken: String - The access token to use for subsequent requests
    - tokenType: String - Type of token (usually "bearer")
    - expiresIn: Number - Time in seconds until the token expires
    - developer: Object - Information about the authenticated developer
  - usage: Object - Information about how to use the access token
`;

export const listApisPrompt = () => `
List all available APIs in the Kong Konnect Dev Portal.

INPUT:
  - pageSize: Number - Number of APIs per page (1-1000, default: 10)
  - pageNumber: Number (optional) - Page number to retrieve
  - filterName: String (optional) - Filter APIs by name
  - filterPublished: Boolean (optional) - Filter by published status
  - sort: String (optional) - Sort field and direction (e.g. 'name,-created_at')

OUTPUT:
  - metadata: Object - Contains pageSize, pageNumber, totalPages, totalCount, filters, sort
  - apis: Array - List of APIs with details for each including:
    - apiId: String - Unique identifier for the API
    - name: String - Display name of the API
    - description: String - Description of the API
    - version: String - Version of the API
    - published: Boolean - Whether the API is published in the Dev Portal
    - deprecated: Boolean - Whether the API is marked as deprecated
    - documentation: Object - API documentation details including:
      - specification: String - API specification (e.g., OpenAPI/Swagger)
      - specificationFormat: String - Format of the specification (e.g., 'openapi', 'swagger')
    - metadata: Object - Creation and update timestamps
  - relatedTools: Array - List of related tools for API management
`;

export const getApiSpecificationsPrompt = () => `
Get all specifications for an API in the Kong Konnect Dev Portal.

INPUT:
  - apiId: String - ID or slug of the API to get specifications for
  - portalId: String (optional) - Portal ID to use portal-specific endpoint
  - portalAccessToken: String (optional) - Portal access token for authentication

OUTPUT:
  - specifications: Array - List of specifications with details for each including:
    - id: String - Unique identifier for the specification
    - type: String - Type of specification (e.g., 'oas3', 'asyncapi')
    - content: String - The actual specification content
  - relatedTools: Array - List of related tools for API management
`;

export const listPortalsPrompt = () => `
List all available portals in Kong Konnect.

INPUT:
  - pageSize: Number - Number of portals per page (1-1000, default: 10)
  - pageNumber: Number (optional) - Page number to retrieve

OUTPUT:
  - metadata: Object - Contains pageSize, pageNumber, totalPages, totalCount
  - portals: Array - List of portals with details for each including:
    - portalId: String - Unique identifier for the portal
    - name: String - Display name of the portal
    - description: String - Description of the portal
    - active: Boolean - Whether the portal is active
    - metadata: Object - Creation and update timestamps
  - relatedTools: Array - List of related tools for portal management
`;

export const subscribeToApiPrompt = () => `
Subscribe to an API in the Kong Konnect Dev Portal.

INPUT:
  - apiId: String - ID of the API to subscribe to
  - applicationId: String - ID of the application to subscribe with, or 'new' to create a new application
  - appName: String (optional) - Name for the new application (required if applicationId is 'new')
  - appDescription: String (optional) - Description for the new application

OUTPUT:
  - subscription: Object - Details of the created subscription including:
    - subscriptionId: String - Unique identifier for the subscription
    - apiId: String - ID of the subscribed API
    - apiName: String - Name of the subscribed API
    - applicationId: String - ID of the application
    - applicationName: String - Name of the application
    - status: String - Status of the subscription (e.g., 'approved', 'pending')
    - metadata: Object - Creation and update timestamps
  - relatedTools: Array - List of related tools for subscription management
`;

export const generateApiKeyPrompt = () => `
Generate an API key for an application in the Kong Konnect Dev Portal.

INPUT:
  - applicationId: String - ID of the application to generate a key for
  - name: String (optional) - Name for the API key (default: 'API Key')
  - expiresIn: Number (optional) - Time in seconds until the key expires

OUTPUT:
  - apiKey: Object - Details of the generated API key including:
    - id: String - Unique identifier for the API key
    - key: String - The actual API key value (only shown once at creation)
    - name: String - Name of the API key
    - applicationId: String - ID of the application
    - expiresAt: String - Expiration timestamp (if applicable)
    - metadata: Object - Creation and update timestamps
  - usage: Object - Information about how to use the API key
`;

export const listApplicationsPrompt = () => `
List all applications in the Kong Konnect Dev Portal.

INPUT:
  - pageSize: Number - Number of applications per page (1-1000, default: 10)
  - pageNumber: Number (optional) - Page number to retrieve
  - filterName: String (optional) - Filter applications by name
  - sort: String (optional) - Sort field and direction (e.g. 'name,-created_at')

OUTPUT:
  - metadata: Object - Contains  pageSize, pageNumber, totalPages, totalCount, filters, sort
  - applications: Array - List of applications with details for each including:
    - applicationId: String - Unique identifier for the application
    - name: String - Display name of the application
    - description: String - Description of the application
    - status: String - Status of the application
    - metadata: Object - Creation and update timestamps
  - relatedTools: Array - List of related tools for application management
`;

export const listSubscriptionsPrompt = () => `
List all subscriptions in the Kong Konnect Dev Portal.

INPUT:
  - applicationId: String (optional) - Filter by application ID
  - apiId: String (optional) - Filter by API ID
  - pageSize: Number - Number of subscriptions per page (1-1000, default: 10)
  - pageNumber: Number (optional) - Page number to retrieve
  - status: String (optional) - Filter by subscription status (e.g., 'approved', 'pending')
  - sort: String (optional) - Sort field and direction (e.g. 'created_at,-status')

OUTPUT:
  - metadata: Object - Contains  pageSize, pageNumber, totalPages, totalCount, filters, sort
  - subscriptions: Array - List of subscriptions with details for each including:
    - subscriptionId: String - Unique identifier for the subscription
    - apiId: String - ID of the subscribed API
    - apiName: String - Name of the subscribed API
    - applicationId: String - ID of the application
    - applicationName: String - Name of the application
    - status: String - Status of the subscription
    - metadata: Object - Creation and update timestamps
  - relatedTools: Array - List of related tools for subscription management
`;

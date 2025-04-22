import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { tools } from "./tools.js";
import { KongApi, API_REGIONS } from "./api.js";
import * as devPortal from "./operations/devPortal.js";

/**
 * Main MCP server class for Kong Konnect integration
 */
class KongKonnectMcpServer extends McpServer {
  private api: KongApi;

  constructor(options: { apiKey?: string; apiRegion?: string } = {}) {
    super({
      name: "kong-konnect-mcp",
      version: "1.0.0",
      description: "Tools for managing Kong Konnect Developer Portal"
    });

    // Initialize the API client
    this.api = new KongApi({
      apiKey: options.apiKey || process.env.KONNECT_ACCESS_TOKEN,
      apiRegion: options.apiRegion || process.env.KONNECT_REGION || API_REGIONS.US
    });

    // Register all tools
    this.registerTools();
  }

  private registerTools() {
    const allTools = tools();

    allTools.forEach(tool => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (args: any, _extra: RequestHandlerExtra) => {
          try {
            let result;

            // Route to appropriate handler based on method
            switch (tool.method) {
              // Dev Portal tools
              case "authenticate_developer_portal":
                result = await devPortal.authenticateDevPortalDeveloper(
                  this.api,
                  args.portalId,
                  args.email,
                  args.password
                );
                break;
                
              case "list_apis":
                result = await devPortal.listApis(
                  this.api,
                  args.pageSize,
                  args.pageNumber,
                  args.filterName,
                  args.filterPublished,
                  args.sort,
                  args.portalId,
                  args.portalAccessToken
                );
                break;

              case "get_api_specifications":
                result = await devPortal.getApiSpecifications(
                  this.api,
                  args.apiId,
                  args.portalId,
                  args.portalAccessToken
                );
                break;
                
              case "list_portals":
                result = await devPortal.listPortals(
                  this.api,
                  args.pageSize,
                  args.pageNumber
                );
                break;

              case "subscribe_to_api":
                result = await devPortal.subscribeToApi(
                  this.api,
                  args.apiId,
                  args.applicationId,
                  args.appName,
                  args.appDescription,
                  args.portalId,
                  args.portalAccessToken
                );
                break;

              case "generate_api_key":
                result = await devPortal.generateApiKey(
                  this.api,
                  args.applicationId,
                  args.name,
                  args.expiresIn,
                  args.portalId,
                  args.portalAccessToken
                );
                break;

              case "list_applications":
                result = await devPortal.listApplications(
                  this.api,
                  args.pageSize,
                  args.pageNumber,
                  args.filterName,
                  args.sort,
                  args.portalId,
                  args.portalAccessToken
                );
                break;

              case "list_subscriptions":
                result = await devPortal.listSubscriptions(
                  this.api,
                  args.applicationId,
                  args.apiId,
                  args.pageSize,
                  args.pageNumber,
                  args.status,
                  args.sort,
                  args.portalId,
                  args.portalAccessToken
                );
                break;
                
              default:
                throw new Error(`Unknown tool method: ${tool.method}`);
            }

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          } catch (error: any) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error: ${error.message}\n\nTroubleshooting tips:\n1. Verify your API key is valid and has sufficient permissions\n2. Check that the parameters provided are valid\n3. Ensure your network connection to the Kong API is working properly`
                }
              ],
              isError: true
            };
          }
        }
      );
    });
  }
}

/**
 * Main function to run the server
 */
async function main() {
  // Get API key and region from environment if not provided
  const apiKey = process.env.KONNECT_ACCESS_TOKEN;
  const apiRegion = process.env.KONNECT_REGION || API_REGIONS.US;

  // Create server instance
  const server = new KongKonnectMcpServer({
    apiKey,
    apiRegion
  });

  // Create transport and connect
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Kong Konnect MCP Server is running...");
}

// Run the server
main().catch((error) => {
  console.error("Initialization error:", error);
  process.exit(1);
});

import { z } from "zod";
import * as prompts from "./prompts.js";
import * as parameters from "./parameters.js";

export type Tool = {
  method: string;
  name: string;
  description: string;
  parameters: z.ZodObject<any, any, any, any>;
  category: string;
};

export const tools = (): Tool[] => [
  // =========================
  // Dev Portal Tools
  // =========================
  {
    method: "authenticate_developer_portal",
    name: "Authenticate Developer Portal",
    description: prompts.authenticateDevPortalDeveloperPrompt(),
    parameters: parameters.authenticateDevPortalDeveloperParameters(),
    category: "dev_portal"
  },
  {
    method: "list_apis",
    name: "List APIs",
    description: prompts.listApisPrompt(),
    parameters: parameters.listApisParameters(),
    category: "dev_portal"
  },
  {
    method: "get_api_specifications",
    name: "Get API Specifications",
    description: prompts.getApiSpecificationsPrompt(),
    parameters: parameters.getApiSpecificationsParameters(),
    category: "dev_portal"
  },
  {
    method: "list_portals",
    name: "List Portals",
    description: prompts.listPortalsPrompt(),
    parameters: parameters.listPortalsParameters(),
    category: "dev_portal"
  },
  {
    method: "subscribe_to_api",
    name: "Subscribe to API",
    description: prompts.subscribeToApiPrompt(),
    parameters: parameters.subscribeToApiParameters(),
    category: "dev_portal"
  },
  {
    method: "generate_api_key",
    name: "Generate API Key",
    description: prompts.generateApiKeyPrompt(),
    parameters: parameters.generateApiKeyParameters(),
    category: "dev_portal"
  },
  {
    method: "list_applications",
    name: "List Applications",
    description: prompts.listApplicationsPrompt(),
    parameters: parameters.listApplicationsParameters(),
    category: "dev_portal"
  },
  {
    method: "list_subscriptions",
    name: "List Subscriptions",
    description: prompts.listSubscriptionsPrompt(),
    parameters: parameters.listSubscriptionsParameters(),
    category: "dev_portal"
  }
];

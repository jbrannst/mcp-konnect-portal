# Kong Konnect Portal MCP Server

![Static Badge](https://img.shields.io/badge/Release-Tech%20Preview-FFA500?style=plastic)

A Model Context Protocol (MCP) server for interacting with Kong Konnect Developer Portal APIs, allowing AI assistants to manage APIs, applications, and subscriptions.


https://www.linkedin.com/posts/johannesbrannstrom_apis-apimanagement-aidevelopment-activity-7322898216771829761-U8EX?utm_source=share&utm_medium=member_desktop&rcm=ACoAAAAXAu4BeTA_ITO23gjabDwrGAfw0GBQrHA


## Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
  - [Developer Portal Tools](#developer-portal-tools)
- [Usage with Claude](#usage-with-claude)
- [Example Workflows](#example-workflows)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Overview

This project provides a Model Context Protocol (MCP) server that enables AI assistants like Claude to interact with Kong Konnect's Developer Portal. It offers a set of tools to manage APIs, applications, and subscriptions through natural language conversation.

Key features:
- List and browse available APIs in the Developer Portal
- Manage applications and API subscriptions
- Generate API keys for accessing APIs
- Integration with Claude and other MCP-compatible AI assistants

Konnect MCP is a **work in progress** and we will be adding additional functionality and improvements with each release.

## Project Structure

```
src/
├── index.ts              # Main entry point
├── api.ts                # Kong API client
├── tools.ts              # Tool definitions
├── parameters.ts         # Zod schemas for tool parameters
├── prompts.ts            # Detailed tool documentation
├── operations/
│   └── devPortal.ts      # Developer portal operations
└── types.ts              # Common type definitions
```

## Installation

### Prerequisites
- Node.js 20 or higher
- A Kong Konnect account with API access
- A Kong Konnect Developer Portal with an API published (public or private)
- A client with MCP capabilities (e.g. Claude Desktop, Cline, Cursor, etc...)

### Setup

```bash
# Clone the repository
git clone https://github.com/Kong/mcp-konnect.git
cd mcp-konnect

# Install dependencies
npm install

# Build the project
npm run build
```

## Configuration

Set the following environment variables to configure the MCP server:

```bash
# Required: Your Kong Konnect API key
export KONNECT_ACCESS_TOKEN=kpat_api_key_here

# Optional: The API region to use (defaults to US)
# Possible values: US, EU, AU, ME, IN
export KONNECT_REGION=us

# Optional: If your dev portal allows login with username and password in order to access private APIs you can supply default values. 
export DEV_PORTAL_USER=your_dev_portal_email,
export DEV_PORTAL_PASSWORD=your_password
```

## Available Tools

### Developer Portal Tools

#### List Portals
List all available portals in Kong Konnect.

```
Inputs:
- pageSize: Number of portals per page
- pageNumber: Page number to retrieve
```

#### List APIs
List all available APIs in the Kong Konnect Dev Portal.

```
Inputs:
- pageSize: Number of APIs per page
- pageNumber: Page number to retrieve
- filterName: Filter APIs by name
- filterPublished: Filter by published status
- sort: Sort field and direction
- portalId: Portal ID to use for direct portal API access
- portalAccessToken: Portal access token for authentication
```

#### Subscribe to API
Subscribe to an API in the Kong Konnect Dev Portal.

```
Inputs:
- apiId: ID of the API to subscribe to
- applicationId: ID of the application to subscribe with
- appName: Name for the new application (if creating)
- appDescription: Description for the new application
- portalId: Portal ID to use for direct portal API access
- portalAccessToken: Portal access token for authentication
```

#### Generate API Key
Generate an API key for an application in the Kong Konnect Dev Portal.

```
Inputs:
- applicationId: ID of the application to generate a key for
- name: Name for the API key
- expiresIn: Time in seconds until the key expires
- portalId: Portal ID to use for direct portal API access
- portalAccessToken: Portal access token for authentication
```

#### List Applications
List all applications in the Kong Konnect Dev Portal.

```
Inputs:
- pageSize: Number of applications per page
- pageNumber: Page number to retrieve
- filterName: Filter applications by name
- sort: Sort field and direction
- portalId: Portal ID to use for direct portal API access
- portalAccessToken: Portal access token for authentication
```

#### List Subscriptions
List all subscriptions in the Kong Konnect Dev Portal.

```
Inputs:
- applicationId: Filter by application ID
- apiId: Filter by API ID
- pageSize: Number of subscriptions per page
- pageNumber: Page number to retrieve
- status: Filter by subscription status
- sort: Sort field and direction
- portalId: Portal ID to use for direct portal API access
- portalAccessToken: Portal access token for authentication
```

## Usage with Claude

To use this MCP server with Claude for Desktop:

1. Install [Claude for Desktop](https://claude.ai/download)
2. Create or edit the Claude Desktop configuration file:
   - MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

3. Add the following configuration:

```json
{
  "mcpServers": {
    "kong-konnect": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-konnect/build/index.js"
      ],
      "env": {
        "KONNECT_ACCESS_TOKEN": "kpat_api_key_here",
        "KONNECT_REGION": "us"
      }
    }
  }
}
```

Optionally also add developer credentials:

```json
{
  "mcpServers": {
    "kong-konnect": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-konnect/build/index.js"
      ],
      "env": {
        "KONNECT_ACCESS_TOKEN": "kpat_api_key_here",
        "KONNECT_REGION": "us",
        "DEV_PORTAL_USER": "email_here",
        "DEV_PORTAL_PASSWORD": "password_here"
      }
    }
  }
}
```


4. Restart Claude for Desktop
5. The Kong Konnect tools will now be available for Claude to use

## Example Workflows

### Working with Developer Portal

1. List available portals:
   ```
   List all developer portals in my Kong Konnect organization.
   ```

2. List APIs in a portal:
   ```
   List all APIs available in the developer portal [PORTAL_ID].
   ```

3. Create an application and subscribe to an API:
   ```
   Create a new application named "Test App" and subscribe it to the API [API_ID] in portal [PORTAL_ID].
   ```

4. Generate an API key for an application:
   ```
   Generate an API key for application [APPLICATION_ID] in portal [PORTAL_ID].
   ```

## Development

### Adding New Tools

1. Define the parameters in `parameters.ts`
2. Add documentation in `prompts.ts`
3. Create the operation logic in the appropriate file in `operations/`
4. Register the tool in `tools.ts`
5. Handle the tool execution in `index.ts`

## Troubleshooting

### Common Issues

**Connection Errors**
- Verify your API key is valid and has the necessary permissions
- Check that the API region is correctly specified
- Ensure your network can connect to the Kong Konnect API

**Authentication Errors**
- Regenerate your API key in the Kong Konnect portal
- Check that environment variables are correctly set

**Data Not Found**
- Verify the IDs used in requests are correct
- Check that the resources exist in the specified portal

## Credits

Built by Kong. Inspired by Stripe's [Agent Toolkit](https://github.com/stripe/agent-toolkit).

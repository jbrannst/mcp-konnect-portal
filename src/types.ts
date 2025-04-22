// Dev Portal Types
export interface DevPortalApi {
  id: string;
  name: string;
  description?: string;
  version?: string;
  published: boolean;
  deprecated: boolean;
  specification?: string;
  specification_format?: string;
  created_at: string;
  updated_at: string;
}

export interface DevPortalApplication {
  id: string;
  name: string;
  description?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DevPortalSubscription {
  id: string;
  api: {
    id: string;
    name: string;
  };
  application: {
    id: string;
    name: string;
  };
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DevPortalApiKey {
  id: string;
  key: string;
  name: string;
  subscription: {
    id: string;
    api: {
      id: string;
      name: string;
    };
    application: {
      id: string;
      name: string;
    };
  };
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

import {
  PaperclipApiError,
  PaperclipUnreachableError,
  ToolInputError,
} from "./shared/errors.js";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";

export interface PaperclipClientOptions {
  apiBase: string;
  defaultCompanyId?: string;
  agentApiKey?: string;
}

export class PaperclipClient {
  readonly apiBase: string;
  readonly defaultCompanyId: string | undefined;
  readonly agentApiKey: string | undefined;

  constructor(opts: PaperclipClientOptions) {
    this.apiBase = opts.apiBase.replace(/\/+$/, "");
    this.defaultCompanyId = opts.defaultCompanyId;
    this.agentApiKey = opts.agentApiKey;
  }

  resolveCompanyId(input: string | undefined): string {
    const value = input ?? this.defaultCompanyId;
    if (!value) {
      throw new ToolInputError(
        "companyId",
        "required when PAPERCLIP_COMPANY_ID env is not set",
      );
    }
    return value;
  }

  async request<T = unknown>(
    method: HttpMethod,
    path: string,
    body?: unknown,
    extraHeaders?: Record<string, string>,
  ): Promise<T> {
    const url = `${this.apiBase}${path}`;
    const headers: Record<string, string> = {
      ...(this.agentApiKey ? { Authorization: `Bearer ${this.agentApiKey}` } : {}),
      ...extraHeaders,
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new PaperclipUnreachableError(this.apiBase);
    }

    let parsed: unknown;
    try {
      parsed = await response.json();
    } catch {
      parsed = await response.text().catch(() => "");
    }

    if (!response.ok) {
      throw new PaperclipApiError(response.status, parsed, path);
    }
    return parsed as T;
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.request("GET", "/api/health");
      return true;
    } catch {
      return false;
    }
  }
}

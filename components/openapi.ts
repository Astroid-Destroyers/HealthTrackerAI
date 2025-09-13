export class OpenAPIClient {
  static async ask(input: string): Promise<{ json?: any; text?: string }> {
    try {
      const res = await fetch(`/api/hello?input=${encodeURIComponent(input)}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const data = await res.json();

      // Prefer json field if available
      if (data?.json !== undefined) {
        return { json: data.json };
      } else if (typeof data?.text === "string") {
        return { text: data.text };
      } else if (typeof data?.response === "object") {
        return { json: data.response };
      } else {
        return { text: JSON.stringify(data, null, 2) };
      }
    } catch (err: any) {
      console.error("OpenAPIClient.ask fetch error:", err);
      throw new Error(err?.message ?? "Unknown error");
    }
  }
}

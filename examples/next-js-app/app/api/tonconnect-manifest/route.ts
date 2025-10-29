import { retrieveEnvVariable } from "@/lib/utils";

export async function GET() {
  const manifestUrl = retrieveEnvVariable("OMNIDEMO__TONCONNECT__MANIFEST_URL");
  const url = new URL(manifestUrl);
  const baseUrl = `${url.protocol}//${url.host}`;

  const manifest = {
    url: baseUrl,
    name: "Omniston (demo)",
    iconUrl: "https://static.ston.fi/logo/external-logo.jpg",
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

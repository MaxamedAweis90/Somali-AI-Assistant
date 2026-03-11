import { ChatSource } from "@/types/chat";

export interface ExaSearchResult {
  results: Array<{
    title: string;
    url: string;
    text: string;
  }>;
}

export async function performExaSearch(query: string): Promise<{ context: string; sources: ChatSource[] } | null> {
  const apiKey = process.env.Exaai_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query: query,
        useAutoprompt: true,
        numResults: 5,
        contents: {
          text: true,
        },
      }),
    });

    if (!res.ok) {
      console.error("Exa search error:", await res.text());
      return null;
    }

    const data = (await res.json()) as ExaSearchResult;
    
    if (!data.results || data.results.length === 0) return null;

    const sources: ChatSource[] = data.results.map((r) => {
      let domain = r.url;
      try {
        domain = new URL(r.url).hostname.replace(/^www\./i, "");
      } catch {}
      return {
        url: r.url,
        title: r.title || domain,
        domain: domain,
      }
    });

    const context = data.results
      .map((r) => `[Source: ${r.title || r.url}]\n${r.text}`)
      .join("\n\n");

    return {
      context: `Haddii jawaabtu u baahan tahay xaqiijin ama xog cusub, ku tiirso xogta aad ka hesho web-ka oo ha ku soo koobnayn xusuusta model-ka oo keliya. Marka aad web-ka adeegsato, diyaari jawaab si nadiif ah oo habeysan; ha keenin qodobo go'an ama kala go'ay xitaa haddii aad xog dibadda ka soo ururinayso.\n\n<Search_Results>\n${context}\n</Search_Results>`,
      sources,
    };
  } catch (error) {
    console.error("Exa search error:", error);
    return null;
  }
}

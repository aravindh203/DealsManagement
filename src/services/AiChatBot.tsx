import axios from "axios";
const AZURE_OPENAI_ENDPOINT = "https://yasazureopenai.openai.azure.com/";
const AZURE_OPENAI_API_KEY = "51dba10bffe44152968d18f9cd135e85";
const AZURE_DEPLOYMENT_NAME = "gpt-35-turbo";
const AZURE_API_VERSION = "2025-01-01-preview";





export const AiChatBot = async (Projectdata: any, Question: any) => {
  const systemPrompt = `Your job is to analyze the provided Project Data and respond to the user's question using only that information.

Project Data: ${Projectdata}

User Question: ${Question}

Instructions:

Carefully read and analyze the Project Data.

Data Interpretation Rules:
1. Each top-level object represents a PROJECT.
2. The field "name" represents the Project Name.
3. Ignore any generic folder labels such as "Document Library" and "Invoice".
4. The "children" array contains items related to that project.
5. Each item inside "children" represents a VENDOR.
6. The vendor name should be taken from child.name.
7. Ignore folders named "Vendor" or other generic grouping folders.

Focus Rules (IMPORTANT):
- Identify the specific intent of the User Question before answering.
- If the user asks about budget or cost, respond ONLY with budget/cost-related fields. Do NOT include vendor names, bid amounts, or who won the bid unless explicitly asked.
- If the user asks about vendors, respond ONLY with vendor names. Do NOT include budget, timeline, or other unrelated fields.
- If the user asks about timeline or dates, respond ONLY with start date, end date, and status.
- If the user asks about status, respond ONLY with the current status of the project.
- If the user asks "who won the bid" or "awarded vendor", respond ONLY with the winning vendor and their bid amount.
- Only if the user explicitly asks for "all details" or "full summary" should you return a complete project summary.
- Never volunteer extra information beyond what is asked.

Answer the User Question using only the information available in the Project Data.

The response should be written in a clear and natural paragraph format.

Response Format:
Return ONLY valid JSON using this exact structure:
{
  "answer": "",
  "suggestion": ""
}

Rules:
- If the question can be answered, fill "answer" with a focused paragraph and leave "suggestion" empty.
- If the question cannot be answered from the project data, leave "answer" empty and fill "suggestion" with a helpful redirect.
- Do not include markdown formatting.
- Do not return raw JSON or field lists.
- Only return valid JSON.`;

  const userPrompt = `
Project Details:
${JSON.stringify(Projectdata, null, 2)}

Question:
${JSON.stringify(Question, null, 2)}
`;

  const response = await fetch(
    `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_OPENAI_API_KEY,
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2, // Low temperature for more analytical/consistent scoring
        max_tokens: 1500,
      }),
    }
  );

  const json = await response.json();
  let content = json.choices[0].message.content.trim();

  if (content.startsWith("```json")) {
    content = content.substring(7);
  }
  if (content.endsWith("```")) {
    content = content.substring(0, content.length - 3);
  }
  return JSON.parse(content);
};

import axios from "axios";
const AZURE_OPENAI_ENDPOINT = "https://yasazureopenai.openai.azure.com/";
const AZURE_OPENAI_API_KEY = "51dba10bffe44152968d18f9cd135e85";
const AZURE_DEPLOYMENT_NAME = "gpt-35-turbo";
const AZURE_API_VERSION = "2025-01-01-preview";





export const AiChatBot = async (Projectdata: any,Question: any) => {
  const systemPrompt = `
Your job is to analyze the provided Project Data and respond to the user's question using only that information.

Project Data: ${Projectdata}

User Question: ${Question}

Instructions:

Carefully read and analyze the Project Data.

Answer the User Question using only the information available in the Project Data.

The response should be written in a clear and natural paragraph format, similar to how an AI assistant explains information to users.

When describing project information, include relevant details such as:

Project Name

Description

Start Date

End Date (if available)

Status

Company

Created User

Vendor names

Available vendor documents or folders

If the user asks for all project details, generate a complete project summary paragraph using all available fields.

If the user asks for specific information (for example vendor list, status, timeline, cost estimation, or documents), respond with a focused paragraph explaining that information.

When mentioning vendors, include only valid vendor company names and ignore generic folder labels like "Vendor".

Do not return raw JSON project structures or field lists inside the answer. Convert the data into a readable paragraph.

If the question cannot be answered from the provided data or is unrelated to the project, provide a helpful suggestion guiding the user to ask questions related to:

project details

vendor proposal information

cost estimation

scope of work

timeline

compliance or requirements

Response Format:

Return ONLY valid JSON using this exact structure:

{
"answer": "",
"suggestion": ""
}

Rules:

If the question can be answered, fill the "answer" field with a clear paragraph explanation and leave "suggestion" empty.

If the question cannot be answered from the project data, leave "answer" empty and provide a helpful suggestion in "suggestion".

Do not include markdown formatting.

Do not return file paths unless they are part of the explanation.

Only return valid JSON.`;

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

  console.log("content", content);
  return JSON.parse(content);
};
import axios from "axios";
const AZURE_OPENAI_ENDPOINT = "https://yasazureopenai.openai.azure.com/";
const AZURE_OPENAI_API_KEY = "51dba10bffe44152968d18f9cd135e85";
const AZURE_DEPLOYMENT_NAME = "gpt-35-turbo";
const AZURE_API_VERSION = "2025-01-01-preview";

// export const analysisOpenAI = async (ticketContent) => {
//   const systemPrompt = `
// You are a smart assistant that extracts structured data from ticket documents like train tickets, bus tickets (redBus), hotel booking bills, purchase bills, and handwritten receipts.

// Given the OCR-extracted text from the document, extract the following:

// {
//   "ticketType": "",              // One of: "Train", "Bus", "Hotel", "Purchase", "Handwritten", or "Unknown"
//   "sourceProvider": "",          // Example: IRCTC, redBus, Hotal, etc.
//   "invoiceNumber": "",           // PNR Number, Booking ID or Invoice Number
//   "issueDate": "",               // Format: yyyy-MM-ddTHH:mm:ssZ
//   "fullName": "",                // Name of the person, if available
//   "totalAmount": 0,              // Numeric 
//   "gstAmount": 0,                // If present, else 0
//   "paymentMode": "",             // UPI, Card, Cash, etc.
//   "additionalInfo": {
//     "boardingOrLocation": "",    // For travel: boarding point / hotel
//     "destinationOrTo": "",       // Destination or hotel city
//     "notes": ""                  // Any extra useful info found
//   }
// }

// Only respond with the JSON structure and extract accurately from the provided OCR text.
// Ensure date is formatted as "yyyy-MM-ddTHH:mm:ssZ". Return null if date or name is not available.

// `;
//   const userPrompt = `Ticket Content:\n${ticketContent}`;

//   const response = await fetch(
//     `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_DEPLOYMENT_NAME}/chat/completions?api-version=${AZURE_API_VERSION}`,
//     {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         "api-key": AZURE_OPENAI_API_KEY,
//       },
//       body: JSON.stringify({
//         messages: [
//           { role: "system", content: systemPrompt },
//           { role: "user", content: userPrompt },
//         ],
//         temperature: 0.3,
//         max_tokens: 4000,
//       }),
//     }
//   );

//   const json = await response.json();
//   return JSON.parse(json.choices[0].message.content.trim()) || {};
// };

export const analyzeVendorDocuments = async (vendorData: any, projectDetails: any) => {
  const systemPrompt = `
You are an expert AI sourcing and procurement assistant. Your job is to strictly analyze the provided OCR-extracted text from a vendor's submitted documents and compare them against the provided Project Details.

Project Description: ${projectDetails?.P_Description || ""}

Based on the description and document content, create the scores.

You must return ONLY a JSON response matching this exact structure:

{
  "matchPercentage": 95, // Calculate an overall score out of 100 on how well this vendor fits the project.
  "confidence": "High", // "High", "Medium", or "Low" based on the amount/clarity of provided data.
  "location": "Vendor Location", // Extract the vendor's location/headquarters if available. If unknown, leave empty.
  "website": "Vendor Website", // Extract the vendor's website if available. If unknown, leave empty.
  "bidAmount": "Total Price", // Extract the total bid or cost estimation numeric amount if found.
  "documentScores": [
    // Create exactly three scores out of 100 based on the content matching the project.
    { "name": "PROPOSAL QUALITY", "score": 90 },
    { "name": "COST ACCURACY", "score": 85 },
    { "name": "POLICY COMPLIANCE", "score": 95 }
  ],
  "reasonsForMatch": [
    // Provide exactly 3 short bullet points (max 5 words each) explaining why this vendor is a good match.
    "Strong technical alignment",
    "Cost within budget",
    "Fast delivery timeline"
  ]
}

Only respond with valid JSON. Do not include markdown formatting like \`\`\`json.
`;

  const userPrompt = `
Project Details:
${JSON.stringify(projectDetails, null, 2)}

Vendor Documents Extracted Text:
${JSON.stringify(vendorData, null, 2)}
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





export const analyzeProposalDocuments = async (vendorData: any, projectDetails: any) => {
  const systemPrompt = `
Your job is to analyze and compare the project description with the vendor proposal text provided through OCR or user input.

Project Description: ${projectDetails?.P_Description || ""}

Vendor Document / Text Input: ${vendorData}

Instructions:

Carefully compare the Project Description with the Vendor Document/Text Input.

Evaluate how well the vendor proposal matches the project requirements, scope, services, cost indications, and compliance.

Based on this comparison, calculate a match score from 0 to 100% indicating how well the vendor proposal aligns with the project description.

Generate an AI suggestion based on the score using the rules below.

Scoring Rules:

0 – 69 → Poor match. Suggest improvements or recommend rejection.

70 – 79 → Good match. Provide a positive recommendation explaining why the vendor is suitable.

80 – 100 → Strong match. Provide a positive evaluation but also mention possible risks, gaps, or considerations.

Response Format:

Return ONLY valid JSON using this exact structure:

{
"score": 0,
"aiSuggestion": ""
}

Only respond with valid JSON. Do not include markdown formatting like json`;

  const userPrompt = `
Project Details:
${JSON.stringify(projectDetails, null, 2)}

Vendor Documents Extracted Text:
${JSON.stringify(vendorData, null, 2)}
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



export const CreateProjectbyDescription = async (projectDetails: any) => {
  const systemPrompt = `You are an AI project analyzer.

Input:
Project Description: ${projectDetails?.P_Description || ""}

Task:
Analyze the project description and extract the following fields:

projectName

projectType

startDate

endDate

bidStartDate

bidEndDate

budget

currency

projectBrief

Instructions:

Carefully analyze the project description and identify relevant details.

Briefly summarize the project in projectBrief (2–3 sentences).
Extract all available values from the project description.

Generate projectBrief with 3–4 descriptive sentences explaining the project.

The projectBrief must focus on the project purpose, type, goals, and expected functionality.

Do NOT include budget, start date, end date, or bidding dates in projectBrief.

If a field is missing in the description, add the field name inside missingFields.

If budget is missing OR budget = 0, treat it as missing.

If currency is not mentioned, automatically set "currency": "USD".

Convert dates to YYYY-MM-DD format if possible.

Do not guess unknown values — return null.

Return only valid JSON.

that projectBrief retun breifly explain the project not budget includes and not say the due date and startdate only explain the project type and projet explaines
Do NOT guess unknown values. Use null for unavailable fields.


Return only valid JSON with no extra text.

Output JSON format:

{
"projectName": "",
"projectType": "",
"startDate": "",
"endDate": "",
"bidStartDate": "",
"bidEndDate": "",
"budget": null,
"currency": "USD",
"projectBrief": "",
"missingFields": []
}`

  const userPrompt = `
Project Details:
${JSON.stringify(projectDetails, null, 2)}


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
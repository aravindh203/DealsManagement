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

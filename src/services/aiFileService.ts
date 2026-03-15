import axios from "axios";

export const getFileContent = async (file: File, type: string) => {
  const endpoint = "https://madhesteam.cognitiveservices.azure.com";
  // const endpoint =
  //   "https://documentintelligenceroca.cognitiveservices.azure.com";
  const apiKey =
    "6CsLs6TJ703l2djYHbjmvFlCgCrbzrXGcbKVtPJqEdUxWo6sWuq6JQQJ99CCACGhslBXJ3w3AAALACOGyxc6";
  // const apiKey =
  //   "7Lb5CA8I8fsAhwQkGXXjTzAQOj5ed1Al0aEefXJZU19jiSTrxqouJQQJ99BGACYeBjFXJ3w3AAALACOGHtGK";

  const url = `${endpoint}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-11-30`;

  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    // Send file to Azure Document Intelligence
    const response = await axios.post(url, arrayBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Ocp-Apim-Subscription-Key": apiKey,
      },
    });

    const operationLocation = response.headers["operation-location"];

    if (!operationLocation) {
      throw new Error("Operation location not returned from API");
    }

    // Poll for result
    let result;
    while (true) {
      await new Promise((res) => setTimeout(res, 3000));

      const resultResponse = await axios.get(operationLocation, {
        headers: {
          "Ocp-Apim-Subscription-Key": apiKey,
        },
      });

      const data = resultResponse.data;

      if (data.status === "succeeded") {
        result = data.analyzeResult?.content || "";
        break;
      }

      if (data.status === "failed") {
        throw new Error("Document analysis failed");
      }
    }
    return result;
  } catch (error) {
    throw error;
  }
};

import axios from 'axios';

// Fallback high-quality mock answers based on popular questions
const MOCK_ANSWERS = [
  "Based on Section 3.2 of the uploaded document, the project outline specifies a phased rollout strategy over 12 months. Phase 1 focuses on core API development (Months 1-4), Phase 2 covers the client frontend and initial testing (Months 5-8), and Phase 3 wraps up with deployment and scaling.",
  "According to the financial breakdown in Table 4, the allocated budget is structured as follows:\n\n* **Research & Development:** 45% ($225,000)\n* **Marketing & User Acquisition:** 25% ($125,000)\n* **Operational Expenses:** 20% ($100,000)\n* **Contingency Fund:** 10% ($50,000)\n\nThis allocation is designed to sustain operations for the first 18 months post-launch.",
  "The document highlights three key performance indicators (KPIs) for the upcoming fiscal quarter:\n\n1. **Monthly Active Users (MAU):** Targeting 50,000 active users by Month 6.\n2. **Customer Acquisition Cost (CAC):** Reducing the CAC by 15% through organic social proof channels.\n3. **Net Promoter Score (NPS):** Maintaining an NPS of 75+ through enhanced real-time customer support.",
  "Yes, the terms of service document explicitly states in paragraph 8.4 that all user data is fully encrypted at rest using AES-256 standards, and in transit via TLS 1.3. Users retain complete ownership of their content and can request full data deletion at any time, which is processed within 48 hours.",
  "Regarding your question, the schematic diagram on page 12 reveals that the system architecture relies on a highly decoupled event-driven model. It utilizes a central message broker to distribute jobs to independent service nodes, which scaling horizontally based on real-time task queues.",
];

export async function uploadPDF(
  file: File,
  onProgress: (progress: number) => void,
  baseUrl: string,
  useSimulation: boolean
): Promise<{ fileName: string }> {
  if (useSimulation) {
    // Simulate upload delay
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      onProgress(progress);
    }
    return { fileName: file.name };
  }

  // Real upload code
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(`${baseUrl}/upload-pdf`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      }
    },
  });

  // Depending on how backend response is structured
  return { fileName: file.name };
}

export async function sendChatMessage(
  query: string,
  baseUrl: string,
  useSimulation: boolean
): Promise<string> {
  if (useSimulation) {
    // Simulate network latency
    // await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Choose a response based on query keywords or pick from array
    const qLower = query.toLowerCase();
    if (qLower.includes('budget') || qLower.includes('financial') || qLower.includes('money')) {
      return MOCK_ANSWERS[1];
    } else if (qLower.includes('kpi') || qLower.includes('metric') || qLower.includes('target')) {
      return MOCK_ANSWERS[2];
    } else if (qLower.includes('security') || qLower.includes('encryption') || qLower.includes('secure') || qLower.includes('data')) {
      return MOCK_ANSWERS[3];
    } else if (qLower.includes('architecture') || qLower.includes('system') || qLower.includes('diagram')) {
      return MOCK_ANSWERS[4];
    }
    
    // Default reply
    const randomIndex = Math.floor(Math.random() * MOCK_ANSWERS.length);
    return `Regarding your question: "${query}", here is what I extracted from the document:\n\n${MOCK_ANSWERS[randomIndex]}`;
  }

  // Real API call
  const response = await axios.post(`${baseUrl}/chat`, { query });
  return response.data.response;
}

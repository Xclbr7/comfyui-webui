// api.js
const COMFY_URL = "127.0.0.1:8188";

export const setupWebSocket = (onMessage) => {
  const clientId = crypto.randomUUID();
  const ws = new WebSocket(`ws://${COMFY_URL}/ws?clientId=${clientId}`);
  
  ws.onmessage = (event) => {
    if (typeof event.data !== 'string') return;
    try {
      const message = JSON.parse(event.data);
      console.log("WebSocket message:", message);
      onMessage(message);
    } catch (error) {
      console.error("WebSocket parsing error:", error);
    }
  };

  ws.onerror = (error) => {
    console?.error("WebSocket error:", error);
  };

  ws.onopen = () => {
    console.log("WebSocket connected with clientId:", clientId);
  };

  ws.onclose = (event) => {
    console.log("WebSocket closed:", event);
  };

  return { ws, clientId };
};

// Make sure to export queuePrompt
export const queuePrompt = async (workflow, clientId) => {
  try {
    const response = await fetch(`http://${COMFY_URL}/prompt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        prompt: workflow,
        client_id: clientId
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Queue prompt error:", error);
    throw error;
  }
};
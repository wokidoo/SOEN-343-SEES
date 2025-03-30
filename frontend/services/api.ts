export const testConnection = async () => {
  try {
    const response = await fetch("/api/test-connection");
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};


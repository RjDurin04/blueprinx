async function test() {
    console.log("Starting test...");
    try {
        const response = await fetch('http://localhost:3001/api/v1/ai/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: 'Design a simple MVP' })
        });

        console.log("Response status:", response.status);
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log("Stream complete.");
                break;
            }
            const chunk = decoder.decode(value, { stream: true });
            console.log("CHUNK RECEIVED:", chunk);
        }
    } catch (e) {
        console.error("Test failed:", e);
    }
}
test();

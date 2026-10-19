// 1. import the GenAI object
const { ai, MODEL } = require("./gemini");

// 1. Import the tools
const { getCurrentWeather, getLocation } = require("./tools");

// 2. Asynchronous main function
async function main() {
    // 3. Generate a response from the LLM
    const location = await getLocation();
    const weather = await getCurrentWeather();
    const response = await ai.models.generateContent({
        model: MODEL,
        contents: `Give me a list of activity ideas based on my current location and weather. 
        Location: ${location}, Weather: ${JSON.stringify(weather)}`
    });

    // 4. Show the output
    console.log(response.text);
}

main();
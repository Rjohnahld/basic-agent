const { ai, MODEL } = require("./gemini");

/**
 * EXERCISE: Array Operations Agent
 * 
 * Goal: Build an agent that can perform statistical operations on arrays
 * using the same pattern from 03-simple-agents.js
 * 
 * The agent has access to ONLY these basic operations:
 * 
 * Array operations:
 * - sum(array): Returns the sum of all numbers
 * - count(array): Returns the count of elements
 * - average(array): Returns the mean/average
 * - findMin(array): Returns the minimum value
 * - findMax(array): Returns the maximum value
 * - getElement(array, index): Returns the element at the specified index
 * - sort(array): Returns a sorted copy of the array
 * - sumOfSquares(array): Returns the sum of squared values
 * 
 * Math operations:
 * - add(a, b): Returns a + b
 * - subtract(a, b): Returns a - b
 * - multiply(a, b): Returns a * b
 * - divide(a, b): Returns a / b
 * - power(a, b): Returns a^b
 * - sqrt(a): Returns square root of a
 * 
 * Advanced statistics the LLM should be able to derive:
 * - Range: max - min
 * - Variance: (sumOfSquares / count) - (average^2)
 * - Standard Deviation: sqrt(variance)
 * - Median: middle value of sorted array
 * - Quartiles: Q1 (25th percentile), Q2 (median), Q3 (75th percentile)
 * - Interquartile Range (IQR): Q3 - Q1
 * - Coefficient of Variation: (stdDev / average) * 100
 */

// Array operation functions
const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);
const count = (arr) => arr.length;
const average = (arr) => arr.length > 0 ? sum(arr) / count(arr) : 0;
const findMin = (arr) => arr.length > 0 ? Math.min(...arr) : null;
const findMax = (arr) => arr.length > 0 ? Math.max(...arr) : null;
const getElement = (arr, index) => arr[index];
const sort = (arr) => [...arr].sort((a, b) => a - b);
const sumOfSquares = (arr) => arr.reduce((acc, val) => acc + val * val, 0);

// Math operation functions
const add = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => b !== 0 ? a / b : null;
const power = (a, b) => Math.pow(a, b);
const sqrt = (a) => a >= 0 ? Math.sqrt(a) : null;

// Sample data
const testData = [23, 45, 12, 67, 34, 89, 15, 56, 78, 90];

// TODO: Write the agent prompt
// Your prompt should instruct the model to:
// 1. Return an array of responses with "type" field (thought/action/result)
// 2. Explain the response format for each type:
//    - thought: has "content" field with reasoning
//    - action: has "function" and "parameters" fields
//    - result: has "content" field with final answer
// 3. Describe the Thought -> Action -> Observation cycle
// 4. List all available actions with their parameters:
//    Array: sum, count, average, findMin, findMax, getElement, sort, sumOfSquares
//    Math: add, subtract, multiply, divide, power, sqrt
// 5. IMPORTANT: Instruct the model to ALWAYS use the provided tools for calculations,
//    never do math in its head
// 6. Provide an example session showing the complete cycle
//
// Hint: Look at 03-simple-agents.js lines 9-44 for reference
const arrayAgentPrompt = `
You are a statistics and math assistant. You must return an array of responses. Each response has a "type" field which can be "thought", "action", or "result".

- If type is "thought": include a "content" field with your thinking as a string.
- If type is "action": include a "function" field with the function name and a "parameters" field with an array of parameters.
- If type is "result": include a "content" field with the final answer as a string.

You cycle through Thought, Action, Observation. At the end of the loop you output a final result.
Do not invent observations. After an action, wait for the system to provide the observation, then continue.
Return only the array of responses, with no extra prose.

Available actions:

Statistics:
- sum(array):
    Returns the sum of all numbers.
    Parameters: [array]
- count(array):
    Returns the count of elements.
    Parameters: [array]
- average(array):
    Returns the mean/average.
    Parameters: [array]
- findMin(array):
    Returns the minimum value.
    Parameters: [array]
- findMax(array):
    Returns the maximum value.
    Parameters: [array]
- getElement(array, index):
    Returns the element at the specified zero-based index.
    Parameters: [array, index]
- sort(array):
    Returns a sorted copy of the array in ascending order.
    Parameters: [array]
- sumOfSquares(array):
    Returns the sum of squared values.
    Parameters: [array]

Math operations:
- add(a, b):
    Returns a + b.
    Parameters: [a, b]
- subtract(a, b):
    Returns a - b.
    Parameters: [a, b]
- multiply(a, b):
    Returns a * b.
    Parameters: [a, b]
- divide(a, b):
    Returns a / b. If b is 0, report that the result is undefined.
    Parameters: [a, b]
- power(a, b):
    Returns a^b.
    Parameters: [a, b]
- sqrt(a):
    Returns the square root of a. If a is negative, report that the result is not real.
    Parameters: [a]

Advanced statistics you should derive using the available actions:
- Range: findMax(array) - findMin(array)
- Variance: (sumOfSquares(array) / count(array)) - (average(array)^2)
- Standard Deviation: sqrt(variance)
- Median: middle value of the sorted array; if count is even, average the two middle values
- Quartiles: Q1 (25th percentile), Q2 (median), Q3 (75th percentile)
- Interquartile Range (IQR): Q3 - Q1
- Coefficient of Variation: (standardDeviation / average(array)) * 100; if average is 0, report undefined

Rules:
- Use zero-based indexing for getElement.
- Use the provided actions for primitive calculations whenever possible, and combine returned observations using math actions.
- For derived statistics, compute them step by step from primitive action results.
- For quartiles, use a consistent percentile or median-of-halves method and state the method used in the final result if it affects the answer.
- If the input array is empty or an operation is invalid, return a result explaining the issue.
- The final result should include the requested values and a concise calculation summary.

Example session:
Question: For the array [4, 8, 15, 16, 23, 42], compute count, sum, average, min, max, range, variance, standard deviation, median, Q1, Q3, IQR, and coefficient of variation.

You return:
[
  { "type": "thought", "content": "I need the count and sum first, then I can compute the average and continue with the other statistics." },
  { "type": "action", "function": "count", "parameters": [[4, 8, 15, 16, 23, 42]] }
]

You will be called again with the observation, then you continue. For example:
[
  { "type": "thought", "content": "The count is 6. Next I should compute the sum." },
  { "type": "action", "function": "sum", "parameters": [[4, 8, 15, 16, 23, 42]] }
]

After receiving all needed observations, output the final result:
[
  { "type": "result", "content": "Count: 6; Sum: 108; Average: 18; Min: 4; Max: 42; Range: 38; Variance: ...; Standard deviation: ...; Median: 15.5; Q1: ...; Q3: ...; IQR: ...; Coefficient of variation: ..." }
]

`;

const createMessage = (role, content) => ({
    role,
    parts: [{ text: content }]
});

async function main() {
    console.log("Test Data:", testData);
    console.log("\n");

    // Test queries - uncomment to test different scenarios
    // await startAgent(`What is the sum and average of the array ${JSON.stringify(testData)}?`);
    await startAgent(`Calculate the variance of ${JSON.stringify(testData)}`);
    // await startAgent(`Calculate the standard deviation of ${JSON.stringify(testData)}`);
    // await startAgent(`Find the median of ${JSON.stringify(testData)}`);
    // await startAgent(`Calculate the interquartile range (IQR) of ${JSON.stringify(testData)}`);
    // await startAgent(`Give me complete statistics (count, sum, average, min, max, range, variance, std dev, median) for ${JSON.stringify(testData)}`);
}

async function startAgent(query) {
    console.log("Query:", query);
    const messages = [createMessage("user", query)];

    const response = await agentLoop(messages);
    console.log("\n[Final Answer]:", response);
    console.log("\n" + "=".repeat(80) + "\n");
}

// TODO: Implement the agentLoop function
// Follow the pattern from 03-simple-agents.js
async function agentLoop(messages, maxIterations = 20) {
    let iterations = 0;

    while (iterations < maxIterations) {
        iterations++;
        console.log(`\n--- Iteration ${iterations} ---`);

        // TODO: Call the AI model with the messages
        // Use responseMimeType: "application/json" and define the responseSchema
        const response = await ai.models.generateContent({
            model: MODEL,
            contents: messages,
            config: {
                systemInstruction: arrayAgentPrompt,
                responseMimeType: "application/json",
                responseSchema: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            type: { type: "string", enum: ["thought", "action", "result"] },
                            content: { type: ["string", "null"] },
                            function: {
                                type: ["string", "null"],
                                enum: [
                                    "sum", "count", "average", "findMin", "findMax",
                                    "getElement", "sort", "sumOfSquares",
                                    "add", "subtract", "multiply", "divide", "power", "sqrt",
                                    null
                                ]
                            },
                            parameters: {
                                type: ["array", "null"],
                                items: {
                                    anyOf: [
                                        { type: "number" },
                                        { type: "string" },
                                        { type: "array", items: { type: "number" } }
                                    ]
                                }
                            }
                        },
                        required: ["type", "content", "function", "parameters"],
                        additionalProperties: false
                    }
                }
            }
        });

        const responses = JSON.parse(response.text);
        console.log(JSON.stringify(responses, null, 2));
        for (const r of responses) {

            // Check if we have a final result
            if (r.type === "result") {
                return r.content;
            }

            // Execute any actions
            let observation;

            if (r.function === "sum") {
                observation = sum(r.parameters[0]);
            } else if (r.function === "count") {
                observation = count(r.parameters[0]);
            } else if (r.function === "average") {
                observation = average(r.parameters[0]);
            } else if (r.function === "findMin") {
                observation = findMin(r.parameters[0]);
            } else if (r.function === "findMax") {
                observation = findMax(r.parameters[0]);
            } else if (r.function === "getElement") {
                observation = getElement(r.parameters[0], r.parameters[1]);
            } else if (r.function === "sort") {
                observation = sort(r.parameters[0]);
            } else if (r.function === "sumOfSquares") {
                observation = sumOfSquares(r.parameters[0]);
            } else if (r.function === "add") {
                observation = add(r.parameters[0], r.parameters[1]);
            } else if (r.function === "subtract") {
                observation = subtract(r.parameters[0], r.parameters[1]);
            } else if (r.function === "multiply") {
                observation = multiply(r.parameters[0], r.parameters[1]);
            } else if (r.function === "divide") {
                observation = divide(r.parameters[0], r.parameters[1]);
            } else if (r.function === "power") {
                observation = power(r.parameters[0], r.parameters[1]);
            } else if (r.function === "sqrt") {
                observation = sqrt(r.parameters[0]);
            } else {
                observation = { error: `Unknown function: ${r.function}` };
            }


            // todo: Add observation to the context
            console.log(`\n Observation: ${JSON.stringify(observation)}`);

            messages.push(createMessage("model", response.text));
            messages.push(createMessage("user", `Observation: ${JSON.stringify(observation)}`));

        }
    }

    // TODO: Check if we have a final result
    // If yes, return the result content

    // TODO: Execute any actions
    // Find the action in responses
    // Call the appropriate function:
    //   Array: sum, count, average, findMin, findMax, getElement, sort, sumOfSquares
    //   Math: add, subtract, multiply, divide, power, sqrt
    // Add the observation to messages
    // Continue the loop


    return "Max iterations reached without a final result.";
}

main();

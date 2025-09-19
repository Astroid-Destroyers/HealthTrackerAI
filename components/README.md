# How to Use `openai.ts`

## Step 1: Import the Client

If you are inside a `/pages/{page}/` directory, import the OpenAPI client:

```ts
import { OpenAPIClient } from "../../components/openapi";
```

## Step 2: Using `OpenAPIClient`

Here is an example of how to use the client in a submit handler:

```ts
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setDisplay("");

  let input = question.trim();
  if (jsonOutput) {
    input += " Respond ONLY with valid, readable JSON (no code fences), using clear keys and values.";
  }

  try {
    const result = await OpenAPIClient.ask(input);
    if (result.json !== undefined) {
      setDisplay(JSON.stringify(result.json, null, 2));
    } else {
      setDisplay(result.text ?? "No response");
    }
  } catch (err: any) {
    setDisplay(`Error: ${err?.message ?? "Unknown error"}`);
  } finally {
    setLoading(false);
  }
};
```

## What Makes This Work?

The key line is:

```ts
const result = await OpenAPIClient.ask(input);
```

## Output

The output will be displayed in your UI, either as formatted JSON or plain text, depending on the response.

### Example:

Input:
`this is the input`

Output:
```json
{
  role: 'assistant',
  content: "this is the response",
  refusal: null,
  annotations: []
}
```

For purposes in the the app only we can have it return json format that we can parse for ai responses from user input. 

### Example

Input: `in json format with keys and values return an example address`

Output:
```json
{
  role: 'assistant',
  content: '{\n' +
    '  "street": "123 Main Street",\n' +
    '  "city": "Anytown",\n' +
    '  "state": "CA",\n' +
    '  "zip": "12345"\n' +
    '}',
  refusal: null,
  annotations: []
}
```

Can be parsed into:
```json
{
  "street": "123 Main Street",
  "city": "Anytown",
  "state": "CA",
  "zip": "12345"
}
```
done automatically through the function



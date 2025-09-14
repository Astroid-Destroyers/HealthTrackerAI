import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { useState } from "react";

import { OpenAPIClient } from ".././../components/openapi";

function TestingPage() {
  const [question, setQuestion] = useState("");
  const [display, setDisplay] = useState(""); // what we render
  const [jsonOutput, setJsonOutput] = useState(false);
  const [loading, setLoading] = useState(false);

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
      console.log(result);
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

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-10 md:py-16">
        <Card className="p-6 w-full max-w-2xl">
          <h1 className={title()}>Ask a Question</h1>

          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
            <Input
              label="Your Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              className="w-full"
            />

            <div className="flex items-center gap-2 w-full justify-start">
              <Switch
                checked={jsonOutput}
                id="json-output-toggle"
                onChange={(e) => setJsonOutput(e.target.checked)}
              />
              <label htmlFor="json-output-toggle" className="text-sm">JSON output</label>
            </div>

            <Button type="submit" variant="solid" className="mt-2 w-full" isLoading={loading}>
              {loading ? "Asking..." : "Ask"}
            </Button>
          </form>

          {display && (
            <pre className="mt-4 w-full text-left bg-gray-30 p-4 rounded text-sm overflow-x-auto">
              {display}
            </pre>
          )}
        </Card>
      </section>
    </DefaultLayout>
  );
}

export default TestingPage;

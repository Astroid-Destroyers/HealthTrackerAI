import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
// import Button correctly from '@heroui/button'
import { Button } from '@heroui/button'; // Use named import if Button is a named export
// import Input correctly from '@heroui/input'
import { Input } from '@heroui/input'; // Use named import if Input is a named export
import { Card } from '@heroui/card';
import { Switch } from '@heroui/switch'; // Import HeroUI Switch for toggle
import { useState } from "react";
// make a simple page that has a button in the center
//when the button is pressed it makes a request to /api/hello and displays the response below the button

function TestingPage() {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [jsonOutput, setJsonOutput] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let input = question;
    if (jsonOutput) {
      input += " Make the response a readable json with the result in json format using keys and values.";
    }
    const res = await fetch(`/api/hello?input=${encodeURIComponent(input)}`);
    const data = await res.json();
    setResponse(data.response?.output || data.response || "No response");
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-6 py-10 md:py-16">
        <Card >
          <h1 className={title()}>Ask a Question</h1>
          <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-4">
            <Input
              label="Your Question"
              value={question}
              onChange={e => setQuestion(e.target.value)}
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
            <Button type="submit" variant="solid" className="mt-2 w-full">
              Ask
            </Button>
          </form>
          {/* if response recieved is json format it should be displayed as such */}
          {response && <pre className="mt-4 w-full text-left bg-gray-30 p-4 rounded text-sm overflow-x-auto">{response}</pre>}
        </Card>
      </section>
    </DefaultLayout>
  );
}

export default TestingPage;
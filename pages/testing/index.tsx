import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { useState, useEffect } from "react";

import { collection, addDoc, query, orderBy, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from "../../providers/AuthProvider";

import { db } from "../../lib/firebase";

import { OpenAPIClient } from "../../components/openapi";

function TestingPage() {
  const [question, setQuestion] = useState("");
  const [display, setDisplay] = useState(""); // what we render
  const [jsonOutput, setJsonOutput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedResponses, setSavedResponses] = useState<any[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user) {
      loadSavedResponses().then((unsub) => {
        unsubscribe = unsub;
      });
    } else {
      setSavedResponses([]);
      setShowSaved(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

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

  const saveResponse = async () => {
    if (!user || !display) return;
    
    setSaving(true);
    try {
      await addDoc(collection(db, "user_responses"), {
        userId: user.uid,
        question: question,
        response: display,
        timestamp: new Date(),
        jsonOutput: jsonOutput
      });
      alert("Response saved successfully!");
    } catch (error) {
      console.error("Error saving response:", error);
      alert("Failed to save response");
    } finally {
      setSaving(false);
    }
  };

  const loadSavedResponses = async () => {
    if (!user) return;
    
    try {
      const q = query(collection(db, "user_responses"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const responses: any[] = [];
        querySnapshot.forEach((doc) => {
          if (doc.data().userId === user.uid) {
            responses.push({ id: doc.id, ...doc.data() });
          }
        });
        setSavedResponses(responses);
        setShowSaved(responses.length > 0);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error("Error loading responses:", error);
      setShowSaved(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    try {
      await deleteDoc(doc(db, "user_responses", responseId));
      // Update showSaved state if no responses remain
      const updatedResponses = savedResponses.filter(r => r.id !== responseId);
      setSavedResponses(updatedResponses);
      setShowSaved(updatedResponses.length > 0);
    } catch (error) {
      console.error("Error deleting response:", error);
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
            <div className="mt-4 w-full">
              <div className="flex gap-2 mb-2">
                {user && (
                  <Button 
                    onPress={saveResponse} 
                    variant="flat" 
                    color="success"
                    isLoading={saving}
                    className="text-sm"
                  >
                    {saving ? "Saving..." : "Save Response"}
                  </Button>
                )}
                {user && savedResponses.length > 0 && (
                  <Button 
                    onPress={() => setShowSaved(!showSaved)} 
                    variant="flat" 
                    color="secondary"
                    className="text-sm"
                  >
                    {showSaved ? "Hide Saved Responses" : "Show Saved Responses"}
                  </Button>
                )}
              </div>
              <pre className="w-full text-left bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto border dark:border-gray-700">
                {display}
              </pre>
            </div>
          )}

          {showSaved && savedResponses.length > 0 && (
            <div className="mt-6 w-full">
              <h3 className="text-lg font-semibold mb-4">Saved Responses</h3>
              <div className="space-y-4">
                {savedResponses.map((response) => (
                  <Card key={response.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-600">
                        {new Date(response.timestamp?.toDate?.() || response.timestamp).toLocaleString()}
                      </div>
                      <Button 
                        size="sm" 
                        color="danger" 
                        variant="light"
                        onPress={() => deleteResponse(response.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    <div className="mb-2">
                      <strong>Question:</strong> {response.question}
                    </div>
                    <div>
                      <strong>Response:</strong>
                      <pre className="mt-1 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {response.response}
                      </pre>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
    </DefaultLayout>
  );
}

export default TestingPage;

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Switch } from "@heroui/switch";
import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";

import { useAuth } from "../../providers/AuthProvider";
import { db } from "../../lib/firebase";
import { OpenAPIClient } from "../../components/openapi";

import DefaultLayout from "@/layouts/default";

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
      input +=
        " Respond ONLY with valid, readable JSON (no code fences), using clear keys and values.";
    }

    try {
      const result = await OpenAPIClient.ask(input);

      // Testing API call result
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
        jsonOutput: jsonOutput,
      });
      alert("Response saved successfully!");
    } catch {
      // Error saving response
      alert("Failed to save response");
    } finally {
      setSaving(false);
    }
  };

  const loadSavedResponses = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, "user_responses"),
        orderBy("timestamp", "desc"),
      );
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
    } catch {
      // Error loading responses
      setShowSaved(false);
    }
  };

  const deleteResponse = async (responseId: string) => {
    try {
      await deleteDoc(doc(db, "user_responses", responseId));
      // Update showSaved state if no responses remain
      const updatedResponses = savedResponses.filter(
        (r) => r.id !== responseId,
      );

      setSavedResponses(updatedResponses);
      setShowSaved(updatedResponses.length > 0);
    } catch {
      // Error deleting response
    }
  };

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-8 py-10 md:py-16 px-4">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              AI Testing Lab
            </span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Test our AI capabilities and experiment with different prompts to
            see how our health AI responds.
          </p>
        </div>

        {/* Main Testing Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl w-full max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ai-gradient flex items-center justify-center">
              <span className="text-white font-bold">🧠</span>
            </div>
            <h2 className="text-2xl font-semibold text-white">Ask the AI</h2>
          </div>

          <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-300"
                htmlFor="question-input"
              >
                Your Question
              </label>
              <Input
                required
                className="w-full"
                classNames={{
                  input:
                    "bg-white/5 border-white/10 text-white placeholder-gray-400",
                  inputWrapper:
                    "bg-white/5 border-white/10 hover:bg-white/10 focus-within:bg-white/10",
                }}
                id="question-input"
                placeholder="Ask anything about health, fitness, or wellness..."
                size="lg"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
              <Switch
                classNames={{
                  base: "inline-flex flex-row-reverse w-auto items-center justify-center cursor-pointer gap-2 p-0",
                  wrapper: "p-0 h-6 w-11 overflow-hidden rounded-full bg-gray-600 group-data-[selected=true]:bg-gradient-to-r group-data-[selected=true]:from-purple-500 group-data-[selected=true]:to-indigo-600",
                  thumb: "w-5 h-5 border-0 shadow-lg bg-white rounded-full group-data-[selected=true]:ml-5 transition-all duration-200 ease-out",
                }}
                id="json-output-toggle"
                isSelected={jsonOutput}
                onValueChange={setJsonOutput}
              />
              <div className="flex flex-col">
                <label
                  className="text-sm font-medium text-white cursor-pointer"
                  htmlFor="json-output-toggle"
                >
                  JSON Output Format
                </label>
                <span className="text-xs text-gray-400">
                  Get structured JSON response instead of plain text
                </span>
              </div>
            </div>

            <Button
              className="btn-ai-primary text-white font-semibold py-4 h-14 text-lg"
              isLoading={loading}
              size="lg"
              type="submit"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>🚀</span>
                  Ask AI
                </span>
              )}
            </Button>
          </form>

          {display && (
            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                    ✓
                  </span>
                  AI Response
                </h3>
                <div className="flex gap-2">
                  {user && (
                    <Button
                      className="bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30"
                      isLoading={saving}
                      size="sm"
                      variant="bordered"
                      onPress={saveResponse}
                    >
                      {saving ? "Saving..." : "💾 Save"}
                    </Button>
                  )}
                  {user && savedResponses.length > 0 && (
                    <Button
                      className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30"
                      size="sm"
                      variant="bordered"
                      onPress={() => setShowSaved(!showSaved)}
                    >
                      {showSaved ? "📁 Hide Saved" : "📂 Show Saved"}
                    </Button>
                  )}
                </div>
              </div>
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden">
                <pre className="text-sm text-gray-200 whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed">
                  {display}
                </pre>
              </div>
            </div>
          )}

          {showSaved && savedResponses.length > 0 && (
            <div className="mt-8 space-y-6">
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  📚
                </span>
                Saved Responses ({savedResponses.length})
              </h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedResponses.map((response) => (
                  <div
                    key={response.id}
                    className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span className="w-4 h-4 rounded bg-indigo-500/20 flex items-center justify-center">
                          📅
                        </span>
                        {new Date(
                          response.timestamp?.toDate?.() || response.timestamp,
                        ).toLocaleString()}
                      </div>
                      <Button
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30 min-w-unit-16"
                        size="sm"
                        variant="bordered"
                        onPress={() => deleteResponse(response.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-xs">
                            ❓
                          </span>
                          Question:
                        </div>
                        <p className="text-white bg-white/5 p-3 rounded-xl border border-white/10">
                          {response.question}
                        </p>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          <span className="w-4 h-4 rounded bg-green-500/20 flex items-center justify-center text-xs">
                            🤖
                          </span>
                          Response:
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                          <pre className="text-sm text-gray-200 whitespace-pre-wrap overflow-x-auto font-mono leading-relaxed">
                            {response.response}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 w-full max-w-4xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              💡
            </div>
            <h3 className="text-lg font-semibold text-white">
              Tips for Better Results
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">•</span>
              <span>Be specific about your health goals or concerns</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>Include relevant context (age, activity level, etc.)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>Ask follow-up questions for more detailed advice</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-pink-400 mt-0.5">•</span>
              <span>Use JSON format for structured data responses</span>
            </div>
          </div>
        </div>
      </section>
    </DefaultLayout>
  );
}

export default TestingPage;

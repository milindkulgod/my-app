"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sun, Moon, Clipboard, Check, ChevronDown, ChevronUp } from "lucide-react";

export default function Home() {
  const [inputPayload, setInputPayload] = useState("");
  const [apiResponse, setApiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState(null); // Track expanded history items

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setDarkMode(true);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
  };

  const handleQuery = async () => {
    if (!inputPayload.trim()) {
      setError("Please enter a valid payload.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setApiResponse("");

      const formattedPayload = { content: inputPayload };

      const response = await axios.post("http://127.0.0.1:8000/call-api", formattedPayload, {
        headers: { "Content-Type": "application/json" },
      });

      setApiResponse(response.data);
      setHistory([{ query: inputPayload, response: response.data }, ...history]);
    } catch (error) {
      console.error("API Error:", error);
      setError("Failed to fetch response. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      handleQuery(); // Call API
    }
  };

  const copyResponse = () => {
    navigator.clipboard.writeText(apiResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen p-8 sm:p-20`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">AI Agent</h1>
        <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className="text-blue-600" size={24} />}
        </button>
      </div>

      {/* Query Section */}
      <div className="flex gap-4 items-center w-full max-w-4xl mx-auto">
        {/* Left Input Box */}
        <textarea
          className="w-1/2 p-4 border rounded-lg h-64 resize-none overflow-auto focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Enter payload..."
          value={inputPayload}
          onChange={(e) => setInputPayload(e.target.value)}
          onKeyDown={handleKeyDown} // Listen for Enter key press
        />

        {/* Query Button */}
        <button
          className="px-6 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all duration-200"
          onClick={handleQuery}
          disabled={loading}
        >
          {loading ? "Processing..." : "Query"}
        </button>

        {/* Right Response Box */}
        <div className="relative w-1/2">
          <div className="w-full p-4 border rounded-lg h-64 overflow-auto text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:border-gray-600">
            {apiResponse ? (
              <ReactMarkdown className="prose dark:prose-invert" remarkPlugins={[remarkGfm]}>
                {apiResponse}
              </ReactMarkdown>
            ) : (
              "Response will appear here..."
            )}
          </div>
          {/* Copy Button */}
          {apiResponse && (
            <button
              onClick={copyResponse}
              className="absolute top-2 right-2 bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              {copied ? <Check className="text-green-500" size={20} /> : <Clipboard size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

      {/* Query History */}
      {history.length > 0 && (
        <div className="mt-8 w-full max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-3">Query History</h2>
          <div className="space-y-3">
            {history.map((entry, index) => (
              <div key={index} className="p-4 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <p className="font-medium text-blue-600">Query: {entry.query}</p>
                  <button onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}>
                    {expandedIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </button>
                </div>
                {expandedIndex === index && (
                  <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-auto text-sm">
                    <ReactMarkdown className="prose dark:prose-invert" remarkPlugins={[remarkGfm]}>
                      {entry.response}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-10 text-center text-sm">
        <p>Powered by Next.js & FastAPI | Built with ❤️</p>
      </footer>
    </div>
  );
}

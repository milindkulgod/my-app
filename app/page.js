"use client";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Sun, Moon } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    localStorage.setItem("darkMode", !darkMode);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);
    setInput("");

    // Show "Processing your query" message
    setMessages((prev) => [...prev, { role: "assistant", content: "Processing your query..." }]);

    const response = await fetch("http://0.0.0.0:8000/call-api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: input }),
    });

    if (!response.body) {
      setLoading(false);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botResponse = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      botResponse += chunk;

      setMessages((prev) => {
        return prev.map((msg, index) =>
          index === prev.length - 1 && msg.role === "assistant"
            ? { ...msg, content: botResponse }
            : msg
        );
      });
    }

    setLoading(false);
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"} min-h-screen flex flex-col items-center p-8 sm:p-20`}>
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold">Chatbot</h1>
        <button onClick={toggleDarkMode} className="p-2 rounded-full bg-gray-200 dark:bg-gray-700">
          {darkMode ? <Sun className="text-yellow-400" size={24} /> : <Moon className="text-blue-600" size={24} />}
        </button>
      </div>

      <div className="w-full max-w-4xl flex flex-col space-y-4 p-4 border rounded-lg h-[500px] overflow-y-auto bg-white dark:bg-gray-800">
        {messages.map((msg, index) => (
          <div key={index} className={`p-3 rounded-lg max-w-xs ${msg.role === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-300 text-gray-900 self-start"}`}>
            <ReactMarkdown className="prose dark:prose-invert" remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex w-full max-w-4xl mt-4">
        <input
          type="text"
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className="ml-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-all"
          onClick={handleSend}
          disabled={loading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
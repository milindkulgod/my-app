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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");
    if (savedMode === "true") {
      setDarkMode(true);
    }
  }, []);

  // Handle user scroll event
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    const handleScroll = () => {
      if (!chatContainer) return;
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsUserScrolling(!atBottom);
    };
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (chatContainer) {
        chatContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => {
      const newMode = !prevMode;
      localStorage.setItem("darkMode", newMode);
      return newMode;
    });
  };

  const formatMarkdown = (text) => {
    // Minimal formatting—simply trim the text as the backend returns proper Markdown.
    return text.trim();
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: "user", content: input }]);
    setLoading(true);
    setInput("");
    // Add an empty assistant message for live updates
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const response = await fetch("http://localhost:8000/call-api", {
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
      let chunk = decoder.decode(value, { stream: true });
      // Remove "data: " prefix if present
      chunk = chunk.replace(/^data:\s*/, "").trim();
      if (!chunk) continue;
      botResponse += (botResponse.endsWith(" ") ? "" : " ") + chunk;
      // Remove the processing message text anywhere in the response
      botResponse = botResponse
        .replace(/Processing your request\.*\s*/i, "")
        .trim();
      let formattedResponse = formatMarkdown(botResponse);
      setMessages((prev) => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.content = formattedResponse;
        }
        return updatedMessages;
      });
      if (!isUserScrolling) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    setLoading(false);
  };

  return (
    <div
      className={`transition-all duration-300 ${
        darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"
      } min-h-screen flex flex-col items-center p-8 sm:p-20`}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center w-full max-w-4xl mb-6">
        <h1 className="text-3xl font-bold">TalliteGPT Agent</h1>
        <button
          onClick={toggleDarkMode}
          className={`p-2 rounded-full transition-all duration-300 ${
            darkMode
              ? "bg-gray-700 text-yellow-400"
              : "bg-gray-200 text-blue-600"
          }`}
        >
          {darkMode ? <Sun size={24} /> : <Moon size={24} />}
        </button>
      </div>

      {/* Chat Window */}
      <div
        ref={chatContainerRef}
        className={`w-full max-w-4xl flex flex-col p-4 border rounded-lg h-[500px] overflow-y-auto transition-all duration-300 ${
          darkMode ? "bg-gray-800 text-white" : "bg-white text-black"
        }`}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-8 ${
              msg.role === "user" ? "text-right ml-auto" : "text-left mr-auto"
            }`}
          >
            <i>
              <u>
                <p className="font-bold">
                  {msg.role === "user" ? "Prompt:" : "TalliteGPT Agent:"}
                </p>
              </u>
            </i>
            <ReactMarkdown
              className="prose dark:prose-invert"
              remarkPlugins={[remarkGfm]}
            >
              {msg.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="flex w-full max-w-4xl mt-4">
        <input
          type="text"
          className={`flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 transition-all duration-300 ${
            darkMode
              ? "bg-gray-800 border-gray-600 focus:ring-yellow-400 text-white"
              : "bg-gray-100 border-gray-400 focus:ring-blue-500 text-black"
          }`}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          className={`ml-2 p-3 rounded-lg transition-all duration-300 ${
            darkMode
              ? "bg-yellow-400 text-black hover:bg-yellow-500"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
          onClick={handleSend}
          disabled={loading}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}

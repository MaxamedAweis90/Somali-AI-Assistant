const fs = require('fs');
let code = fs.readFileSync('hooks/use-chat-ui.ts', 'utf8');

const oldStart = `  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);`;

const newStart = `  const sendMessage = useCallback(async (customText?: string | React.MouseEvent, truncateHistoryId?: string) => {
    const actualText = typeof customText === 'string' ? customText : input;
    const text = actualText.trim();
    if (!text || isTyping) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    let baseHistory = messages;
    if (typeof truncateHistoryId === 'string') {
      const idx = messages.findIndex(m => m.id === truncateHistoryId);
      if (idx !== -1) {
         baseHistory = messages.slice(0, Math.max(0, idx));
      }
    }

    const historyForRequest = [...baseHistory, userMessage];
    setMessages(historyForRequest);
    
    if (typeof customText !== 'string') {
      setInput("");
    }
    setIsTyping(true);`;

if (code.includes(oldStart)) {
    code = code.replace(oldStart, newStart);
    code = code.replace('let persistedConversationId = activeConversationId;\n    const historyForRequest = [...messages, userMessage];', 'let persistedConversationId = activeConversationId;');
    fs.writeFileSync('hooks/use-chat-ui.ts', code);
    console.log('SUCCESS');
} else {
    console.log('FAIL');
}

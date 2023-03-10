import { useEffect, useState } from "react";
import { getDabaInstance } from "./daba";
import "./App.css";

const daba = getDabaInstance();

function App() {
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");

  const sub = () => {
    return daba.subscribe("/topic/daba", function (msg) {
      if (msg.body) {
        setMessage(msg.body);
      }
    });
  };
  const unSub = (id: string) => {
    return daba.unsubscribe(id);
  };
  const toggleSub = () => {
    setId(!!id ? unSub(id) : sub());
  };
  useEffect(() => {
    const currentId = sub();
    setId(currentId);
    return () => {
      setId(unSub(currentId));
    };
  }, []);

  return (
    <div className="App">
      <h1>{message ? `current message: ${message}` : "no message received"}</h1>
      <button onClick={toggleSub}>{!!id ? "unsubscribe" : "subscribe"}</button>
    </div>
  );
}

export default App;

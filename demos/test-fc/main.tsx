// @ts-ignore
import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num, setNum] = useState(100);
  return <div onClickCapture={() => setNum(num + 1)}>{num}</div>;
}

function Child() {
  return <span>mini_react</span>;
}

// @ts-ignore
ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

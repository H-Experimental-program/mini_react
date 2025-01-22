import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [num, setNum] = useState(100);
  // @ts-ignore
  return <div onClickCapture={() => setNum(num + 1)}>{num}</div>;
}

function Child() {
  return <span>mini_react</span>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);

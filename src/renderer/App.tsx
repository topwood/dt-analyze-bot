import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';

const { ipcRenderer } = window.electron;

const isValidAddress = (address: string) => {
  if (!address) {
    return false;
  }
  if (!address.startsWith('0x')) {
    return false;
  }
  if (address.length !== 42) {
    return false;
  }
  return true;
};

function Hello() {
  const [date, setDate] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    if (loading) {
      alert('正在加载中，请稍后再试');
      return;
    }
    if (!isValidAddress(address)) {
      alert('您输入的钱包地址不合法');
      return;
    }
    setLoading(true);
    ipcRenderer.sendMessage('get-wallet-age', address);
    ipcRenderer.once('get-wallet-age', (dateStr: any) => {
      setDate(dateStr);
      setLoading(false);
    });
  };

  return (
    <div>
      <h1>输入钱包地址,获取它的年份</h1>
      <input
        placeholder="请输入合法钱包地址"
        value={address}
        onChange={(e) => {
          setAddress(e.target.value);
        }}
      />
      <button type="button" onClick={handleClick}>
        获取钱包的年龄
      </button>
      <p>
        {isValidAddress(address) && (
          <a
            target="_blank"
            href={`https://debank.com/profile/${address}`}
            rel="noreferrer"
          >
            Debank地址
          </a>
        )}
      </p>
      {loading ? '正在加载中...' : ''}
      <p>{date ? `钱包的年龄是${date}` : ''}</p>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}

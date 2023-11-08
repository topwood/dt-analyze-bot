import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import { formatDate, getError, IData, sortDate } from './utils';

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
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IData[]>([]);

  const handleClick = () => {
    if (loading) {
      alert('正在加载中，请稍后再试');
      return;
    }
    const validData = data.filter((item) => !item.error);
    let max = validData.length;
    setShowResult(true);
    setLoading(true);
    validData.forEach((item) => {
      ipcRenderer.sendMessage('get-wallet-age', item.address);
    });
    ipcRenderer.on('get-wallet-age', (dateStr: any) => {
      if (dateStr === 'error') {
        alert('内部错误...请联系开发者');
        setLoading(false);
        setShowResult(false);
        return;
      }
      const [address, age] = dateStr.split('#');
      const d = [...data];
      d.forEach((item) => {
        if (item.address === address) {
          item.age = formatDate(age);
          item.error = getError(age);
        }
      });
      setData(d);

      max -= 1;
      if (max === 0) {
        setLoading(false);
      }
    });
  };

  sortDate(data);
  return (
    <div>
      <h1>输入钱包地址,获取它的年份,目前只支持BSC</h1>
      <textarea
        rows={4}
        style={{ width: '100%' }}
        placeholder="请输入合法钱包地址，多个换行"
        onChange={(e) => {
          setShowResult(false);
          const { value } = e.target;
          if (!value) {
            return;
          }
          const addresses = value.split('\n');
          const d: IData[] = [];
          addresses.forEach((item) => {
            const a = item.trim();
            if (isValidAddress(a)) {
              d.push({
                address: a,
              });
            } else {
              d.push({
                address: a,
                error: '非法地址',
              });
            }
          });
          setData(d);
        }}
      />
      <button type="button" onClick={handleClick}>
        获取钱包的年龄
      </button>
      {loading ? '正在加载中...' : ''}
      {showResult && (
        <p>
          {data.map((item) => {
            if (item.error) {
              return (
                <div style={{ color: 'yellow' }}>{`钱包 ${item.address} ${
                  item.error || '是非法钱包地址'
                } `}</div>
              );
            }
            return (
              <div>{`钱包 ${item.address} 的年龄是 ${item.age || '...'}`}</div>
            );
          })}
        </p>
      )}
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

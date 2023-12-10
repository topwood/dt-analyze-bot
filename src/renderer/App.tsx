import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme, Alert, Progress } from 'antd';
import './App.css';
import { useEffect, useState } from 'react';
import Layout from './Layout';
import WalletAge from './WalletAge';
import Contract from './Contract';
import Rat from './Rat';

const { ipcRenderer } = window.electron;

export default function App() {
  const [percent, setPercent] = useState(2);
  const [error, setError] = useState('');

  useEffect(() => {
    // 你可以在 useEffect，或者 componentDidMount 中添加这些事件监听
    ipcRenderer.on('update_available', (info: any) => {
      alert(`发现更新，版本${info?.version}`);
      // notify user that the update is available
    });
    ipcRenderer.on('update_downloaded', () => {
      alert('下载完成开始安装，请稍后重启');
    });
    ipcRenderer.on('download_progress', (per: any) => {
      setPercent(Number(per));
    });
    ipcRenderer.on('error', (msg: any) => {
      setError(msg);
    });
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm],
      }}
    >
      {!error && percent > 0 && (
        <Alert
          message="正在更新"
          style={{ borderRadius: 0 }}
          description={<Progress percent={percent} />}
          type="info"
        />
      )}
      <Router>
        <Layout>
          <Routes>
            <Route path="/contract" element={<Contract />} />
            <Route path="/rat" element={<Rat />} />
            <Route path="/" element={<WalletAge />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

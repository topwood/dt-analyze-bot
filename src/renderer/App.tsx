import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import './App.css';
import Layout from './Layout';
import WalletAge from './WalletAge';
import Contract from './Contract';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: [theme.darkAlgorithm],
      }}
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/contract" element={<Contract />} />
            <Route path="/" element={<WalletAge />} />
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

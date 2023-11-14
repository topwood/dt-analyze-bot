import React from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header, Content, Footer } = Layout;

const App: React.FC<any> = ({ children }) => {
  const navigate = useNavigate();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          // position: 'sticky',
          top: 0,
          zIndex: 1,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={[
            {
              key: '1',
              label: '批量分析钱包年龄',
              onClick: () => {
                navigate('/');
              },
            },
            {
              key: '2',
              label: '分析合约持仓钱包年龄',
              onClick: () => {
                navigate('/contract');
              },
            },
            {
              key: '3',
              label: '自动分析老鼠仓',
              disabled: true,
              onClick: () => {
                navigate('/rat');
              },
            },
            {
              key: '4',
              label: '一键监控【付费】',
              disabled: true,
              onClick: () => {
                navigate('/contract');
              },
            },
            {
              key: '5',
              label: '一键跟单【付费】',
              disabled: true,
              onClick: () => {
                navigate('/contract');
              },
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px' }}>{children}</Content>
      <Footer style={{ textAlign: 'center' }}>Design By DT Group.</Footer>
    </Layout>
  );
};

export default App;

import React from 'react';
import { Layout, Menu } from 'antd';
import WalletAge from './WalletAge';

const { Header, Content, Footer } = Layout;

const App: React.FC<any> = () => {
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
              label: '批量获取钱包年龄',
            },
          ]}
        />
      </Header>
      <Content style={{ padding: '24px' }}>
        <WalletAge />
      </Content>
      <Footer style={{ textAlign: 'center' }}>Design By DT Group.</Footer>
    </Layout>
  );
};

export default App;

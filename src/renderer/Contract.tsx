import { useState, useRef, useEffect } from 'react';
import { Button, Card, Input, Radio } from 'antd';
import {
  formatDate,
  getError,
  groupArrayElements,
  IData,
  sortDate,
} from './utils';
import WalletAgeResult from './WalletAgeResult';
import WalletAgeProgress from './WalletAgeProgress';

const { ipcRenderer } = window.electron;
const { TextArea } = Input;

// 校验地址合法性
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

// 批量获取钱包的年龄
export default function Content() {
  const [chain, setChain] = useState('eth');
  const [inputValue, setInputValue] = useState('');
  const [percent, setPercent] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleReset = () => {
    setPercent(0);
    setShowResult(false);
    setInputValue('');
  };

  const handleInput = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleClick = () => {
    setShowResult(true);
    ipcRenderer.sendMessage('analyze-contract', inputValue);
  };

  useEffect(() => {
    // @ts-ignore
    ipcRenderer.on('analyze-contract', (str: string) => {
      console.log('收到消息...', str);
    });
  }, []);

  return (
    <Card
      title="输入合约地址进行分析"
      extra={
        <Radio.Group
          value={chain}
          onChange={(e) => {
            setChain(e.target.value);
          }}
        >
          <Radio.Button value="eth">以太坊链</Radio.Button>
          {/* <Radio.Button value="bsc">币安链</Radio.Button> */}
        </Radio.Group>
      }
    >
      <Input
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="请输入合约地址"
        value={inputValue}
        onChange={handleInput}
      />
      <Button type="primary" onClick={handleClick} loading={loading}>
        一键分析合约
      </Button>
      <Button
        style={{ marginLeft: 12 }}
        onClick={handleReset}
        disabled={loading}
      >
        清空
      </Button>
      {showResult && <div style={{ marginTop: 24 }}>xxxxxx</div>}
    </Card>
  );
}

import { useState } from 'react';
import { Button, Card, Input, Radio } from 'antd';
import { Chain } from './utils';
import WalletAgeResult from './WalletAgeResult';
import WalletAgeProgress from './WalletAgeProgress';
import useContract from './hooks/useContract';

export default function Rat() {
  const [chain, setChain] = useState<Chain>('eth');
  const [inputValue, setInputValue] = useState('');
  const [contract, setContract] = useState('');

  const { showResult, loading, result, percent, clear } = useContract(
    contract,
    chain,
  );

  const handleReset = () => {
    setInputValue('');
    clear();
  };

  const handleInput = (e: any) => {
    setInputValue(e.target.value);
  };

  const handleClick = () => {
    setContract(inputValue);
  };

  return (
    <Card
      title="输入合约地址，一键分析合约可疑老鼠仓钱包"
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
        一键分析老鼠仓钱包
      </Button>
      <Button
        style={{ marginLeft: 12 }}
        onClick={handleReset}
        disabled={loading}
      >
        清空
      </Button>
      {showResult && (
        <div style={{ marginTop: 24 }}>
          <WalletAgeProgress percent={percent} />
          <WalletAgeResult data={result} />
        </div>
      )}
    </Card>
  );
}

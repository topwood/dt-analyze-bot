import { useState } from 'react';
import { Button, Card, Input, Radio } from 'antd';
import { Chain, IData } from './utils';
import WalletAgeResult from './WalletAgeResult';
import WalletAgeProgress from './WalletAgeProgress';
import useWalletAge from './hooks/useWalletAge';

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
  const [data, setData] = useState<IData[]>([]);
  const [chain, setChain] = useState<Chain>('eth');
  const [inputValue, setInputValue] = useState('');

  const handleInput = (e: any) => {
    setInputValue(e.target.value);
  };

  const { loading, result, percent, showResult, clear } = useWalletAge(
    data,
    chain,
  );
  const handleReset = () => {
    setData([]);
    setInputValue('');
    clear();
  };

  const handleClick = () => {
    if (loading) {
      alert('正在加载中，请稍后再试');
      return;
    }
    if (!inputValue) {
      return;
    }
    const addresses = inputValue.split('\n');
    const d: IData[] = [];
    addresses.forEach((item: any) => {
      const a = item.trim();
      if (isValidAddress(a)) {
        d.push({
          address: a,
        });
      } else {
        d.push({
          address: a,
          error: '是非法地址',
        });
      }
    });
    setData(d);
  };

  return (
    <Card
      title="批量输入钱包地址,获取它们的年份"
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
      <TextArea
        rows={16}
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="请输入合法钱包地址，多个换行"
        value={inputValue}
        onChange={handleInput}
      />
      <Button type="primary" onClick={handleClick} loading={loading}>
        一键获取钱包的年龄
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

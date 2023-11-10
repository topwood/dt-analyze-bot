import { useState } from 'react';

import { Button, Card, Input, Radio } from 'antd';
import { formatDate, getError, IData, sortDate } from './utils';

const { ipcRenderer } = window.electron;
const { TextArea } = Input;

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

export default function Content() {
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IData[]>([]);
  const [chain, setChain] = useState('eth');

  const handleClick = () => {
    if (loading) {
      alert('正在加载中，请稍后再试');
      return;
    }
    const validData = data.filter((item) => !item.error);
    let max = validData.length;
    setShowResult(true);
    if (max <= 0) {
      return;
    }
    setLoading(true);
    validData.forEach((item) => {
      ipcRenderer.sendMessage('get-wallet-age', item.address, chain);
    });
    // @ts-ignore
    ipcRenderer.on('get-wallet-age', (dateStr: string) => {
      if (dateStr.startsWith('error')) {
        alert(`内部错误...${dateStr}`);
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
          <Radio.Button value="bsc">币安链</Radio.Button>
        </Radio.Group>
      }
    >
      <TextArea
        rows={20}
        style={{ width: '100%', marginBottom: 12 }}
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
                error: '是非法地址',
              });
            }
          });
          setData(d);
        }}
      />
      <Button type="primary" onClick={handleClick} loading={loading}>
        一键获取钱包的年龄
      </Button>
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
    </Card>
  );
}
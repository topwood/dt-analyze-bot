import { useState, useRef } from 'react';
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
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<IData[]>([]);
  const [chain, setChain] = useState('eth');
  const [inputValue, setInputValue] = useState('');
  const maxCount = useRef(0);
  const [percent, setPercent] = useState(0);

  const handleReset = () => {
    setShowResult(false);
    setData([]);
    setInputValue('');
    setPercent(0);
    maxCount.current = 0;
  };

  const handleInput = (e: any) => {
    setInputValue(e.target.value);
    setData([]);
    setShowResult(false);
    const { value } = e.target;
    if (!value) {
      return;
    }
    const addresses = value.split('\n');
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

  const handleClick = () => {
    if (loading) {
      alert('正在加载中，请稍后再试');
      return;
    }
    setPercent(0);
    const validData = data.filter((item) => !item.error);
    let max = validData.length;
    setShowResult(true);
    maxCount.current = max;
    // 全部非法的直接返回了
    if (max <= 0) {
      return;
    }
    const { groups, loopCounts, batches } = groupArrayElements(validData, 10);

    setLoading(true);

    // 当前批次的数量
    let currentBacthCount = batches[0];
    // 当前游标
    let currentCursor = 0;
    // 上一次游标
    let lastCursor = -1;

    // 轮询是否一批结束了，一批结束了可以请求下一批
    const interval = setInterval(() => {
      // 说明一批请求完了
      if (currentCursor > lastCursor && currentCursor < loopCounts) {
        lastCursor = currentCursor;
        currentBacthCount = batches[currentCursor];
        groups[currentCursor].forEach((item) => {
          ipcRenderer.sendMessage('get-wallet-age', item.address, chain);
        });
      } else if (currentCursor >= loopCounts) {
        // 结束轮询
        clearInterval(interval);
      }
    }, 500);

    // @ts-ignore
    ipcRenderer.on('get-wallet-age', (dateStr: string) => {
      if (dateStr.startsWith('error')) {
        console.log(`内部错误...${dateStr}`);
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

      currentBacthCount -= 1;
      if (currentBacthCount === 0) {
        currentCursor += 1;
      }
      max -= 1;
      setPercent(((maxCount.current - max) / maxCount.current) * 100);
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
          <WalletAgeResult data={data} />
        </div>
      )}
    </Card>
  );
}

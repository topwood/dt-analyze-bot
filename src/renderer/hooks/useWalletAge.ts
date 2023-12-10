import { useState, useRef, useEffect } from 'react';
import {
  IData,
  groupArrayElements,
  Chain,
  formatDate,
  getError,
} from '../utils';
const { ipcRenderer } = window.electron;

export default (data: IData[], chain: Chain) => {
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState<IData[]>([]);
  const maxCount = useRef(data.length);
  const maxCountCursor = useRef(data.length);
  const { groups, loopCounts, batches } = groupArrayElements(data, 8);

  const unBind = useRef<Function | null>(null);

  // 当前批次的数量
  const currentBacthCount = useRef(batches[0]);
  // 当前游标
  const currentCursor = useRef(0);
  // 上一次游标
  const lastCursor = useRef(-1);

  const clear = () => {
    setResult([]);
    setPercent(0);
    setShowResult(false);
    currentCursor.current = 0;
    lastCursor.current = -1;
  };

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    clear();
    maxCountCursor.current = data.length;
    maxCount.current = data.length;
    currentBacthCount.current = batches[0];
    setShowResult(true);
    setLoading(true);
    // 轮询是否一批结束了，一批结束了可以请求下一批
    const interval = setInterval(() => {
      // 说明一批请求完了
      if (
        currentCursor.current > lastCursor.current &&
        currentCursor.current < loopCounts
      ) {
        lastCursor.current = currentCursor.current;
        currentBacthCount.current = batches[currentCursor.current];
        groups[currentCursor.current].forEach((item) => {
          console.log('发起请求钱包年龄...', item.address);
          ipcRenderer.sendMessage('get-wallet-age', item.address, chain);
        });
      } else if (currentCursor.current >= loopCounts) {
        // 结束轮询
        clearInterval(interval);
        // setLoading(false);
      }
    }, 300);
  }, [data]);

  useEffect(() => {
    if (data.length === 0) {
      return;
    }
    if (unBind.current) {
      unBind.current();
    }
    // @ts-ignore
    unBind.current = ipcRenderer.on('get-wallet-age', (dateStr: string) => {
      console.log('收到消息', dateStr);
      if (dateStr.startsWith('error')) {
        alert(`内部错误...${dateStr}`);
        setLoading(false);
        return;
      }
      const [address, age, value, ethValue, txs] = dateStr.split('#');
      const d = [...data];
      d.forEach((item) => {
        if (item.address === address) {
          const [last, first] = age.split('|');
          item.first = formatDate(first);
          item.last = formatDate(last);
          item.error = getError(age);
          item.value = value;
          item.ethValue = ethValue;
          item.txs = txs;
        }
      });
      setResult(d);

      currentBacthCount.current -= 1;
      if (currentBacthCount.current === 0) {
        currentCursor.current += 1;
      }
      maxCountCursor.current -= 1;
      setPercent(
        ((maxCount.current - maxCountCursor.current) / maxCount.current) * 100,
      );
      if (maxCountCursor.current === 0) {
        setLoading(false);
      }
    });
  }, [data]);

  return {
    loading,
    result,
    percent,
    showResult,
    clear,
  };
};

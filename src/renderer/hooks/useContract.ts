import { useState, useRef, useEffect } from 'react';
import { IData, Chain, isValidAddress } from '../utils';
import useWalletAge from './useWalletAge';
const { ipcRenderer } = window.electron;

export default (contract: string, chain: Chain) => {
  const [data, setData] = useState<IData[]>([]);
  const [loading, setLoading] = useState(false);
  const unBind = useRef<Function | null>(null);

  useEffect(() => {
    if (!contract) {
      return;
    }
    if (!isValidAddress(contract)) {
      alert('请输入正确的合约地址');
      return;
    }
    setLoading(true);
    ipcRenderer.sendMessage('analyze-contract', contract, chain);
  }, [contract]);

  useEffect(() => {
    if (!isValidAddress(contract)) {
      return;
    }
    if (unBind.current) {
      unBind.current();
    }
    // @ts-ignore
    unBind.current = ipcRenderer.on('analyze-contract', (message: string) => {
      setLoading(false);
      console.log('收到数据 analyze-contract...', message);
      if (!Array.isArray(message) || message.length === 0) {
        alert('该合约地址存在问题或者还未收录数据');
        return;
      }
      setData(
        message.map((item) => ({
          address: item,
        })),
      );
    });
  }, [contract]);

  const rest = useWalletAge(data, 'eth');

  return {
    ...rest,
    loading: loading || rest.loading,
  };
};

import dayjs from 'dayjs';

export interface IData {
  address?: string;
  /**
   * 首次交易时间
   */
  first?: string;
  /**
   * 最近交易时间
   */
  last?: string;
  error?: string;
  /**
   * 价值
   */
  value?: string;
}

export const getError = (str?: string) => {
  if (!str) {
    return '-';
  }
  if (str === 'null') {
    return '没有交易记录';
  }
  if (str === 'contract') {
    return '地址是合约';
  }
  if (str === 'timeout') {
    return '获取数据超时，请尝试使用或更换代理';
  }
  return;
};

export const formatDate = (str?: string) => {
  if (!str) {
    return getError(str);
  }
  if (getError(str)) {
    return getError(str);
  }

  const regex =
    /from (?:(\d+)? day?s?)? ?(?:(\d+)? hr?s?)? ?(?:(\d+)? min?s?)? ago/;
  const match = str.match(regex);

  if (match) {
    let days = parseInt(match[1], 10) || 0;
    let hours = parseInt(match[2], 10) || 0;
    let minutes = parseInt(match[3], 10) || 0;

    let dt = new Date();
    dt.setDate(dt.getDate() - days);
    dt.setHours(dt.getHours() - hours);
    dt.setMinutes(dt.getMinutes() - minutes);
    return dayjs(dt).format('YYYY-MM-DD HH:mm:ss');
  }
  return '-';
};

export const sortDate = (arr: IData[]) => {
  // let arr = [
  //   { age: '2020-01-01 01:30:40' },
  //   { age: '2019-12-31 09:10:25' },
  //   { age: '2021-05-20 10:10:10' },
  //   // 其他对象...
  // ];
  return arr.sort(function (a: IData, b: IData) {
    let dateA = new Date(a.error ? 0 : a.first || 0),
      dateB = new Date(b.error ? 0 : b.first || 0);
    // @ts-ignore
    return dateA - dateB; // 用dateA - dateB 是升序。如果你要降序的话，只要改成 dateB - dateA 即可。
  });
};

export function groupArrayElements(array: any[], groupSize: number = 30) {
  let groups = [];
  const batches = [];

  for (let i = 0; i < array.length; i += groupSize) {
    groups.push(array.slice(i, i + groupSize));
  }

  const loopCounts = groups.length;

  for (let i = 0; i < groups.length; i++) {
    batches.push(groups[i].length);
  }

  return {
    groups,
    loopCounts,
    batches,
  };
}

export function dateCheck(date: string = '', max: number) {
  if (!date) {
    return false;
  }
  const now = dayjs();
  const targetDate = dayjs(date);
  const diffInMonths = now.diff(targetDate, 'month');
  if (diffInMonths >= max) {
    return true;
  }
  return false;
}

type chain = 'eth' | 'bsc';

const chainBroswerMap = {
  eth: 'https://etherscan.io/address/{{address}}',
  bsc: 'https://bscscan.com/address/{{address}}',
};

export function getWallet(address: string, chain: chain = 'eth') {
  return chainBroswerMap[chain].replace('{{address}}', address);
}

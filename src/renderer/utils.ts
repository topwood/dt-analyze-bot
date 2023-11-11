export interface IData {
  address?: string;
  age?: string;
  error?: string;
}

export const getError = (str?: string) => {
  if (!str) {
    return '地址可能出错';
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
  // 输入的字符串
  // let str = "from 711 days 8 hrs ago";

  // 从字符串中提取天和小时
  let days = parseInt(str.split(' ')[1]);
  let hours = parseInt(str.split(' ')[3]);

  // 计算总毫秒数
  let millisecs = days * 24 * 60 * 60 * 1000 + hours * 60 * 60 * 1000;

  // 获取当前时间
  let now = new Date();

  // 从当前时间中减去提取出的时间
  let pastDate = new Date(now.getTime() - millisecs);

  // 提取年月日时分秒
  let year = pastDate.getFullYear();
  let month = ('0' + (pastDate.getMonth() + 1)).slice(-2); // 因为月份是从0开始的，所以需要加一
  let date = ('0' + pastDate.getDate()).slice(-2);
  let hrs = ('0' + pastDate.getHours()).slice(-2);
  let mins = ('0' + pastDate.getMinutes()).slice(-2);
  let secs = ('0' + pastDate.getSeconds()).slice(-2);

  // 组合成 "YYYY-MM-MM HH:mm:ss" 格式
  let formattedDate = `${year}-${month}-${date} ${hrs}:${mins}:${secs}`;

  return formattedDate;
};

export const sortDate = (arr: IData[]) => {
  // let arr = [
  //   { age: '2020-01-01 01:30:40' },
  //   { age: '2019-12-31 09:10:25' },
  //   { age: '2021-05-20 10:10:10' },
  //   // 其他对象...
  // ];
  return arr.sort(function (a: IData, b: IData) {
    let dateA = new Date(a.error ? 0 : a.age || 0),
      dateB = new Date(b.error ? 0 : b.age || 0);
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

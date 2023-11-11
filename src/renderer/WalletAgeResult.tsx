import { Table, Tabs } from 'antd';
import { memo } from 'react';
import dayjs from 'dayjs';
import { IData, dateCheck, getWallet } from './utils';

const renderAddress = (item: IData) => {
  if (item.error) {
    return (
      <div style={{ color: 'yellow' }}>{`钱包 ${item.address} ${
        item.error || '是非法钱包地址'
      } `}</div>
    );
  }
  return <div>{`钱包 ${item.address} 的年龄是 ${item.first || '...'}`}</div>;
};

const renderTable = (data: IData[]) => {
  return (
    <Table
      size="small"
      style={{ width: '100%' }}
      dataSource={data}
      columns={[
        {
          dataIndex: 'address',
          title: '钱包地址',
          width: 300,
          render: (value) => (
            <a href={getWallet(value)} target="_blank" rel="noreferrer">
              {value}
            </a>
          ),
        },
        {
          dataIndex: 'first',
          title: '首次交易时间',
          sorter: (a, b) => dayjs(a.first).valueOf() - dayjs(b.first).valueOf(),
        },
        {
          dataIndex: 'last',
          title: '最近交易时间',
          sorter: (a, b) => dayjs(a.last).valueOf() - dayjs(b.last).valueOf(),
        },
        {
          dataIndex: 'value',
          title: '价值',
          render: (value) => {
            if (!value) return '-';
            return `$${Number(value).toFixed(2)}`;
          },
          defaultSortOrder: 'descend',
          sorter: (a, b) => {
            if (!a.value || !b.value) {
              return 1;
            }
            if (+a.value > +b.value) {
              return 1;
            }
            return -1;
          },
        },
      ]}
    />
  );
};

export default memo(({ data }: { data: IData[] }) => {
  const origin = <p>{data.map(renderAddress)}</p>;
  const dataError: IData[] = [];
  const data1: IData[] = [];
  const data2: IData[] = [];
  const data3: IData[] = [];
  const data4: IData[] = [];
  const dataNoTx: IData[] = [];
  const dataContract: IData[] = [];

  data.forEach((item) => {
    if (item.error) {
      if (item.error === '没有交易记录') {
        dataNoTx.push(item);
      } else if (item.error === '地址是合约') dataContract.push(item);
      else dataError.push(item);
    } else if (dateCheck(item.first, 6)) {
      data4.push(item);
    } else if (dateCheck(item.first, 3)) {
      data3.push(item);
    } else if (dateCheck(item.first, 1)) {
      data2.push(item);
    } else if (item.first) {
      data1.push(item);
    }
  });
  const analyze = (
    <Tabs
      // style={{ width: '70%' }}
      tabPosition="left"
      items={[
        {
          key: '1',
          label: `1个月以内(${data1.length})`,
          children: renderTable(data1),
        },
        {
          key: '3',
          label: `1-3个月(${data2.length})`,
          children: renderTable(data2),
        },
        {
          key: '6',
          label: `3-6个月(${data3.length})`,
          children: renderTable(data3),
        },
        {
          key: '6+',
          label: `6个月以上(${data4.length})`,
          children: renderTable(data4),
        },
        {
          key: 'noTx',
          label: `没有交易记录(${dataNoTx.length})`,
          children: dataNoTx.map(renderAddress),
        },
        {
          key: 'contract',
          label: `合约地址(${dataContract.length})`,
          children: dataContract.map(renderAddress),
        },
        {
          key: 'error',
          label: `出错(${dataError.length})`,
          children: dataError.map(renderAddress),
        },
      ]}
    />
  );

  return (
    <Tabs
      style={{ marginTop: 12 }}
      items={[
        { key: 'orginData', label: '原始数据', children: origin },
        {
          key: 'analysis',
          label: '数据分析',
          children: analyze,
        },
      ]}
    />
  );
});

import { Tabs } from 'antd';
import { memo } from 'react';
import { IData, dateCheck } from './utils';

const renderAddress = (item: IData) => {
  if (item.error) {
    return (
      <div style={{ color: 'yellow' }}>{`钱包 ${item.address} ${
        item.error || '是非法钱包地址'
      } `}</div>
    );
  }
  return <div>{`钱包 ${item.address} 的年龄是 ${item.age || '...'}`}</div>;
};

export default memo(({ data }: { data: IData[] }) => {
  const origin = <p>{data.map(renderAddress)}</p>;
  const dataError: IData[] = [];
  const data1: IData[] = [];
  const data2: IData[] = [];
  const data3: IData[] = [];
  const data4: IData[] = [];

  data.forEach((item) => {
    if (item.error) {
      dataError.push(item);
    } else if (dateCheck(item.age, 6)) {
      data4.push(item);
    } else if (dateCheck(item.age, 3)) {
      data3.push(item);
    } else if (dateCheck(item.age, 1)) {
      data2.push(item);
    } else if (item.age) {
      data1.push(item);
    }
  });
  const analyze = (
    <div style={{ display: 'flex' }}>
      <Tabs
        // style={{ width: '70%' }}
        tabPosition="left"
        items={[
          {
            key: '1',
            label: `1个月以内(${data1.length})`,
            children: data1.map(renderAddress),
          },
          {
            key: '3',
            label: `1-3个月(${data2.length})`,
            children: data2.map(renderAddress),
          },
          {
            key: '6',
            label: `3-6个月(${data3.length})`,
            children: data3.map(renderAddress),
          },
          {
            key: '6+',
            label: `6个月以上(${data4.length})`,
            children: data4.map(renderAddress),
          },
          {
            key: 'error',
            label: `出错(${dataError.length})`,
            children: dataError.map(renderAddress),
          },
        ]}
      />
    </div>
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

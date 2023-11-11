import { Progress } from 'antd';
import { memo } from 'react';

export default memo(({ percent }: { percent: number }) => {
  return (
    <Progress
      percent={percent}
      format={(p: number | undefined) => (p ? `${p.toFixed(0)}%` : '')}
    />
  );
});

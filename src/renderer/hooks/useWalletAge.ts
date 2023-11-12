import { useState, useRef } from 'react';
import { IData } from '../utils';

export default (data: IData[]) => {
  const [loading, setLoading] = useState(false);
  const maxCount = useRef(data.length);

  return {
    loading,
  };
};

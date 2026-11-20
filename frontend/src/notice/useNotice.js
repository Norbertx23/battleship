import { useContext } from 'react';
import { NoticeContext } from './context';

export const useNotice = () => useContext(NoticeContext);

import React, { useRef, useEffect, useState } from 'react';
import { useAppSelector } from '@/hooks/useRedux';
import styles from './CardGrid.module.css';

interface CardGridProps {
  children: React.ReactNode;
}

const CardGrid: React.FC<CardGridProps> = ({ children }) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const activeCardId = useAppSelector((state) => state.card.activeCardId);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (gridRef.current && activeCardId) {
      const activeCard = gridRef.current.querySelector(`[data-id="${activeCardId}"]`);
      setIsActive(!!activeCard);
    } else {
      setIsActive(false);
    }
  }, [activeCardId]);

  return (
    <section 
      ref={gridRef}
      className={`${styles.cardGrid} ${isActive ? styles.active : ''}`}
    >
      {children}
    </section>
  );
};

export default CardGrid;
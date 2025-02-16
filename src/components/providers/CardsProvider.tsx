'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/useRedux';
import { setCards } from '@/redux/cardSlice';
import cardsData from '../../../public/data/cards.json';

export function GlobalDataProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const cardsList = cardsData.map(card => ({
      id: card.id,
      name: card.name,
      number: card.number,
      set: card.set,
      types: card.types || [],
      subtypes: card.subtypes || [],
      supertype: card.supertype,
      rarity: card.rarity,
      img: card.images.large
    }));
    dispatch(setCards(cardsList));
  }, [dispatch]);

  return <>{children}</>;
}
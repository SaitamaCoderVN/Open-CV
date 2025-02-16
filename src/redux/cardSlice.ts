import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Card {
  id: string;
  name: string;
  number: string;
  set: string;
  types: string[];
  subtypes: string[];
  supertype: string;
  rarity: string;
  img: string;
}

interface CardState {
  activeCardId: string | null;
  cards: Card[];
}

const initialState: CardState = {
  activeCardId: null,
  cards: [],
};

const cardSlice = createSlice({
  name: 'card',
  initialState,
  reducers: {
    setActiveCard: (state, action: PayloadAction<string | null>) => {
      state.activeCardId = action.payload;
    },
    setCards: (state, action: PayloadAction<Card[]>) => {
      state.cards = action.payload;
    },
  },
});

export const { setActiveCard, setCards } = cardSlice.actions;
export default cardSlice.reducer;
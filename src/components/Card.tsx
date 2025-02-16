import React, { useMemo,useState, useEffect, useRef, useCallback } from 'react';
import { useSpring, animated } from 'react-spring';
import { clamp, round, adjust } from './helper/Math';
import { useAppSelector, useAppDispatch } from '../hooks/useRedux';
import { setActiveCard } from '@/redux/cardSlice';
import { resetBaseOrientation } from '@/redux/orientationSlice';
import Image from 'next/image';

interface CardProps {
  id: string;
  name: string;
  number: string;
  set: string;
  types: string[];
  subtypes: string[];
  supertype: string;
  rarity: string;
  img: string;
  back?: string;
  foil?: string;
  mask?: string;
  showcase?: boolean;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({
  id,
  name,
  number,
  set,
  types,
  subtypes,
  supertype,
  rarity,
  img,
  back = "https://res.cloudinary.com/dg4wrriuq/image/upload/v1729532994/Poster_A_wi1te8.png",
  foil,
  mask,
  showcase = false,
  style,
}) => {

// console log all props in table
// console.table({id, name, number, set, types, subtypes, supertype, rarity, img, back, foil, mask, showcase});

  const dispatch = useAppDispatch();
  const activeCardId = useAppSelector((state) => state.card.activeCardId);
  const orientation = useAppSelector((state) => state.orientation);
  const [foilStyles, setFoilStyles] = useState('');
  const [staticStyles, setStaticStyles] = useState('');
  const [active, setActive] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [firstPop, setFirstPop] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [repositionTimer, setRepositionTimer] = useState<NodeJS.Timeout | null>(null);
  const [springRotate, setSpringRotate] = useSpring(() => ({ x: 0, y: 0 }));
  const [springGlare, setSpringGlare] = useSpring(() => ({ x: 50, y: 50, o: 0 }));
  const [springBackground, setSpringBackground] = useSpring(() => ({ x: 50, y: 50 }));
  const [springRotateDelta, setSpringRotateDelta] = useSpring(() => ({ x: 0, y: 0 }));
  const [springTranslate, setSpringTranslate] = useSpring(() => ({ x: 0, y: 0 }));
  const [springScale, setSpringScale] = useSpring(() => ({ scale: 1 }));

  const [initialDelta, setInitialDelta] = useState({ x: 0, y: 0 });
  const [scrollOffset, setScrollOffset] = useState(0);


  const setDefaultCSSVariables = () => {
    if (cardRef.current) {
      cardRef.current.style.setProperty('--pointer-x', '50%');
      cardRef.current.style.setProperty('--pointer-y', '50%');
      cardRef.current.style.setProperty('--pointer-from-center', '0');
      cardRef.current.style.setProperty('--card-opacity', '0');
      cardRef.current.style.setProperty('--pointer-from-left', '0.5');
      cardRef.current.style.setProperty('--pointer-from-top', '0.5');
      cardRef.current.style.setProperty('--card-scale', '1');
    }
  };
  useEffect(() => {
    setDefaultCSSVariables();
  }, []);
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const interact = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isVisible || (activeCardId && activeCardId !== id)) {
        setInteracting(false);
        return;
      }

    setInteracting(true);

    const rect = cardRef.current!.getBoundingClientRect();
    const absolute = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const percent = {
      x: clamp(round((100 / rect.width) * absolute.x)),
      y: clamp(round((100 / rect.height) * absolute.y)),
    };
    const center = {
      x: percent.x - 50,
      y: percent.y - 50,
    };

    setSpringBackground({
      x: adjust(percent.x, 0, 100, 37, 63),
      y: adjust(percent.y, 0, 100, 33, 67),
    });
    setSpringRotate({
      x: round(-(center.x / 3.5)),
      y: round(center.y / 2),
    });
    setSpringGlare({
      x: round(percent.x),
      y: round(percent.y),
      o: 1,
    });
    if (cardRef.current) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const pointerFromCenterX = Math.abs(absolute.x - centerX) / centerX;
        const pointerFromCenterY = Math.abs(absolute.y - centerY) / centerY;
        const pointerFromCenter = Math.sqrt(pointerFromCenterX ** 2 + pointerFromCenterY ** 2);
    
        cardRef.current.style.setProperty('--pointer-x', `${percent.x}%`);
        cardRef.current.style.setProperty('--pointer-y', `${percent.y}%`);
        cardRef.current.style.setProperty('--pointer-from-center', pointerFromCenter.toString());
        cardRef.current.style.setProperty('--card-opacity', '1');
      }
  };

  const interactEnd = (delay = 500) => {
    setTimeout(() => {
        setInteracting(false);
        setSpringRotate({ x: 0, y: 0 });
        setSpringGlare({ x: 50, y: 50, o: 0 });
        setSpringBackground({ x: 50, y: 50 });
        if (cardRef.current) {
          cardRef.current.style.setProperty('--pointer-from-center', '0');
          cardRef.current.style.setProperty('--card-opacity', '0');
        }
        
      }, delay);
  };

  const activate = () => {
    if (activeCardId === id) {
      dispatch(setActiveCard(null));
    } else {
      dispatch(setActiveCard(id));
      dispatch(resetBaseOrientation());
    }
  };

  const popover = () => {
    const rect = cardRef.current!.getBoundingClientRect();
    let delay = 100;
    const scaleW = (window.innerWidth / rect.width) * 0.9;
    const scaleH = (window.innerHeight / rect.height) * 0.9;
    const scaleF = 1.75;
    const newScale = Math.min(scaleW, scaleH, scaleF);
    cardRef.current.style.setProperty('--card-scale', newScale.toString());
    
    setCenter();
    if (firstPop) {
      delay = 1000;
      setSpringRotateDelta({ x: 360, y: 0 });
    }
    // setFirstPop(false);
    setSpringScale({ scale: Math.min(scaleW, scaleH, scaleF) });
    
    interactEnd(delay);
  };

  const retreat = () => {
    if (cardRef.current) {
        // Reset the --card-scale CSS variable
        cardRef.current.style.setProperty('--card-scale', '1');
      }
    setSpringScale({ scale: 1 });
    setSpringTranslate({ x: 0, y: 0 });
    setSpringRotateDelta({ x: 0, y: 0 });
    interactEnd(100);
  };
  useEffect(() => {
    if (activeCardId === id) {
        popover();
    } else {
        retreat();
    }
  }, [activeCardId, id]);
  
  const setCenter = () => {
    const rect = cardRef.current!.getBoundingClientRect();
    const view = document.documentElement;
    const delta = {
      x: round(view.clientWidth / 2 - rect.x - rect.width / 2),
      y: round(view.clientHeight / 2 - rect.y - rect.height / 2),
    };
    setInitialDelta(delta);
    setScrollOffset(window.scrollY);
    setSpringTranslate({ x: delta.x, y: delta.y });
  };
  const reposition = useCallback(() => {
    if (activeCardId === id) {
      const currentScrollOffset = window.scrollY;
      const scrollDifference = scrollOffset - currentScrollOffset;
      
      setSpringTranslate({ 
        x: initialDelta.x, 
        y: initialDelta.y - scrollDifference 
      });
    }
  }, [activeCardId, id, initialDelta, scrollOffset]);
  useEffect(() => {
    window.addEventListener('scroll', reposition);
    return () => {
      window.removeEventListener('scroll', reposition);
    };
  }, [reposition]);
  useEffect(() => {
    if (foil) {
      setFoilStyles(`
        --foil: url(${foil});
        --foil-mask: ${mask ? `url(${mask})` : 'none'};
      `);
    }

    setStaticStyles(`
      --card-front: url(${img});
      --card-back: url(${back});
    `);
  }, [foil, mask, img, back]);
  
//   useEffect(() => {
//     const logZIndex = () => {
//       if (cardRef.current) {
//         const zIndex = window.getComputedStyle(cardRef.current).getPropertyValue('z-index');
//       }
//     };

//     // Log z-index on mount
//     logZIndex();

//     // Set up a MutationObserver to watch for style changes
//     const observer = new MutationObserver(logZIndex);
//     if (cardRef.current) {
//       observer.observe(cardRef.current, { attributes: true, attributeFilter: ['style'] });
//     }

//     // Clean up the observer on component unmount
//     return () => observer.disconnect();
//   }, [id]);
  return (
    <animated.div
      ref={cardRef}
      className={`card ${types.join(' ')} interactive ${active ? 'active' : ''} ${interacting ? 'interacting' : ''} ${loading ? 'loading' : ''} ${mask ? 'masked' : ''}`}
      data-number={number}
      data-set={set}
      data-subtypes={subtypes.join(' ')}
      data-supertype={supertype}
      data-rarity={rarity}
      style={{
        transform: springScale.scale.to(s => `scale(${s})`),
        x: springTranslate.x,
        y: springTranslate.y,
      }}
    >
      <animated.div
        className="card__translater"
        style={{
          transform: springRotateDelta.x.to(x => `rotateY(${x}deg)`),
        }}
      >
        <animated.button
          className="card__rotator"
          onClick={activate}
          onMouseMove={interact}
          onMouseLeave={() => interactEnd()}
          aria-label={`Expand the NFT Card; ${name}.`}
          style={{
            transform: springRotate.x.to(x => `rotateY(${x}deg) rotateX(${springRotate.y.get()}deg)`),
          }}
        >
          <Image
            className="card__back"
            src={back}
            alt="The back of a NFT Card, Soulbound logo in the center"
            loading="lazy"
            width="660"
            height="921"
          />
          <div className="card__front ">
            <Image
              src={img}
              alt={`Front design of the ${name} NFT Card`}
              onLoad={() => setLoading(false)}
              loading="lazy"
              width="660"
              height="921"
            />
            
            <animated.div
              className="card__shine"
              style={{
                backgroundPosition: springBackground.x.to(x => `${x}% ${springBackground.y.get()}%`),
              }}
            />
            <animated.div
              className="card__glare"
              style={{
                opacity: springGlare.o,
                backgroundPosition: springGlare.x.to(x => `${x}% ${springGlare.y.get()}%`),
              }}
            />
            
          </div>
        </animated.button>
      </animated.div>
    </animated.div>
  );
};

export default Card;
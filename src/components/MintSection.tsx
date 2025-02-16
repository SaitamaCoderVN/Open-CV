"use client"

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Image from 'next/image';
gsap.registerPlugin(ScrollTrigger);
import { useEffect, useRef } from 'react';
import { useAppSelector } from '../hooks/useRedux';
import { CustomConnectButton } from './ui/ConnectButton';
import Link from 'next/link';

// Define types for ref elements
type BorderElement = HTMLDivElement | null;
type RefArray = Array<BorderElement>;

// Interface for refs object
// interface ContainerRefs {
//   topRef: (el: BorderElement) => void;
//   bottomRef: (el: BorderElement) => void;
//   leftRef: (el: BorderElement) => void;
//   rightRef: (el: BorderElement) => void;
// }



function MintSection() {
  // Create typed ref arrays
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const topBorderRefs = useRef<RefArray>([]);
  const bottomBorderRefs = useRef<RefArray>([]);
  const leftBorderRefs = useRef<RefArray>([]);
  const rightBorderRefs = useRef<RefArray>([]);
  const backgroundVideo = useRef<HTMLVideoElement>(null);
  const mintButtonRef = useRef<HTMLAnchorElement>(null);

  const currentUser = useAppSelector((state) => state.user.currentUser);
  
  useEffect(() => {
    const animateContainer = (index: number): void => {
      const topBorder = topBorderRefs.current[index];
      const bottomBorder = bottomBorderRefs.current[index];
      const leftBorder = leftBorderRefs.current[index];
      const rightBorder = rightBorderRefs.current[index];

      if (containerRef || topBorder || bottomBorder || leftBorder || rightBorder) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play reset play reset',
          },
        });

        tl.addLabel('startAnimation')
          .fromTo(rightBorder, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, 'startAnimation')
          .fromTo(bottomBorder, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1')
          .fromTo(leftBorder, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, '-=0.1')
          .fromTo(topBorder, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1');

        const flickerDurations: number[] = [0.5, 0.6, 0.7, 0.5, 0.2];
        flickerDurations.forEach((duration, flickerIndex) => {
          tl.to(
            containerRef.current,
            {
              opacity: flickerIndex % 2 === 0 ? 0 : 1,
              duration: duration,
              ease: 'power1.inOut',
            },
            `startAnimation+=${flickerIndex * 0.07}`
          );
        });
        tl.to(containerRef.current, { opacity: 1, duration: 0.01, ease: 'none' }, "-=0.25");
      }
    };

    for (let i = 0; i < 7; i++) {
      animateContainer(i);
    }
    if(top.current && bottom.current) {
      const topRefs: HTMLElement[] = Array.from(top.current.querySelectorAll('div:not(.seper), img'));
      const bottomRefs: HTMLElement[] = Array.from(bottom.current.querySelectorAll('div.flick, h2.flick, img.flick'));
      const elementsToFlicker = [...topRefs, ...bottomRefs];
      elementsToFlicker.forEach((element) => {
        const flickerTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            toggleActions: 'play reset play reset',
          },
        });

        // Random flickering animation with varying durations and start times
        const randomDurations = Array.from({ length: 5 }, () => 0.1 + Math.random() * 0.4);
        randomDurations.forEach((duration, index) => {
          flickerTimeline.to(
            element,
            {
              opacity: index % 2 === 0 ? 0 : 1,
              duration: duration,
              ease: 'power1.inOut',
            },
            index * (0.1 + Math.random() * 0.3)
          );
        });

        // Ensure final opacity is set to 1
        flickerTimeline.to(element, { opacity: 1, duration: 0.1, ease: 'none' });
      });
    }
    if(backgroundVideo.current) {
      const video = backgroundVideo.current;
      gsap.fromTo(
        video,
        { scale: 1.5 },
        {
          scale: 1.15,
          ease: "power3.inOut",
          scrollTrigger: {
            trigger: video,
            start: "top 80%",
            end: "bottom top",
            scrub: 1,
            
          },
        }
      );
    }

    if(mintButtonRef.current) {
      const heartIcons = mintButtonRef.current.querySelectorAll('img');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: mintButtonRef.current,
          start: 'top 80%',
          toggleActions: 'play reset play reset',
        },
      });
      // flip heart icons
      tl.to(heartIcons, { 
        rotateY: 540, 
        duration: 1.75, 
        ease: 'power1.inOut',
        transformOrigin: "center center"
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);
  useEffect(() => {
    if (currentUser) {
    }
  }, [currentUser]);

    return (
        <section>
            <div
            ref={containerRef}
            className='
            max-phonescreen:h-[190vw] max-phonescreen:p-0 max-phonescreen:rounded-[10px] max-phonescreen:bg-primary
            relative flex flex-row justify-center items-center overflow-hidden w-full h-[110vw] p-[2px] border-0 border-solid border-border-transparent rounded-[20px] bg-secondary-background'>
              <div className='max-phonescreen:hidden overflow-hidden rounded-[20px]'>
                <div
                ref={(el: HTMLDivElement | null) => {
                  if (el) topBorderRefs.current[0] = el;
                }}
                className='absolute left-0 top-0 right-0 w-full h-[20px] rounded-none bg-primary '></div>
                <div
                ref={(el: HTMLDivElement | null) => {
                  if (el) bottomBorderRefs.current[0] = el;
                }}
                className='absolute  top-auto right-0 bottom-0 w-full h-[20px] rounded-none bg-primary '></div>
                <div 
                ref={(el: HTMLDivElement | null) => {
                  if (el) leftBorderRefs.current[0] = el;
                }}
                className='absolute left-0 bottom-0  w-[4px] h-full rounded-none bg-primary '></div>
                <div 
                ref={(el: HTMLDivElement | null) => {
                  if (el) rightBorderRefs.current[0] = el;
                }}
                className='absolute left-auto right-0 top-0 bottom-0 w-[4px] h-full rounded-none bg-primary '></div>
              </div>
              <div className='max-phonescreen:border max-phonescreen:rounded-[10px] max-phonescreen:border-primary relative z-[2] flex overflow-hidden w-full h-full rounded-[20px] bg-secondary-background'>
                <div className='poster absolute h-full w-full overflow-hidden'>
                  <video
                  ref={backgroundVideo}
                  autoPlay
                  muted
                  loop
                  className='absolute m-auto w-full h-full -right-full -bottom-full -top-full -left-full bg-cover bg-center object-cover -z-[100] scale-[1.15]'
                  style={{
                    backgroundImage: 'url(/soulboundAlley4.jpeg)'
                  }}
                  >
                    <source src='/soulboundAlley4.mp4' type='video/mp4' />
                    <source src='/soulboundAlley4.webm' type='video/webm' />
                  </video>
                </div>
                <div className='
                max-phonescreen:w-[85%] max-phonescreen:h-[40vw] max-phonescreen:-mt-[1px] max-phonescreen:-mr-[1px] max-phonescreen:p-0 max-phonescreen:border-[1px] max-phonescreen:rounded-tr-[10px] max-phonescreen:rounded-bl-[10px]
                absolute left-auto top-0 right-0 bottom-auto z-[1] flex overflow-hidden w-[60%] h-[25vw] -mt-[2px] -mr-[2px] p-[2px] flex-col justify-center items-start border-0 border-solid border-primary rounded-tr-[20px] rounded-bl-[20px]'>
                  <div className='max-phonescreen:hidden overflow-hidden rounded-[20px]'>
                    <div
                    ref={(el: HTMLDivElement | null) => {
                      if (el) topBorderRefs.current[1] = el;
                    }}
                    className='absolute left-0 top-0 right-0 w-full h-[20px] rounded-none bg-primary '></div>
                    <div
                    ref={(el: HTMLDivElement | null) => {
                      if (el) bottomBorderRefs.current[1] = el;
                    }}

                    className='absolute  top-auto right-0 bottom-0 w-full h-[20px] rounded-none bg-primary '></div>
                    <div 
                    ref={(el: HTMLDivElement | null) => {
                      if (el) leftBorderRefs.current[1] = el;
                    }}
                    className='absolute left-0 bottom-0  w-[4px] h-full rounded-none bg-primary '></div>
                    <div 
                    ref={(el: HTMLDivElement | null) => {
                      if (el) rightBorderRefs.current[1] = el;
                    }}
                    className='absolute left-auto right-0 top-0 bottom-0 w-[4px] h-full rounded-none bg-primary '></div>
                  </div>
                  <div className='
                  max-phonescreen:h-[40vw] max-phonescreen:rounded-bl-[10px]
                  relative flex overflow-hidden w-full h-[25vw] flex-col bg-secondary-background rounded-bl-[20px]'>
                    <div
                    ref={top}
                    className='
                    max-phonescreen:h-[10vw] max-phonescreen:-mb-[1px] max-phonescreen:-ml-[1px] border-solid border-b border-primary
                    relative flex w-full h-[5vw] justify-between items-center'>
                      <div className='seper w-[0.5vw] h-full'></div>
                      {currentUser && (
                        <Link href="/profile" className='fu-btn flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase max-phonescreen:h-[27px] max-phonescreen:text-[2.5vw] max-phonescreen:leading-[2.5vw] text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300 '>
                          Profile
                        </Link>
                      )}
                      {!currentUser && (
                        <>
                        <div className='text-primary font-pixel uppercase max-phonescreen:text-[2.5vw] max-phonescreen:leading-[2.5vw] text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>mint 001</div>
                        <div ref={(el: HTMLDivElement | null) => {
                          if (el) rightBorderRefs.current[3] = el;
                        }} className='seper flex max-phonescreen:w-[1px] w-[2px] h-full bg-primary'></div>
                        <img src="/Spark.svg" alt="" className='w-[3vw] max-w-full align-middle inline-block'/>
                        <div ref={(el: HTMLDivElement | null) => {
                          if (el) rightBorderRefs.current[4] = el;
                        }} className='seper flex max-phonescreen:w-[1px] w-[2px] h-full bg-primary'></div>
                          <div className='text-primary font-pixel uppercase max-phonescreen:text-[2.5vw] max-phonescreen:leading-[2.5vw] text-[1.5vw] leading-[1.5vw] whitespace-nowrap'>commence</div>
                          <div ref={(el: HTMLDivElement | null) => {
                            if (el) rightBorderRefs.current[5] = el;
                          }} className='seper flex max-phonescreen:w-[1px] w-[2px] h-full bg-primary'></div>
                          <img src="/pattern7.svg" alt="" className='w-[5vw] max-w-full align-middle inline-block'/>
                          
                        </>
                      )}
                      <div ref={(el: HTMLDivElement | null) => {
                            if (el) rightBorderRefs.current[6] = el;
                          }} className='seper flex max-phonescreen:w-[1px] w-[2px] h-full bg-primary'></div>
                      <div className={`max-phonescreen:h-[27px] max-phonescreen:flex connect-btn text-primary font-pixel uppercase max-phonescreen:text-[2.5vw] max-phonescreen:leading-[2.5vw] text-[1.5vw] leading-[1.5vw] whitespace-nowrap  ${currentUser ? '' : ''}`}>
                        <CustomConnectButton />
                      </div>
                      <div className='seper w-[0.5vw] h-full'></div>
                      <div
                      ref={(el: HTMLDivElement | null) => {
                        if (el) topBorderRefs.current[2] = el;
                      }}
                      className='max-phonescreen:hidden seper absolute left-0 top-auto right-auto bottom-0 w-full mt-[2px] bg-primary rounded-[20px] h-[2px]'></div>
                    </div>
                    <div
                    ref={bottom}
                    className='max-phonescreen:h-[32vw] max-phonescreen:mr-0 flex flex-row justify-start items-start overflow-hidden w-full h-[20vw] mt-0 -mr-[2px]'>
                      <div className='flex relative overflow-hidden w-[55.65%] h-full flex-col justify-center items-center max-phonescreen:border-r max-phonescreen:border-solid max-phonescreen:border-primary'>
                        <div 
                        ref={(el: HTMLDivElement | null) => {
                          if (el) rightBorderRefs.current[2] = el;
                        }}
                        className='absolute max-phonescreen:hidden left-auto top-0 right-0 bottom-0 z-[2] w-[2px] h-full bg-primary'></div>
                        <div className='w-[20vw] mb-[1vw] '>
                          <img src="/dragon.svg" alt="" className='flick w-full h-full overflow-hidden'/>
                        </div>
                      </div>
                      <div className='flex flex-col justify-between items-start overflow-hidden w-auto h-full '>
                        <div className='
                        max-phonescreen:mt-[3vw] max-phonescreen:mx-[3vw]
                        mt-[2vw] mr-[2vw] ml-[2vw]'>
                          <h2 className='
                          max-phonescreen:text-[3.7vw] max-phonescreen:leading-[6vw]
                          flick font-silkscreen text-[2.65vw] pb-[0.5vw] text-primary uppercase leading-[3vw] font-bold'>initiate minting process</h2>
                          <div className='
                          max-phonescreen:text-[3.7vw] max-phonescreen:leading-[6vw]
                          flick arrows-effect text-[1.8vw] leading-[1.8vw] text-primary font-[400] whitespace-nowrap'>&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;&gt;</div>
                        </div>
                        <div className='flex w-[90%] h-auto m-[2vw] justify-end'>
                          <div className='max-phonescreen:w-[37vw] max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw] flick w-[15vw] text-primary text-[1.5vw] leading-[1.5vw] text-right uppercase font-pixel'>
                            scroll down to mint your nft
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* mint place */}
                <Link
                ref={mintButtonRef}
                href="/mint" className='
                max-phonescreen:w-[50vw] max-phonescreen:h-[8vw] max-phonescreen:rounded-tr-[10px]
                absolute left-0 top-auto right-auto bottom-0 flex w-[40vw] h-[5vw] justify-between items-center rounded-tr-[20px] bg-primary '>
                  <div className='w-[0.5vw] h-full' />
                    <Image src="/dark-heart.svg" alt="" width={56} height={56} className='w-[3.5vw] max-w-full' />
                    <div className='h-full w-[2px] max-phonescreen:w-[1px] bg-secondary-background flex' />
                    <h2 className='max-phonescreen:text-[3.8vw] max-phonescreen:leading-[3.8vw] pb-[0.5vw] text-secondary-background text-[2.8vw] leading-[2.8vw] font-silkscreen whitespace-nowrap uppercase'>click to mint</h2>
                    <div className='h-full w-[2px] max-phonescreen:w-[1px] bg-secondary-background flex' />
                    <Image src="/dark-heart.svg" alt="" width={56} height={56} className='w-[3.5vw] max-w-full' />
                    <div className='w-[0.5vw] h-full' />
                </Link>
              </div>
            </div>
          </section>
    );
}

export default MintSection;
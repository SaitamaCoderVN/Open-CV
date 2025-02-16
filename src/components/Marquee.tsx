"use client"
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import { useEffect, useRef } from 'react';
import Image from 'next/image';

interface MarqueeProps {
    startEdge: 'left' | 'right';
    startPoint: string;
}
function Marquee({startEdge, startPoint}: MarqueeProps) {
    const bannerContainer = useRef<HTMLDivElement>(null);
    const topBorder = useRef<HTMLDivElement>(null);
    const bottomBorder = useRef<HTMLDivElement>(null);
    const leftBorder = useRef<HTMLDivElement>(null);
    const rightBorder = useRef<HTMLDivElement>(null);
    const bannerContent = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (
        bannerContainer.current &&
        topBorder.current &&
        bottomBorder.current &&
        leftBorder.current &&
        rightBorder.current &&
        bannerContent.current
      ) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: bannerContainer.current,
            start: startPoint,
            toggleActions: 'play reset play reset',
          },
        });
  
        tl.addLabel('startAnimation');
        tl.fromTo(
          bannerContainer.current,
          { scaleY: 0, transformOrigin: 'center' },
          { scaleY: 1, duration: 0.6, ease: 'power2.out' },
          'startAnimation'
        );
  
        if (startEdge === 'left') {
          tl.fromTo(leftBorder.current, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, 'startAnimation');
          tl.fromTo(topBorder.current, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1');
          tl.fromTo(rightBorder.current, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, '-=0.1');
          tl.fromTo(bottomBorder.current, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1');
        } else if (startEdge === 'right') {
          tl.fromTo(rightBorder.current, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, 'startAnimation');
          tl.fromTo(bottomBorder.current, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1');
          tl.fromTo(leftBorder.current, { height: 0 }, { height: '100%', duration: 0.2, ease: 'none' }, '-=0.1');
          tl.fromTo(topBorder.current, { width: 0 }, { width: '100%', duration: 0.5, ease: 'none' }, '-=0.1');
        }
  
        const flickerDurations = [0.5, 0.6, 0.7, 0.5, 0.2];
        flickerDurations.forEach((duration, index) => {
          tl.to(
            bannerContainer.current,
            {
              opacity: index % 2 === 0 ? 0 : 1,
              duration: duration,
              ease: 'power1.inOut',
            },
            `startAnimation+=${index * 0.07}`
          );
        });
        tl.to(bannerContainer.current, { opacity: 1, duration: 0.01, ease: 'none' }, "-=0.4");
  
        if (startEdge === 'left') {
          tl.fromTo(
            bannerContent.current,
            { x: 70, opacity: 1 },
            { x: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
            'startAnimation'
          );
        } else if (startEdge === 'right') {
          tl.fromTo(
            bannerContent.current,
            { x: 140, opacity: 1 },
            { x: 210, opacity: 1, duration: 0.6, ease: 'power2.out' },
            'startAnimation'
          );
        }
  
        // Flickering effect for all child divs and images except those with class "seper"
        const elementsToFlicker: NodeListOf<HTMLElement> = bannerContent.current.querySelectorAll('div:not(.seper), img');
  
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
  

        tl.to(
          bannerContent.current,
          { x: startEdge === 'left' ? -390 : 500,
            duration: 0.6, ease: 'power2.out',
          scrollTrigger: {
            trigger: bannerContent.current,
            start: "top 40%", 
            end: "bottom top",
            // markers: true,
            scrub: 1
          }
           },
          'startAnimation'
        )
        return () => {
          ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        };
      }
    }, [bannerContainer]);

    const renderMarqueeItem = (text: string, imageSrc: string) => (
        <>
          <div className="font-pixel uppercase flex-none text-primary max-phonescreen:text-[3.5vw] max-phonescreen:leading-[3.5vw]  text-[2.5vw] leading-[2.5vw] whitespace-nowrap">
            {text}
          </div>
          <div className="seper flex h-full w-[2vw]" />
          <Image
            src={imageSrc}
            alt="pattern"
            width={40}
            height={40}
            className="w-[4vw] max-w-full align-middle inline-block pointer-events-none"
          />
          <div className="seper flex h-full w-[2vw]" />
        </>
      );
    return (
        <>
        <div
            ref={bannerContainer}
            className="relative max-phonescreen:h-[9vw] max-phonescreen:p-[0] max-phonescreen:rounded-[10px] flex overflow-hidden w-full h-[5vw] p-[2px] flex-row justify-center items-center flex-none border-0 border-solid border-border-transparent rounded-[20px] bg-secondary-background max-phonescreen:bg-primary"
            >
            <div className="overflow-hidden rounded-[20px] max-phonescreen:hidden">
                <div ref={topBorder} className="absolute left-0 top-0 right-0 w-full h-[20px] rounded-none bg-primary" />
                <div ref={bottomBorder} className="absolute top-auto right-0 bottom-0 w-full h-[20px] rounded-none bg-primary" />
                <div ref={leftBorder} className="absolute left-0 bottom-0 w-[4px] h-full rounded-none bg-primary" />
                <div ref={rightBorder} className="absolute left-auto right-0 top-0 bottom-0 w-[4px] h-full rounded-none bg-primary" />
            </div>
            <div className="max-phonescreen:border max-phonescreen:rounded-[10px] max-phonescreen:border-primary relative z-[2] flex overflow-hidden w-full h-full justify-center items-center rounded-[20px] bg-secondary-background">
                <div
                ref={bannerContent}
                className="flex width-auto h-full justify-start items-center flex-none rounded-[20px] bg-secondary-background"
                >
                    {renderMarqueeItem("Dragon NFT", "/pattern.svg")}
                    {renderMarqueeItem("welcome to soulbound", "/pattern2.svg")}
                    {renderMarqueeItem("mint your nft now", "/pattern.svg")}
                    {renderMarqueeItem("Dragon NFT", "/pattern.svg")}
                    {renderMarqueeItem("welcome to soulbound", "/pattern2.svg")}
                    {renderMarqueeItem("mint your nft now", "/pattern.svg")}
                    {renderMarqueeItem("Dragon NFT", "/pattern.svg")}
                    {renderMarqueeItem("welcome to soulbound", "/pattern2.svg")}
                    {renderMarqueeItem("mint your nft now", "/pattern.svg")}
                    {renderMarqueeItem("Dragon NFT", "/pattern.svg")}
                    {renderMarqueeItem("welcome to soulbound", "/pattern2.svg")}
                    {renderMarqueeItem("mint your nft now", "/pattern.svg")}
                </div>
            </div>
            </div>
        </>
    );
}

export default Marquee;
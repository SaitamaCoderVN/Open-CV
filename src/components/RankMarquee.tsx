"use client"

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const images = [
  { src: "/heart.svg", width: 40, className: "w-[4vw] max-phonescreen:w-[12vw]" },
  { src: "/planet.svg", width: 60, className: "w-[6vw] max-phonescreen:w-[12vw]" },
  { src: "/triangle.svg", width: 70, className: "w-[7vw] max-phonescreen:w-[15vw]" },
  { src: "/heart.svg", width: 55, className: "w-[5.5vw] max-phonescreen:w-[12vw]" },
  { src: "/planet.svg", width: 60, className: "w-[6vw] max-phonescreen:w-[12vw]" },
  { src: "/heart.svg", width: 40, className: "w-[4vw] max-phonescreen:w-[12vw]" },
  { src: "/planet.svg", width: 60, className: "w-[6vw] max-phonescreen:w-[12vw]" },
];

const textGroups = [
  { title: "ranking", subtitle: "mint", titleClass: "text-[3.2vw] -mt-[1vw] max-phonescreen:text-[8vw] max-phonescreen:leading-[8vw]", subtitleClass: "text-[4vw] max-phonescreen:text-[12vw] max-phonescreen:leading-[12vw] max-phonescreen:-mt-[3vw]" },
  { title: "hot", subtitle: "users", titleClass: "text-[5.5vw] max-phonescreen:text-[12vw] max-phonescreen:leading-[12vw]", subtitleClass: "text-[2.3vw] mt-[0.8vw] max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]" },
  { title: "dragon", subtitle: "nft", titleClass: "text-[3.5vw] max-phonescreen:text-[7vw] max-phonescreen:leading-[7vw]", subtitleClass: "text-[3.5vw] max-phonescreen:text-[7vw] max-phonescreen:leading-[7vw]" },
  { title: "top", subtitle: "10 users", titleClass: "text-[5.5vw] max-phonescreen:text-[7vw] max-phonescreen:leading-[7vw]", subtitleClass: "text-[2.3vw] mt-[0.8vw] max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]" },
  { title: "ranking", subtitle: "mint", titleClass: "text-[3.2vw] -mt-[1vw] max-phonescreen:text-[8vw] max-phonescreen:leading-[8vw]", subtitleClass: "text-[4vw] max-phonescreen:text-[12vw] max-phonescreen:leading-[12vw] max-phonescreen:-mt-[3vw]" },
  { title: "hot", subtitle: "users", titleClass: "text-[5.5vw] max-phonescreen:text-[12vw] max-phonescreen:leading-[12vw]", subtitleClass: "text-[2.3vw] mt-[0.8vw] max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]" },
  { title: "top", subtitle: "10 users", titleClass: "text-[5.5vw] max-phonescreen:text-[7vw] max-phonescreen:leading-[7vw]", subtitleClass: "text-[2.3vw] mt-[0.8vw] max-phonescreen:text-[5vw] max-phonescreen:leading-[5vw]" },
];

function RankMarquee({ startEdge }: { startEdge: string }) {
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
          start: 'top bottom',
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
        const elementsToFlicker: NodeListOf<HTMLElement> = bannerContent.current.querySelectorAll('div:not(.seper), img, h2');
  
        elementsToFlicker.forEach((element) => {
          const flickerTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              toggleActions: 'play reset play reset',
              // markers: true,
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
            start: "top bottom", 
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
  }, [startEdge]);

  return (
    <div
      ref={bannerContainer}
      className='h-[10vw] max-phonescreen:h-[25vw] 
      max-phonescreen:rounded-[10px] max-phonescreen:bg-primary max-phonescreen:p-0
      relative flex flex-row justify-center items-center overflow-hidden w-full p-[2px] border-0 border-solid border-border-transparent rounded-[20px] bg-secondary-background'
    >
      <div ref={topBorder} className='max-phonescreen:hidden absolute left-0 top-0 right-0 w-full h-[20px] rounded-none bg-primary'></div>
      <div ref={bottomBorder} className='max-phonescreen:hidden absolute top-auto right-0 bottom-0 w-full h-[20px] rounded-none bg-primary'></div>
      <div ref={leftBorder} className='max-phonescreen:hidden absolute left-0 bottom-0 w-[4px] h-full rounded-none bg-primary'></div>
      <div ref={rightBorder} className='max-phonescreen:hidden absolute left-auto right-0 top-0 bottom-0 w-[4px] h-full rounded-none bg-primary'></div>
      <div className='max-phonescreen:border max-phonescreen:rounded-[10px] max-phonescreen:border-primary relative z-[2] flex justify-center items-center overflow-hidden w-full h-full rounded-[20px] bg-secondary-background'>
        <div
          ref={bannerContent}
          className='flex w-auto h-full justify-start items-center rounded-[20px] bg-secondary-background'
        >
          {images.map((image, index) => (
            <React.Fragment key={`group-${index}`}>
              <div className='seper flex w-[5vw] max-phonescreen:w-[10vw] h-full'></div>
              <Image
                src={image.src}
                alt=""
                width={image.width}
                height={image.width}
                className={`${image.className} max-w-full align-middle inline-block`}
              />
              <div className='seper flex w-[5vw] max-phonescreen:w-[10vw] h-full'></div>
              <div>
                <h2 className={`text-primary ${textGroups[index].titleClass} leading-[3vw] whitespace-nowrap font-pixel uppercase`}>
                  {textGroups[index].title}
                </h2>
                <h2 className={`text-primary ${textGroups[index].subtitleClass} leading-[3vw] whitespace-nowrap font-pixel uppercase`}>
                  {textGroups[index].subtitle}
                </h2>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RankMarquee;
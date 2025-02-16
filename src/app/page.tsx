

import Marquee from "@/components/Marquee";
import MintSection from "@/components/MintSection";
import RankingSection from "@/components/RankingSection";
import RankMarquee from "@/components/RankMarquee";
import Title from "@/components/Title";
import Spacer from "@/components/ui/Spacer";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <div className='v11e5678D'></div>
      <div className='background-container max-phonescreen:border-[1px] border-2 border-solid border-primary max-phonescreen:rounded-[10px] rounded-[20px] bg-background overflow-hidden bg-custom-bg bg-custom-pos bg-custom-size bg-custom-repeat bg-custom-attachment'>
        <main className='main-container mx-auto flex flex-col justify-center items-stretch'>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <Marquee startEdge="left" startPoint='top 80%'/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <div className='w-full h-[16vw] mx-auto'>
            <Title className='w-full h-full' startPoint='top 80%'/>
          </div>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <Marquee startEdge="right" startPoint='top 80%'/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <MintSection/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <RankMarquee startEdge='left'/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <RankingSection/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <Marquee startEdge="left" startPoint='top bottom'/>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <div className='w-full h-[16vw] mx-auto'>
            <Title className='w-full h-full' startPoint='top bottom'/>
          </div>
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
          <Spacer className='h-[2vw] max-phonescreen:h-[4vw]' />
        </main>
      </div>
    </>
  );
}

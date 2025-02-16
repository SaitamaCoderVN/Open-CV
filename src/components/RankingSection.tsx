"use client"
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Player } from '@/types/PlayerData';
// const POLL_INTERVAL = 30000; // Poll every 30 seconds
const API_BASE_URL = '/api/leaderboard';



const calculateLevelProgress = (detailedXp: number[]) => {
  if (!detailedXp || detailedXp.length < 2) return 0;
  return Math.floor((detailedXp[0] / detailedXp[1]) * 100);
};

const CircularProgress = ({ level, progress }: { level: number; progress: number }) => {
  const size = 40;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="

    relative w-10 h-10">
      <svg className="
  
      w-10 h-10 transform -rotate-90">
        <circle
          className="text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="text-primary"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
        <span className="text-white font-bold">{level}</span>
      </div>
    </div>
  );
};
  
  const RankBadge = ({ rank }: { rank: number }) => {
    const badgeColors: { [key: number]: string } = {
      1: 'bg-yellow-500',
      2: 'bg-gray-400',
      3: 'bg-amber-600',
  }
  const baseClasses = "flex items-center justify-center w-6 h-6 rounded-full font-bold";
  const colorClass = badgeColors[rank] || 'bg-gray-700 text-gray-300';
  
  return (
    <div className={`${baseClasses} ${colorClass}`}>
      {rank}
    </div>
  );
};
function RankingSection() {
    
    
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    
  
    const fetchPlayers = useCallback(async (isLoadMore = false) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/leaderboard?serverId=1170911030789029898`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        
        if (isLoadMore) {
          setPlayers(prevPlayers => {
            const newPlayers = data.players.filter(
              (newPlayer: Player) => !prevPlayers.some(p => p.id === newPlayer.id)
            );
            return [...prevPlayers, ...newPlayers];
          });
          setPage(prev => prev + 1);
        } else {
          setPlayers(data.players);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      } finally {
        setLoading(false);
      }
    }, [page]);
    useEffect(() => {
        fetchPlayers();
        // const intervalId = setInterval(() => fetchPlayers(), POLL_INTERVAL);
        // return () => clearInterval(intervalId);
      }, []);
    
      // const handleLoadMore = () => {
      //   fetchPlayers(true);
      // };
    return (
        <section>
            <div 
            ref={containerRef}
            className='
            max-phonescreen:h-[100vw] max-phonescreen:p-0 max-phonescreen:rounded-[10px] max-phonescreen:border-primary
            relative flex flex-row justify-center items-center overflow-hidden w-full h-[50vw] p-[2px] border-0 border-solid border-border-transparent rounded-[20px] bg-secondary-background'>
              <div
              className='max-phonescreen:hidden absolute left-0 top-0 right-0 w-full h-[20px] rounded-none bg-primary '></div>
              <div
              className='max-phonescreen:hidden absolute  top-auto right-0 bottom-0 w-full h-[20px] rounded-none bg-primary '></div>
              <div 
              className='max-phonescreen:hidden absolute left-0 bottom-0  w-[4px] h-full rounded-none bg-primary '></div>
              <div 
              className='max-phonescreen:hidden absolute left-auto right-0 top-0 bottom-0 w-[4px] h-full rounded-none bg-primary '></div>

              <div className='
              max-phonescreen:border max-phonescreen:rounded-[10px] max-phonescreen:border-primary
              relative z-[2] flex items-center justify-center overflow-hidden w-full h-full rounded-[20px] bg-secondary-background'>
                <div className='
                max-phonescreen:w-[70%] max-phonescreen:border-r max-phonescreen:border-primary max-phonescreen:border-solid max-phonescreen:border-0
                relative overflow-hidden flex w-1/2 h-full flex-col justify-between items-center'>
                  <div className='
                  max-phonescreen:hidden
                  absolute left-0 top-auto right-0 bottom-[5vw] w-full h-[2px] bg-primary'></div>

                  {/* ranking contaainer */}
                  <div className='my-[2vw] px-[2vw]  w-full h-[calc(100%-9vw)]  overflow-y-auto '>
                    {error && (
                        <div className="text-red-500 text-center p-4 font-mono">
                            Error fetching ranking
                        </div>
                    )}
                    {players.map((player, index) => {
                        const levelProgress = player.detailed_xp ? calculateLevelProgress(player.detailed_xp) : 0;
                        return (
                            <div key={player.id} className="
                            
                            userCard flex items-center justify-between  rounded-lg p-7 mb-2">
                              <div className="flex items-center space-x-4">
                                  <RankBadge rank={index + 1} />
                                  <div className="relative">
                                    <Image
                                        src={player.avatar ? `https://cdn.discordapp.com/avatars/${player.id}/${player.avatar}.png` : '/img/ancient.png'} // Check for null avatar
                                        alt={player.username}
                                        // layout="fill"
                                        width={40}
                                        height={40}
                                        className="
                                        max-phonescreen:w-4 max-phonescreen:h-4
                                        w-10 h-10 rounded-full object-cover"
                                        onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/img/ancient.png';
                                        }}
                                    />
                                   
                                  </div>
                                  <span className="
                                  max-phonescreen:text-[2vw] max-phonescreen:leading-[2vw]
                                  text-[#d7cfdb] text-base font-medium font-mono">{player.username}</span>
                              </div>
                              <CircularProgress level={player.level} progress={levelProgress} />
                            </div>
                        )
                    })}
                  </div>

                  <div className='
                  max-phonescreen:h-[8vw] max-phonescreen:-mb-[1px] max-phonescreen:-ml-[1px] max-phonescreen:border-x-0 max-phonescreen:border-y-[1px] max-phonescreen:border-primary
                  relative flex w-full h-[5vw] justify-between items-center'>
                    <div className='flex h-full w-[0.5vw]'></div>
                    <Image src="/chefPattern.svg" alt="" width={96} height={96} className='w-[6vw] max-w-full align-middle inline-block'/>
                    <div className='flex w-[2px] h-full bg-primary'></div>
                    <div className='text-[3vw] font-[400] font-silkscreen leading-[20px] uppercase text-primary'>discord</div>
                    <div className='flex w-[2px] h-full bg-primary'></div>
                    <Image src="/man.svg" alt="" width={48} height={48} className='flip__man w-[3vw] max-w-full align-middle inline-block'/>
                    <div className='flex w-[2px] h-full bg-primary'></div>
                    <div className='
                    max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw]
                    text-[1.5vw] font-[400] font-silkscreen leading-[1.5vw] uppercase text-primary'>ranking</div>
                    <div className='flex h-full w-[0.5vw]'></div>
                  </div>
                  <div className='
                  max-phonescreen:hidden
                  absolute left-auto top-0 right-0 bottom-0 z-[2] w-[2px] h-full bg-primary'></div>
                </div>


                <div className='
                max-phonescreen:hidden
                relative flex w-[31%] h-full justify-center items-center'>
                  <div className='w-[24vw] flex items-center justify-center'>
                    <Image src="/news.svg" alt="" width={384} height={384} className='w-full h-auto'/>
                  </div>
                </div>

                <div className='
                max-phonescreen:w-[30%]
                flex w-[20%] h-full flex-col justify-start items-center'>
                  <div className='flex w-full h-[15%] justify-center items-center '>
                    {/* <div className='circles w-[17vw]'>
                      <Image src="/circles.svg" alt="" width={272} height={272} className='w-full h-full overflow-hidden'/>
                    </div> */}
                    <Link href="/admin" className='
                    max-phonescreen:h-[7vw] max-phonescreen:w-[20vw] max-phonescreen:text-[3vw] max-phonescreen:leading-[3vw]
                    fu-btn profile flex items-center justify-center bg-primary text-secondary-background font-silkscreen font-semibold h-[3vw] uppercase text-[1.5vw] leading-[1.5vw] whitespace-nowrap py-[8px] px-[10px] hover:scale-[1.05] transition-all duration-300'>
                          Admin
                    </Link>
                  </div>
                  <div className='flex w-full h-[85%] justify-center items-center'>
                    <div className='
                    max-phonescreen:w-[17vw]
                    w-[9vw] h-[80%] p-5 border-2 border-solid border-primary rounded-[20px] flex items-center justify-center'>
                      <Image src="/signMint.svg" alt="" width={144} height={144} className='h-full w-auto'/>
                    </div>
                  </div>
                </div>
                <div className='
                max-phonescreen:hidden
                absolute left-auto top-0 right-[18vw] bottom-0 w-[2px] h-full ml-[30vw] bg-primary'></div>
                <div className='
                max-phonescreen:w-[30%]
                absolute left-auto top-[15%] right-0 bottom-auto w-[19%] h-[2px] bg-primary'></div>
              </div>
            </div>
          </section>
    );
}

export default RankingSection;
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Users, Zap, Calendar, Trophy, Target, Puzzle, Brain } from 'lucide-react';
import GameLobby from '../components/GameLobby';
import TeamBuilder from '../components/TeamBuilder';

interface Game {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  icon: any;
  available: boolean;
}

const availableGames: Game[] = [
  {
    id: 'shooter',
    name: 'Alliance Defense',
    description: 'Team up as gunners, engineers, and medics to defend your base against waves of enemies. Coordination is key!',
    minPlayers: 2,
    maxPlayers: 4,
    duration: '15-30 min',
    difficulty: 'Medium',
    icon: Target,
    available: true
  },
  {
    id: 'puzzle',
    name: 'Code Breakers',
    description: 'Work together to solve complex puzzles and unlock secrets. Communication and logic required.',
    minPlayers: 3,
    maxPlayers: 6,
    duration: '20-45 min',
    difficulty: 'Hard',
    icon: Puzzle,
    available: false // Coming soon
  },
  {
    id: 'strategy',
    name: 'Team Tactics',
    description: 'Strategic team-based gameplay where every decision matters. Plan, execute, and adapt together.',
    minPlayers: 4,
    maxPlayers: 8,
    duration: '30-60 min',
    difficulty: 'Hard',
    icon: Brain,
    available: false // Coming soon
  }
];

export default function Home() {
  const [currentView, setCurrentView] = useState<'home' | 'lobby' | 'team'>('home');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');

  const handleGameSelect = (gameId: string) => {
    if (availableGames.find(g => g.id === gameId)?.available) {
      setSelectedGame(gameId);
      setCurrentView('team');
    }
  };

  const handleTeamFormed = () => {
    setCurrentView('lobby');
  };

  if (currentView === 'team') {
    return <TeamBuilder 
      selectedGame={selectedGame} 
      onTeamFormed={handleTeamFormed}
      onBack={() => setCurrentView('home')}
    />;
  }

  if (currentView === 'lobby') {
    return <GameLobby 
      selectedGame={selectedGame}
      onBack={() => setCurrentView('team')}
    />;
  }

  return (
    <>
      <Head>
        <title>Alliance - Team Building Games Platform</title>
        <meta name="description" content="Multiplayer team building games for stronger workplace collaboration" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Header */}
        <header className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Alliance</h1>
              </motion.div>
              
              <motion.div
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <button className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Session</span>
                </button>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h2 
              className="text-5xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              Build Stronger Teams Through
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600"> Play</span>
            </motion.h2>
            
            <motion.p 
              className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              Engage your team with addictive multiplayer games designed to enhance collaboration, 
              communication, and problem-solving skills. Perfect for regular team building sessions.
            </motion.p>

            {/* Player Name Input */}
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              <input
                type="text"
                placeholder="Enter your name to get started"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="bg-white/10 backdrop-blur-sm border border-purple-500/30 text-white placeholder-gray-400 px-6 py-3 rounded-lg text-lg w-full max-w-md mx-auto focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20"
              />
            </motion.div>
          </div>
        </section>

        {/* Games Grid */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h3 
              className="text-3xl font-bold text-white text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.6 }}
            >
              Choose Your Challenge
            </motion.h3>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availableGames.map((game, index) => (
                <motion.div
                  key={game.id}
                  className={`bg-white/5 backdrop-blur-sm border rounded-xl p-6 cursor-pointer transition-all duration-300 ${
                    game.available 
                      ? 'border-purple-500/30 hover:border-purple-400 hover:bg-white/10 hover:scale-105' 
                      : 'border-gray-600/30 opacity-60 cursor-not-allowed'
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                  onClick={() => playerName && handleGameSelect(game.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      game.available ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-600'
                    }`}>
                      <game.icon className="w-6 h-6 text-white" />
                    </div>
                    {!game.available && (
                      <span className="bg-gray-600 text-gray-300 px-2 py-1 rounded text-sm">Coming Soon</span>
                    )}
                  </div>
                  
                  <h4 className="text-xl font-semibold text-white mb-2">{game.name}</h4>
                  <p className="text-gray-300 mb-4 text-sm leading-relaxed">{game.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Players:</span>
                      <span>{game.minPlayers}-{game.maxPlayers}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Duration:</span>
                      <span>{game.duration}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Difficulty:</span>
                      <span className={`${
                        game.difficulty === 'Easy' ? 'text-green-400' :
                        game.difficulty === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                      }`}>{game.difficulty}</span>
                    </div>
                  </div>
                  
                  {game.available && playerName && (
                    <motion.div 
                      className="mt-4 pt-4 border-t border-purple-500/20"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-center justify-center space-x-2 text-purple-400 font-medium">
                        <Zap className="w-4 h-4" />
                        <span>Start Playing</span>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.h3 
              className="text-3xl font-bold text-white text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 1.2 }}
            >
              Why Alliance?
            </motion.h3>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Team Collaboration",
                  description: "Games designed specifically to improve teamwork and communication skills"
                },
                {
                  icon: Trophy,
                  title: "Progressive Difficulty",
                  description: "Challenges that scale with your team's skill level, keeping everyone engaged"
                },
                {
                  icon: Calendar,
                  title: "Flexible Scheduling",
                  description: "Easy session scheduling for regular team building activities"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.4 + index * 0.1 }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-white mb-2">{feature.title}</h4>
                  <p className="text-gray-300">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

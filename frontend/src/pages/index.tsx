import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import { Users, Shield, Zap, Trophy, UserPlus, Crown } from 'lucide-react';
import AuthModal from '../components/AuthModal';
import TeamSetup from '../components/TeamSetup';
import GameLobby from '../components/GameLobby';

interface User {
  id: string;
  username: string;
  displayName: string;
  level: number;
  experience: number;
  rank: string;
  totalGamesPlayed: number;
  winRate: number;
}

interface Team {
  id: string;
  name: string;
  members: User[];
  isPublic: boolean;
  leaderId: string;
}

export default function Home() {
  const [currentView, setCurrentView] = useState<'welcome' | 'auth' | 'teamSetup' | 'lobby'>('welcome');
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('alliance_token');
    if (token) {
      // Verify token and get user data
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch('/api/game/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.valid) {
          setUser(data.user);
          setCurrentView('teamSetup');
        }
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('alliance_token');
    }
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('alliance_token', token);
    setCurrentView('teamSetup');
  };

  const handleTeamSetup = (teamData: Team | null) => {
    setTeam(teamData);
    setCurrentView('lobby');
  };

  const handleLogout = () => {
    setUser(null);
    setTeam(null);
    localStorage.removeItem('alliance_token');
    setCurrentView('welcome');
  };

  if (currentView === 'auth') {
    return (
      <AuthModal
        mode={authMode}
        onSuccess={handleAuthSuccess}
        onBack={() => setCurrentView('welcome')}
        onSwitchMode={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
      />
    );
  }

  if (currentView === 'teamSetup' && user) {
    return (
      <TeamSetup
        user={user}
        onTeamReady={handleTeamSetup}
        onLogout={handleLogout}
      />
    );
  }

  if (currentView === 'lobby' && user) {
    return (
      <GameLobby
        user={user}
        team={team}
        onBack={() => setCurrentView('teamSetup')}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <>
      <Head>
        <title>Alliance - Unite. Play. Conquer.</title>
        <meta name="description" content="Form your alliance and conquer challenges together" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-blue-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <motion.div 
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Alliance</h1>
                  <p className="text-blue-300 text-sm">Unite. Play. Conquer.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-6xl md:text-7xl font-bold text-white mb-6">
                Form Your
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400"> Alliance</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Unite with your team in epic battles. Master tactical gameplay. 
                Rise through the ranks as <span className="text-blue-400 font-semibold">Commanders</span> of the Alliance.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <motion.button
                  onClick={() => {
                    setAuthMode('register');
                    setCurrentView('auth');
                  }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg text-lg transition-all duration-300 hover:from-blue-500 hover:to-cyan-500 hover:scale-105 shadow-lg hover:shadow-blue-500/25"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center space-x-3">
                    <UserPlus className="w-6 h-6" />
                    <span>Join the Alliance</span>
                  </div>
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                </motion.button>

                <motion.button
                  onClick={() => {
                    setAuthMode('login');
                    setCurrentView('auth');
                  }}
                  className="px-8 py-4 border-2 border-blue-500 text-blue-400 font-semibold rounded-lg text-lg transition-all duration-300 hover:bg-blue-500/10 hover:border-blue-400"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="flex items-center space-x-3">
                    <Shield className="w-6 h-6" />
                    <span>Return to Base</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Features Grid */}
            <motion.div 
              className="grid md:grid-cols-3 gap-8 mt-20"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {[
                {
                  icon: Users,
                  title: "Form Your Squad",
                  description: "Create teams or go solo. Public matches or private operations - your choice.",
                  color: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Zap,
                  title: "Tactical Combat",
                  description: "Master different roles in intense cooperative battles. Strategy wins wars.",
                  color: "from-purple-500 to-pink-500"
                },
                {
                  icon: Trophy,
                  title: "Rise in Rank",
                  description: "Earn XP, level up, and climb from Recruit to Supreme Commander.",
                  color: "from-orange-500 to-red-500"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Call to Action */}
            <motion.div
              className="mt-16 p-8 bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-4">The Alliance Awaits</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join thousands of commanders in tactical battles. Form unbreakable bonds. 
                Prove your worth and rise to legendary status.
              </p>
              <div className="text-sm text-blue-300">
                🎮 Multiple game modes • 🏆 Ranking system • 👥 Team building • 📊 Performance tracking
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </>
  );
}

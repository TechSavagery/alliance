import { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Crown, Shield, Plus, Globe, Lock, LogOut, Star, Zap } from 'lucide-react';

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

interface TeamSetupProps {
  user: User;
  onTeamReady: (team: Team | null) => void;
  onLogout: () => void;
}

// Alliance ranking system
const getRankInfo = (level: number) => {
  if (level >= 50) return { name: 'Supreme Commander', color: 'from-yellow-400 to-orange-500', icon: '⭐' };
  if (level >= 40) return { name: 'Grand Marshal', color: 'from-purple-400 to-pink-500', icon: '👑' };
  if (level >= 30) return { name: 'Field Marshal', color: 'from-red-400 to-orange-500', icon: '🔥' };
  if (level >= 25) return { name: 'General', color: 'from-orange-400 to-red-500', icon: '⚡' };
  if (level >= 20) return { name: 'Colonel', color: 'from-blue-400 to-purple-500', icon: '🛡️' };
  if (level >= 15) return { name: 'Major', color: 'from-green-400 to-blue-500', icon: '🎖️' };
  if (level >= 10) return { name: 'Captain', color: 'from-cyan-400 to-blue-500', icon: '⚔️' };
  if (level >= 5) return { name: 'Lieutenant', color: 'from-gray-400 to-cyan-500', icon: '🗡️' };
  return { name: 'Recruit', color: 'from-gray-500 to-gray-400', icon: '🎯' };
};

export default function TeamSetup({ user, onTeamReady, onLogout }: TeamSetupProps) {
  const [mode, setMode] = useState<'choose' | 'createTeam' | 'joinTeam'>('choose');
  const [teamName, setTeamName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const rankInfo = getRankInfo(user.level);
  const experienceToNext = (user.level + 1) * 1000;
  const progressPercent = ((user.experience % 1000) / 1000) * 100;

  const handleCreateTeam = async () => {
    if (!teamName.trim()) return;
    
    setLoading(true);
    try {
      // Create team logic here
      const newTeam: Team = {
        id: `team_${Date.now()}`,
        name: teamName.trim(),
        members: [user],
        isPublic,
        leaderId: user.id
      };
      
      onTeamReady(newTeam);
    } catch (error) {
      console.error('Failed to create team:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoSolo = () => {
    onTeamReady(null);
  };

  if (mode === 'createTeam') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <motion.div
          className="relative z-10 w-full max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Form Your Alliance</h2>
              <p className="text-gray-300">Create a team and lead your squad to victory</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Name
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  placeholder="Enter your team name"
                  maxLength={30}
                />
                <p className="text-xs text-gray-400 mt-1">{teamName.length}/30 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-4">
                  Team Visibility
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setIsPublic(true)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isPublic 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <Globe className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                    <p className="text-white font-medium">Public</p>
                    <p className="text-xs text-gray-400">Anyone can join</p>
                  </button>
                  <button
                    onClick={() => setIsPublic(false)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      !isPublic 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <Lock className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                    <p className="text-white font-medium">Private</p>
                    <p className="text-xs text-gray-400">Invite only</p>
                  </button>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setMode('choose')}
                  className="flex-1 py-3 px-4 border border-white/20 text-gray-300 rounded-lg hover:bg-white/5 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!teamName.trim() || loading}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Alliance Command</h1>
                <p className="text-blue-300 text-sm">Team Formation Center</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* User Profile Card */}
        <motion.div
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user.displayName?.charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs">
                {user.level}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-white">{user.displayName || user.username}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${rankInfo.color} text-white`}>
                  {rankInfo.icon} {rankInfo.name}
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Games Played</p>
                  <p className="text-white font-semibold">{user.totalGamesPlayed}</p>
                </div>
                <div>
                  <p className="text-gray-400">Win Rate</p>
                  <p className="text-white font-semibold">{user.winRate.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-gray-400">Experience</p>
                  <p className="text-white font-semibold">{user.experience} XP</p>
                </div>
              </div>
              
              {/* XP Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Level {user.level}</span>
                  <span>{experienceToNext - user.experience} XP to next level</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Team Setup Options */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">Choose Your Path</h2>
          <p className="text-xl text-gray-300">Form an alliance or forge ahead alone</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Team */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            onClick={() => setMode('createTeam')}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Form Alliance</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Create your own team and lead your squad to victory. 
                Recruit allies and build an unstoppable force.
              </p>
              <div className="space-y-2 text-sm text-blue-300">
                <div className="flex items-center justify-center space-x-2">
                  <Crown className="w-4 h-4" />
                  <span>You become team leader</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Invite up to 3 more members</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Shared team progression</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Go Solo */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={handleGoSolo}
            whileHover={{ scale: 1.02 }}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <User className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Solo Mission</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Take on challenges alone or get matched with other solo players. 
                Perfect for quick sessions and individual skill building.
              </p>
              <div className="space-y-2 text-sm text-purple-300">
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Quick matchmaking</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Individual progression</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>Flexible gameplay</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-2">Ready for Battle</h4>
            <p className="text-gray-300 text-sm">
              Both paths lead to the same epic battles. Teams earn shared XP and achievements, 
              while solo players get matched with others for balanced gameplay.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
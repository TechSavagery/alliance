import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, Target, Users, User, Crown, Play, ArrowLeft, 
  LogOut, Zap, Clock, Trophy, Star, Crosshair, Wrench, 
  Heart, Globe, Lock
} from 'lucide-react';

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

interface GameLobbyProps {
  user: User;
  team: Team | null;
  onBack: () => void;
  onLogout: () => void;
}

interface Game {
  id: string;
  name: string;
  description: string;
  minPlayers: number;
  maxPlayers: number;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  icon: any;
  available: boolean;
  roles: string[];
  theme: string;
}

// Alliance-themed games
const availableGames: Game[] = [
  {
    id: 'nexus_defense',
    name: 'Nexus Defense',
    description: 'Defend the Alliance Nexus from waves of hostile forces. Coordinate roles: Guardians deal damage, Engineers build defenses, and Medics keep the team alive.',
    minPlayers: 2,
    maxPlayers: 4,
    duration: '15-25 min',
    difficulty: 'Medium',
    icon: Target,
    available: true,
    roles: ['Guardian', 'Engineer', 'Medic'],
    theme: 'Tactical Defense'
  },
  {
    id: 'void_breach',
    name: 'Void Breach',
    description: 'Seal dimensional rifts before they consume the galaxy. Advanced teamwork required with specialized roles and complex objectives.',
    minPlayers: 3,
    maxPlayers: 6,
    duration: '20-35 min',
    difficulty: 'Hard',
    icon: Zap,
    available: false,
    roles: ['Voidwalker', 'Technician', 'Stabilizer'],
    theme: 'Dimensional Crisis'
  },
  {
    id: 'alliance_wars',
    name: 'Alliance Wars',
    description: 'Epic strategic battles between multiple teams. Command units, capture territories, and outmaneuver enemy alliances.',
    minPlayers: 6,
    maxPlayers: 12,
    duration: '30-60 min',
    difficulty: 'Extreme',
    icon: Crown,
    available: false,
    roles: ['Commander', 'Strategist', 'Operative', 'Support'],
    theme: 'Strategic Warfare'
  }
];

export default function GameLobby({ user, team, onBack, onLogout }: GameLobbyProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showGameRules, setShowGameRules] = useState(false);

  const handleGameSelect = (game: Game) => {
    if (game.available) {
      setSelectedGame(game);
      setShowGameRules(true);
    }
  };

  const handleStartGame = () => {
    if (selectedGame) {
      // Navigate to game room
      console.log('Starting game:', selectedGame.id);
      // This would connect to the Colyseus room
    }
  };

  if (showGameRules && selectedGame) {
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
                  <selectedGame.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{selectedGame.name}</h1>
                  <p className="text-blue-300 text-sm">Mission Briefing</p>
                </div>
              </div>
              <button
                onClick={() => setShowGameRules(false)}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Lobby</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Game Rules */}
          <motion.div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <selectedGame.icon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Mission: {selectedGame.name}</h2>
              <p className="text-gray-300">{selectedGame.theme}</p>
            </div>

            {/* Objective */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">🎯 Mission Objective</h3>
              <p className="text-gray-300 leading-relaxed">{selectedGame.description}</p>
            </div>

            {/* Roles */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">⚔️ Alliance Roles</h3>
              <div className="grid md:grid-cols-3 gap-6">
                {selectedGame.id === 'nexus_defense' && (
                  <>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Crosshair className="w-6 h-6 text-red-400" />
                        <h4 className="font-semibold text-white">Guardian</h4>
                      </div>
                      <p className="text-sm text-gray-300">Primary damage dealer. Enhanced weapons and faster reload. Focus on eliminating threats.</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Wrench className="w-6 h-6 text-yellow-400" />
                        <h4 className="font-semibold text-white">Engineer</h4>
                      </div>
                      <p className="text-sm text-gray-300">Build and repair defenses. Create barriers and upgrade the Nexus. Essential for survival.</p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Heart className="w-6 h-6 text-green-400" />
                        <h4 className="font-semibold text-white">Medic</h4>
                      </div>
                      <p className="text-sm text-gray-300">Keep the team alive. Heal teammates and provide support buffs. Critical for long missions.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">🎮 Controls</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">Movement</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• WASD - Move your character</li>
                    <li>• Mouse - Aim and look around</li>
                    <li>• Shift - Sprint (limited stamina)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-300 mb-2">Combat & Actions</h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Left Click - Primary action (shoot/build/heal)</li>
                    <li>• Right Click - Secondary action</li>
                    <li>• E - Interact with objects</li>
                    <li>• Tab - View team status</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Victory Conditions */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">🏆 Victory Conditions</h3>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-300">
                  <strong>Success:</strong> Survive all waves while keeping the Nexus above 25% health. 
                  Bonus XP for perfect defense (Nexus above 75%).
                </p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mt-3">
                <p className="text-red-300">
                  <strong>Failure:</strong> Nexus health reaches 0% or all team members are eliminated.
                </p>
              </div>
            </div>

            {/* Team Setup */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">👥 Your Squad</h3>
              <div className="bg-white/5 rounded-lg p-4">
                {team ? (
                  <div>
                    <div className="flex items-center space-x-3 mb-4">
                      <Crown className="w-5 h-5 text-yellow-400" />
                      <span className="font-semibold text-white">Team: {team.name}</span>
                      <span className={`px-2 py-1 rounded text-xs ${team.isPublic ? 'bg-green-500/20 text-green-300' : 'bg-purple-500/20 text-purple-300'}`}>
                        {team.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {team.members.map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
                              {member.displayName?.charAt(0).toUpperCase() || member.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-white">{member.displayName || member.username}</span>
                            {member.id === team.leaderId && <Crown className="w-4 h-4 text-yellow-400" />}
                          </div>
                          <span className="text-sm text-gray-400">Level {member.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <User className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-white font-semibold">Solo Mission</p>
                    <p className="text-sm text-gray-400">You'll be matched with other solo players</p>
                  </div>
                )}
              </div>
            </div>

            {/* Start Button */}
            <motion.button
              onClick={handleStartGame}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-lg hover:shadow-green-500/25"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-center space-x-3">
                <Play className="w-6 h-6" />
                <span>Deploy to Mission</span>
              </div>
            </motion.button>
          </motion.div>
        </main>
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
                <h1 className="text-2xl font-bold text-white">Mission Control</h1>
                <p className="text-blue-300 text-sm">Select Your Operation</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Team Setup</span>
              </button>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Squad Status */}
        <motion.div
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {team ? (
                <>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                      <span>Team: {team.name}</span>
                      {team.isPublic ? <Globe className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-purple-400" />}
                    </h3>
                    <p className="text-gray-300">{team.members.length}/4 members ready</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Solo Operative</h3>
                    <p className="text-gray-300">Ready for matchmaking</p>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Commander</p>
              <p className="text-white font-semibold">{user.displayName || user.username}</p>
            </div>
          </div>
        </motion.div>

        {/* Available Missions */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold text-white mb-4">Available Missions</h2>
          <p className="text-xl text-gray-300">Choose your battlefield and prove your alliance</p>
        </motion.div>

        {/* Games Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {availableGames.map((game, index) => (
            <motion.div
              key={game.id}
              className={`bg-white/5 backdrop-blur-sm border rounded-2xl p-6 cursor-pointer transition-all duration-300 ${
                game.available 
                  ? 'border-white/10 hover:border-blue-400 hover:bg-white/10 hover:scale-105' 
                  : 'border-gray-600/30 opacity-60 cursor-not-allowed'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              onClick={() => handleGameSelect(game)}
              whileHover={game.available ? { scale: 1.02 } : {}}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${
                  game.available ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-600'
                }`}>
                  <game.icon className="w-7 h-7 text-white" />
                </div>
                {!game.available && (
                  <span className="bg-gray-600 text-gray-300 px-3 py-1 rounded-full text-sm">Coming Soon</span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-gray-300 text-sm mb-4 leading-relaxed">{game.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Players:</span>
                  <span className="text-white">{game.minPlayers}-{game.maxPlayers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white">{game.duration}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Difficulty:</span>
                  <span className={`font-medium ${
                    game.difficulty === 'Easy' ? 'text-green-400' :
                    game.difficulty === 'Medium' ? 'text-yellow-400' : 
                    game.difficulty === 'Hard' ? 'text-orange-400' : 'text-red-400'
                  }`}>{game.difficulty}</span>
                </div>
                
                {/* Roles */}
                <div>
                  <p className="text-gray-400 text-sm mb-1">Roles:</p>
                  <div className="flex flex-wrap gap-1">
                    {game.roles.map((role, roleIndex) => (
                      <span key={roleIndex} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              {game.available && (
                <motion.div 
                  className="mt-4 pt-4 border-t border-white/10"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center justify-center space-x-2 text-blue-400 font-medium">
                    <Target className="w-4 h-4" />
                    <span>Deploy Mission</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Coming Soon Info */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-500/20 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-2">More Missions Incoming</h4>
            <p className="text-gray-300 text-sm mb-4">
              Additional operations are being prepared. Each mission type offers unique challenges 
              and requires different alliance strategies.
            </p>
            <div className="flex justify-center space-x-6 text-sm text-blue-300">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Dimensional Rifts</span>
              </div>
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4" />
                <span>Strategic Warfare</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="w-4 h-4" />
                <span>Epic Campaigns</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
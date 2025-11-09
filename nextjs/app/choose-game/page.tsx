import Link from "next/link"
import { Calendar, Clock } from "lucide-react"

// Hardcoded game to navigate to
const games = [
  {
    id: 1,
    sport: "Football",
    team1: "Baltimore Ravens",
    team2: "Kansas City Chiefs",
    score: "0 - 0",
    time: "8:00 PM EST",
    status: "Live",
    image: "/football1.jpg",
  },
  {
    id: 2,
    sport: "Football",
    team1: "San Francisco 49ers",
    team2: "Dallas Cowboys",
    score: "14 - 7",
    time: "4:30 PM EST",
    status: "Q2",
    image: "/football2.jpg",
  },
  {
    id: 3,
    sport: "Soccer",
    team1: "Manchester United",
    team2: "Liverpool FC",
    score: "1 - 1",
    time: "3:00 PM EST",
    status: "Live",
    image: "/soccer1.jpg",
  },
  {
    id: 4,
    sport: "Soccer",
    team1: "Real Madrid",
    team2: "Barcelona",
    score: "2 - 3",
    time: "12:00 PM EST",
    status: "Half Time",
    image: "/soccer2.jpg",
  },
  {
    id: 5,
    sport: "Basketball",
    team1: "Los Angeles Lakers",
    team2: "Boston Celtics",
    score: "89 - 92",
    time: "7:00 PM EST",
    status: "Q3",
    image: "/basketball1.jpg",
  },
  {
    id: 6,
    sport: "Basketball",
    team1: "Indiana Fever",
    team2: "Atlanta Dream",
    score: "0 - 0",
    time: "10:30 PM EST",
    status: "Upcoming",
    image: "/basketball2.jpg",
  },
]

export default function ChooseGame() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-8">



          <span className="mr-2">←</span> Back to Home
        </Link>

        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">
            Today's{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Live Games
            </span>
          </h1>
          <div className="flex items-center gap-3 text-gray-400">
            <Calendar className="w-5 h-5" />
            <span>January 8, 2025</span>
          </div>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {games.map((game) => (
            <Link key={game.id} href="/main-view" className="block group">
              <div className="bg-gradient-to-r from-purple-950/50 to-black/50 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                <div className="flex h-32">
                  {/* Left: Image (40%) */}
                  <div className="w-[40%] relative overflow-hidden">
                    <img
                      src={game.image || "/placeholder.svg"}
                      alt={`${game.team1} vs ${game.team2}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-purple-950/80" />
                  </div>



                  {/* Right: Game Details (60%) */}
                  <div className="w-[60%] p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">
                          {game.sport}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            game.status === "Live"
                              ? "bg-red-500/20 text-red-400 animate-pulse"
                              : game.status === "Upcoming"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {game.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg leading-tight mb-1">{game.team1}</h3>
                          <h3 className="text-white font-semibold text-lg leading-tight">{game.team2}</h3>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-white">{game.score}</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{game.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}




        </div>
      </div>
    </div>
  )
}
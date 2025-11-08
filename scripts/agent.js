/*
  Simple agent script to moderate and post curated messages to the forum API.
  Usage: npm run run-agent
  It expects the Next dev server to be running at http://localhost:3000
*/

const API = process.env.FORUM_API || 'http://localhost:3000/api/forum';

function randomChoice(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

function generateMomentSummary(game) {
  // game: { home, away, clock, period, events: [...] }
  const templates = [
    `${game.player} just ${randomChoice(['hit a step-back 3', 'dropped a cold-blooded bucket', 'nailed a game-tying three'])} — ${game.team} (${game.clock})`,
    `Pivotal play: ${game.player} with ${game.action} at ${game.clock} — what a moment!`,
    `${game.player} picks up an injury — status TBD. Follow updates.`,
  ];
  return randomChoice(templates);
}

async function postThread(title, excerpt) {
  const res = await fetch(`${API}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, excerpt, author: 'Moderator', votes: 0 }),
  });
  const json = await res.json();
  console.log('Posted thread', json.id || json);
}

async function mainLoop() {
  console.log('Agent starting — will post curated messages to', API);
  let counter = 1;
  while (true) {
    // simulate fetching live game data
    const mock = {
      player: randomChoice(['Player #23','Player #7','Player #12','Player #3']),
      team: randomChoice(['Lakers','Bucks','Heat','Celtics']),
      action: randomChoice(['dunk','and-1 drive','monster block','step-back 3']),
      clock: `${Math.floor(Math.random()*12)+1}:${String(Math.floor(Math.random()*60)).padStart(2,'0')}`,
      period: `Q${Math.floor(Math.random()*4)+1}`
    };

    const summary = generateMomentSummary(mock);
    const title = `${mock.player} — ${mock.action}`;
    const excerpt = summary;

    try {
      await postThread(title, excerpt);
    } catch (e) {
      console.error('Failed to post thread', e.message);
    }

    counter += 1;
    // wait 20-40 seconds between posts
    const wait = 20000 + Math.floor(Math.random()*20000);
    await new Promise(res => setTimeout(res, wait));
  }
}

mainLoop().catch(err => { console.error(err); process.exit(1); });

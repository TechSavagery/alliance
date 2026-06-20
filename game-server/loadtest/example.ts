import type { Room } from "@colyseus/sdk";

export function requestJoinOptions(this: Room, i: number) {
  return { clientIndex: i };
}

export function onJoin(this: Room) {
  console.log(this.sessionId, "joined.");

  const sendInput = () => {
    this.send("input", {
      left: Math.random() > 0.5,
      right: Math.random() > 0.5,
      up: Math.random() > 0.7,
      shoot: Math.random() > 0.9,
    });
  };

  sendInput();
  setInterval(sendInput, 100);
}

export function onLeave(this: Room) {
  console.log(this.sessionId, "left.");
}

export function onError(this: Room, err: Error) {
  console.log(this.sessionId, "!! ERROR !!", err.message);
}

export function onStateChange(this: Room, state: unknown) {
  console.log(this.sessionId, "players:", (state as { players: { size: number } }).players?.size ?? 0);
}

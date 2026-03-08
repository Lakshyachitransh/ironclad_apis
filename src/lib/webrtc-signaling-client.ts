/**
 * WebSocket WebRTC Signaling Client
 * 
 * This client handles WebRTC signaling for video conferencing.
 * It sends and receives signaling messages (offer, answer, ice-candidate)
 * and manages room connections.
 * 
 * Usage:
 * const client = new WebRTCSignalingClient('ws://localhost:3000/ws/live-class');
 * await client.connect();
 * client.on('existing-participants', (data) => {
 *   // Handle existing participants
 * });
 * client.joinRoom(roomId, userId, username, email);
 */

import io, { Socket } from 'socket.io-client';

export interface Participant {
  socketId: string;
  userId: string;
  username: string;
  email: string;
}

export interface WebRTCOffer {
  type: 'offer';
  sdp: string;
}

export interface WebRTCAnswer {
  type: 'answer';
  sdp: string;
}

export interface IceCandidate {
  candidate: string;
  sdpMLineIndex: number;
  sdpMid: string;
}

export type SignalingMessage =
  | { type: 'join'; roomId: string; userId: string; username: string; email: string }
  | { type: 'leave'; roomId: string }
  | { type: 'offer'; roomId: string; to: string; offer: WebRTCOffer }
  | { type: 'answer'; roomId: string; to: string; answer: WebRTCAnswer }
  | { type: 'ice-candidate'; roomId: string; to: string; candidate: IceCandidate }
  | { type: 'screen-share-started'; roomId: string; screenOffer: any }
  | { type: 'screen-share-stopped'; roomId: string }
  | { type: 'media-state-changed'; roomId: string; audioEnabled: boolean; videoEnabled: boolean };

export class WebRTCSignalingClient {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Function[]> = new Map();
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;

  constructor(private wsUrl: string) {}

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Extract base URL (without protocol) from wsUrl
      // wsUrl format: ws://localhost:3000/ws-live-class or http://localhost:3000
      const baseUrl = this.wsUrl
        .replace('ws://', 'http://')
        .replace('wss://', 'https://')
        .replace('/ws-live-class', '')
        .replace('/ws/live-class', '')
        .replace(/\/$/, ''); // Remove trailing slash

      const socketUrl = `${baseUrl}/ws-live-class`;
      console.log('🔌 Connecting to WebSocket:', socketUrl);

      this.socket = io(socketUrl, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        this.emit('connected', null);
        resolve();
      });

      this.socket.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('❌ WebSocket disconnected:', reason);
        this.emit('disconnected', reason);
      });

      // Register all event listeners
      this.registerEventListeners();
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.currentUserId = null;
    }
  }

  /**
   * Join a video room
   */
  joinRoom(roomId: string, userId: string, username: string, email: string): void {
    if (!this.socket) {
      console.error('❌ WebSocket not connected');
      return;
    }

    this.currentRoomId = roomId;
    this.currentUserId = userId;

    console.log(`🎭 Joining room: ${roomId} as ${username}`);
    this.socket.emit('join', {
      roomId,
      userId,
      username,
      email,
    });
  }

  /**
   * Leave the current video room
   */
  leaveRoom(): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`👋 Leaving room: ${this.currentRoomId}`);
    this.socket.emit('leave', {
      roomId: this.currentRoomId,
    });

    this.currentRoomId = null;
    this.currentUserId = null;
  }

  /**
   * Send WebRTC offer to a peer
   */
  sendOffer(to: string, offer: WebRTCOffer): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`📤 Sending offer to ${to}`);
    this.socket.emit('offer', {
      roomId: this.currentRoomId,
      to,
      offer,
    });
  }

  /**
   * Send WebRTC answer to a peer
   */
  sendAnswer(to: string, answer: WebRTCAnswer): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`📥 Sending answer to ${to}`);
    this.socket.emit('answer', {
      roomId: this.currentRoomId,
      to,
      answer,
    });
  }

  /**
   * Send ICE candidate to a peer
   */
  sendIceCandidate(to: string, candidate: IceCandidate): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    this.socket.emit('ice-candidate', {
      roomId: this.currentRoomId,
      to,
      candidate,
    });
  }

  /**
   * Notify others that screen sharing has started
   */
  notifyScreenShareStarted(screenOffer: any): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`🖥️ Notifying others: screen sharing started`);
    this.socket.emit('screen-share-started', {
      roomId: this.currentRoomId,
      screenOffer,
    });
  }

  /**
   * Notify others that screen sharing has stopped
   */
  notifyScreenShareStopped(): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`⏹️ Notifying others: screen sharing stopped`);
    this.socket.emit('screen-share-stopped', {
      roomId: this.currentRoomId,
    });
  }

  /**
   * Notify others of media state changes (mute/unmute, camera on/off)
   */
  notifyMediaStateChanged(audioEnabled: boolean, videoEnabled: boolean): void {
    if (!this.socket || !this.currentRoomId) {
      console.error('❌ Not connected to a room');
      return;
    }

    console.log(`🎤 Media state changed - Audio: ${audioEnabled}, Video: ${videoEnabled}`);
    this.socket.emit('media-state-changed', {
      roomId: this.currentRoomId,
      audioEnabled,
      videoEnabled,
    });
  }

  /**
   * Request and receive room statistics
   */
  getStats(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.socket) {
        resolve(null);
        return;
      }

      const listener = (stats: any) => {
        this.socket?.off('stats', listener);
        resolve(stats);
      };

      this.socket.on('stats', listener);
      this.socket.emit('get-stats');
    });
  }

  /**
   * Register all event listeners
   */
  private registerEventListeners(): void {
    if (!this.socket) return;

    // Existing participants in room when we join
    this.socket.on('existing-participants', (data) => {
      console.log(`📊 Existing participants: ${data.participants.length}`);
      this.emit('existing-participants', data);
    });

    // New participant joined
    this.socket.on('user-joined', (data) => {
      console.log(`👤 User joined: ${data.username}`);
      this.emit('user-joined', data);
    });

    // Participant left
    this.socket.on('user-left', (data) => {
      console.log(`👋 User left: ${data.username}`);
      this.emit('user-left', data);
    });

    // Updated participant list
    this.socket.on('participants-updated', (data) => {
      console.log(`📊 Participant list updated: ${data.count} users`);
      this.emit('participants-updated', data);
    });

    // WebRTC offer received
    this.socket.on('offer', (data) => {
      console.log(`📤 Offer received from ${data.from}`);
      this.emit('offer', data);
    });

    // WebRTC answer received
    this.socket.on('answer', (data) => {
      console.log(`📥 Answer received from ${data.from}`);
      this.emit('answer', data);
    });

    // ICE candidate received
    this.socket.on('ice-candidate', (data) => {
      console.log(`❄️ ICE candidate received from ${data.from}`);
      this.emit('ice-candidate', data);
    });

    // Screen sharing started
    this.socket.on('screen-share-started', (data) => {
      console.log(`🖥️ Screen sharing started by ${data.username}`);
      this.emit('screen-share-started', data);
    });

    // Screen sharing stopped
    this.socket.on('screen-share-stopped', (data) => {
      console.log(`⏹️ Screen sharing stopped by ${data.username}`);
      this.emit('screen-share-stopped', data);
    });

    // Media state changed
    this.socket.on('media-state-changed', (data) => {
      console.log(
        `🎤 Media state changed - ${data.username}: Audio ${data.audioEnabled ? '🔊' : '🔇'}, Video ${data.videoEnabled ? '📹' : '🚫'}`,
      );
      this.emit('media-state-changed', data);
    });

    // Error handling
    this.socket.on('error', (data) => {
      console.error(`❌ Server error: ${data.message}`);
      this.emit('server-error', data);
    });
  }

  /**
   * Event listener management
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(data));
    }
  }

  /**
   * Get current connection status
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current room ID
   */
  getRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.currentUserId;
  }
}

// Export singleton instance for use across the app
export const signalingClient = new WebRTCSignalingClient(
  process.env.REACT_APP_WS_URL || 'http://localhost:3000'
);

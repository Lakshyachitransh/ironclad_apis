import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { LiveClassService } from '../live-class.service';

/**
 * WebRTC Signaling Gateway for Live Classes
 * Handles peer-to-peer signaling for video conferencing
 * 
 * Message Types:
 * - join: Join a video room
 * - leave: Leave a video room
 * - offer: WebRTC offer from peer
 * - answer: WebRTC answer from peer
 * - ice-candidate: ICE candidate for NAT traversal
 */
@WebSocketGateway({
  namespace: 'ws-live-class',
  cors: { origin: true, credentials: true },
  transports: ['websocket'],
})
export class LiveClassGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger = new Logger('LiveClassGateway');

  // Store active rooms and participants
  // Format: { [roomId]: { [socketId]: { userId, username, peers: Set<socketId> } } }
  private rooms: Map<
    string,
    Map<
      string,
      {
        userId: string;
        username: string;
        email: string;
        peers: Set<string>;
      }
    >
  > = new Map();

  // Map of room to list of connected socket IDs
  private roomConnections: Map<string, Set<string>> = new Map();

  constructor(private liveClassService: LiveClassService) {
    console.log('🎯 LiveClassGateway constructor called');
  }

  afterInit(server: Server) {
    console.log('✅ WebSocket Gateway initialized');
    this.logger.log('🎬 WebSocket available at http://localhost:3000/ws-live-class');
    this.logger.log(`📡 Namespace: /ws-live-class`);
    this.logger.log(`🔌 Transports: websocket`);
    this.logger.log(`✅ Ready to accept WebSocket connections`);
  }

  handleConnection(client: Socket) {
    console.log(`✅ WebSocket client connected: ${client.id}`);
    this.logger.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ WebSocket client disconnected: ${client.id}`);
    this.logger.log(`❌ Client disconnected: ${client.id}`);
    
    // Find which room this client was in and remove them
    for (const [roomId, participants] of this.rooms.entries()) {
      if (participants.has(client.id)) {
        this.handleUserLeave(roomId, client.id);
      }
    }
  }

  /**
   * Handle user joining a video room
   */
  @SubscribeMessage('join')
  async handleJoin(
    client: Socket,
    data: {
      roomId: string;
      userId: string;
      username: string;
      email: string;
    },
  ) {
    const { roomId, userId, username, email } = data;
    this.logger.log(`👤 User joining room: ${roomId} (${username})`);

    // Validate room exists in database
    try {
      const roomExists = await this.liveClassService.roomExists(roomId);
      if (!roomExists) {
        this.logger.warn(`⚠️ Room not found: ${roomId}`);
        client.emit('error', { message: 'Room not found' });
        return;
      }
    } catch (error) {
      this.logger.error(`❌ Error validating room: ${error.message}`);
      client.emit('error', { message: 'Failed to validate room' });
      return;
    }

    // Initialize room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
      this.roomConnections.set(roomId, new Set());
      this.logger.log(`🏢 Room created: ${roomId}`);
    }

    const rooms = this.rooms.get(roomId);
    const connections = this.roomConnections.get(roomId);

    // Add participant
    rooms.set(client.id, {
      userId,
      username,
      email,
      peers: new Set(),
    });
    connections.add(client.id);

    // Join socket to room (for socket.io rooms)
    client.join(roomId);

    // Get existing participants to send to new user
    const existingParticipants = Array.from(rooms.entries())
      .filter(([socketId]) => socketId !== client.id)
      .map(([socketId, info]) => ({
        socketId,
        userId: info.userId,
        username: info.username,
        email: info.email,
      }));

    this.logger.log(
      `📊 Existing participants for ${username}: ${existingParticipants.length}`,
    );

    // Send existing participants to new user
    client.emit('existing-participants', {
      participants: existingParticipants,
    });

    // Notify existing participants about new user
    client.to(roomId).emit('user-joined', {
      socketId: client.id,
      userId,
      username,
      email,
    });

    // Broadcast updated participant list to everyone in room
    this.broadcastParticipantList(roomId);

    this.logger.log(
      `✅ User joined successfully. Room: ${roomId}, Total: ${rooms.size}`,
    );
  }

  /**
   * Handle offer from peer
   */
  @SubscribeMessage('offer')
  handleOffer(
    client: Socket,
    data: {
      roomId: string;
      to: string; // target socket ID
      offer: any; // WebRTC offer object
    },
  ) {
    const { roomId, to, offer } = data;
    this.logger.log(`📤 Offer from ${client.id} to ${to}`);

    // Validate target is in room
    const rooms = this.rooms.get(roomId);
    if (!rooms || !rooms.has(to)) {
      this.logger.warn(
        `⚠️ Target peer ${to} not found in room ${roomId}`,
      );
      client.emit('error', {
        message: 'Target peer not found',
        code: 'PEER_NOT_FOUND',
      });
      return;
    }

    // Send offer only to target socket
    this.server.to(to).emit('offer', {
      from: client.id,
      roomId,
      offer,
    });
    this.logger.debug(`✅ Offer delivered to ${to}`);
  }

  /**
   * Handle answer from peer
   */
  @SubscribeMessage('answer')
  handleAnswer(
    client: Socket,
    data: {
      roomId: string;
      to: string; // target socket ID
      answer: any; // WebRTC answer object
    },
  ) {
    const { roomId, to, answer } = data;
    this.logger.log(`📥 Answer from ${client.id} to ${to}`);

    // Validate target is in room
    const rooms = this.rooms.get(roomId);
    if (!rooms || !rooms.has(to)) {
      this.logger.warn(
        `⚠️ Target peer ${to} not found in room ${roomId}`,
      );
      client.emit('error', {
        message: 'Target peer not found',
        code: 'PEER_NOT_FOUND',
      });
      return;
    }

    // Send answer only to target socket
    this.server.to(to).emit('answer', {
      from: client.id,
      roomId,
      answer,
    });
    this.logger.debug(`✅ Answer delivered to ${to}`);
  }

  /**
   * Handle ICE candidates for NAT traversal
   */
  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    client: Socket,
    data: {
      roomId: string;
      to: string; // target socket ID
      candidate: any; // ICE candidate object
    },
  ) {
    const { roomId, to, candidate } = data;

    // Validate target is in room
    const rooms = this.rooms.get(roomId);
    if (!rooms || !rooms.has(to)) {
      this.logger.warn(
        `⚠️ Target peer ${to} not found in room ${roomId} for ICE candidate`,
      );
      return;
    }

    // Send ICE candidate only to target socket
    this.server.to(to).emit('ice-candidate', {
      from: client.id,
      roomId,
      candidate,
    });
  }

  /**
   * Handle user leaving a video room
   */
  @SubscribeMessage('leave')
  handleLeave(client: Socket, data: { roomId: string }) {
    const { roomId } = data;
    this.handleUserLeave(roomId, client.id);
  }

  /**
   * Handle screen share started
   */
  @SubscribeMessage('screen-share-started')
  handleScreenShareStarted(
    client: Socket,
    data: { roomId: string; screenOffer: any },
  ) {
    const { roomId, screenOffer } = data;
    const rooms = this.rooms.get(roomId);
    if (!rooms) return;

    const participant = rooms.get(client.id);
    if (!participant) return;

    this.logger.log(`🖥️ Screen sharing started by ${participant.username}`);

    // Notify others in room
    client.to(roomId).emit('screen-share-started', {
      from: client.id,
      username: participant.username,
      screenOffer,
    });
  }

  /**
   * Handle screen share stopped
   */
  @SubscribeMessage('screen-share-stopped')
  handleScreenShareStopped(client: Socket, data: { roomId: string }) {
    const { roomId } = data;
    const rooms = this.rooms.get(roomId);
    if (!rooms) return;

    const participant = rooms.get(client.id);
    if (!participant) return;

    this.logger.log(`⏹️ Screen sharing stopped by ${participant.username}`);

    // Notify others in room
    client.to(roomId).emit('screen-share-stopped', {
      from: client.id,
      username: participant.username,
    });
  }

  /**
   * Handle mute/unmute and camera on/off
   */
  @SubscribeMessage('media-state-changed')
  handleMediaStateChanged(
    client: Socket,
    data: {
      roomId: string;
      audioEnabled: boolean;
      videoEnabled: boolean;
    },
  ) {
    const { roomId, audioEnabled, videoEnabled } = data;
    const rooms = this.rooms.get(roomId);
    if (!rooms) return;

    const participant = rooms.get(client.id);
    if (!participant) return;

    this.logger.log(
      `🎤 Media state changed - Audio: ${audioEnabled}, Video: ${videoEnabled} (${participant.username})`,
    );

    // Notify others in room
    client.to(roomId).emit('media-state-changed', {
      from: client.id,
      username: participant.username,
      audioEnabled,
      videoEnabled,
    });
  }

  /**
   * Private helper: Handle user leaving
   */
  private handleUserLeave(roomId: string, socketId: string) {
    const rooms = this.rooms.get(roomId);
    if (!rooms) return;

    const participant = rooms.get(socketId);
    if (!participant) return;

    this.logger.log(
      `👋 User leaving: ${participant.username} from room ${roomId}`,
    );

    // Remove participant
    rooms.delete(socketId);
    const connections = this.roomConnections.get(roomId);
    if (connections) {
      connections.delete(socketId);
    }

    // If room is empty, delete it
    if (rooms.size === 0) {
      this.rooms.delete(roomId);
      this.roomConnections.delete(roomId);
      this.logger.log(`🗑️ Room deleted (empty): ${roomId}`);
    } else {
      // Notify others that user left
      this.server.to(roomId).emit('user-left', {
        socketId,
        username: participant.username,
      });

      // Broadcast updated participant list
      this.broadcastParticipantList(roomId);
    }
  }

  /**
   * Broadcast updated participant list to all users in room
   */
  private broadcastParticipantList(roomId: string) {
    const rooms = this.rooms.get(roomId);
    if (!rooms) return;

    const participants = Array.from(rooms.entries()).map(([socketId, info]) => ({
      socketId,
      userId: info.userId,
      username: info.username,
      email: info.email,
    }));

    this.server.to(roomId).emit('participants-updated', {
      participants,
      count: participants.length,
    });

    this.logger.log(
      `📊 Participant list updated for room ${roomId}: ${participants.length} users`,
    );
  }

  /**
   * Get room stats (for debugging/monitoring)
   */
  @SubscribeMessage('get-stats')
  handleGetStats(client: Socket) {
    const stats = {
      totalRooms: this.rooms.size,
      rooms: Array.from(this.rooms.entries()).map(([roomId, participants]) => ({
        roomId,
        participantCount: participants.size,
        participants: Array.from(participants.entries()).map(
          ([socketId, info]) => ({
            socketId,
            username: info.username,
            email: info.email,
          }),
        ),
      })),
    };

    client.emit('stats', stats);
    this.logger.log(`📈 Stats requested: ${stats.totalRooms} rooms active`);
  }
}

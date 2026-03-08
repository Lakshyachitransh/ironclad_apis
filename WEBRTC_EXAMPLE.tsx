/**
 * WebRTC Video Room - Frontend Integration Example
 * 
 * This file shows a complete example of how to integrate the WebRTC signaling
 * with your frontend video room component.
 */

// ============================================================================
// 1. SETUP & INITIALIZATION
// ============================================================================

import { signalingClient, WebRTCSignalingClient } from '@/lib/webrtc-signaling-client';
import { WebRTCManager } from '@/lib/webrtc';
import { useEffect, useState } from 'react';

export function VideoRoomExample() {
  const [isConnected, setIsConnected] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [participants, setParticipants] = useState<Map<string, RemoteParticipant>>(
    new Map()
  );
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const webrtcManager = new WebRTCManager();
  const roomId = 'live-class-uuid-here'; // From URL params

  // ========================================================================
  // 2. CONNECT & JOIN ROOM
  // ========================================================================

  useEffect(() => {
    const setupVideoRoom = async () => {
      try {
        // Step 1: Connect to WebSocket
        console.log('📡 Connecting to WebSocket...');
        await signalingClient.connect();
        setIsConnected(true);
        console.log('✅ WebSocket connected');

        // Step 2: Get local media stream
        console.log('🎥 Requesting camera and microphone...');
        const stream = await webrtcManager.getLocalStream({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        setLocalStream(stream);
        console.log('✅ Local stream acquired');

        // Step 3: Setup event handlers (before joining)
        setupSignalingHandlers(stream);

        // Step 4: Join the video room
        const user = await getCurrentUser(); // Your auth method
        console.log(`👤 Joining room as ${user.name}...`);
        signalingClient.joinRoom(roomId, user.id, user.name, user.email);
        console.log('✅ Join request sent');

      } catch (error) {
        console.error('❌ Setup error:', error);
      }
    };

    setupVideoRoom();

    return () => {
      // Cleanup on unmount
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      signalingClient.leaveRoom();
      signalingClient.disconnect();
    };
  }, [roomId]);

  // ========================================================================
  // 3. SIGNALING EVENT HANDLERS
  // ========================================================================

  const setupSignalingHandlers = (localStream: MediaStream) => {
    // When the room sends us list of participants already in room
    signalingClient.on('existing-participants', async (data) => {
      console.log(`📊 Found ${data.participants.length} existing participants`);
      
      for (const participant of data.participants) {
        // Create peer connection for each existing participant
        await createPeerConnection(localStream, participant.socketId, true);
      }
    });

    // When a new participant joins the room
    signalingClient.on('user-joined', async (data) => {
      console.log(`👤 ${data.username} joined the room`);
      
      // Create peer connection and send them an offer
      await createPeerConnection(localStream, data.socketId, true);
    });

    // When a participant leaves
    signalingClient.on('user-left', (data) => {
      console.log(`👋 ${data.username} left the room`);
      
      const updatedParticipants = new Map(participants);
      updatedParticipants.delete(data.socketId);
      setParticipants(updatedParticipants);
    });

    // Updated participant list
    signalingClient.on('participants-updated', (data) => {
      console.log(`📊 Room now has ${data.count} participants`);
    });

    // Incoming WebRTC offer from peer
    signalingClient.on('offer', async (data) => {
      console.log(`📤 Received offer from ${data.from}`);
      
      const peerConnection = webrtcManager.getPeerConnection(data.from);
      if (peerConnection) {
        // Set remote description with their offer
        const remoteDesc = new RTCSessionDescription(data.offer);
        await peerConnection.setRemoteDescription(remoteDesc);

        // Create answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        // Send answer back
        signalingClient.sendAnswer(data.from, {
          type: 'answer',
          sdp: answer.sdp || ''
        });
        console.log(`📥 Sent answer to ${data.from}`);
      }
    });

    // Incoming WebRTC answer from peer
    signalingClient.on('answer', async (data) => {
      console.log(`📥 Received answer from ${data.from}`);
      
      const peerConnection = webrtcManager.getPeerConnection(data.from);
      if (peerConnection) {
        const remoteDesc = new RTCSessionDescription(data.answer);
        await peerConnection.setRemoteDescription(remoteDesc);
        console.log(`✅ Connected with ${data.from}`);
      }
    });

    // ICE candidate for NAT traversal
    signalingClient.on('ice-candidate', async (data) => {
      const peerConnection = webrtcManager.getPeerConnection(data.from);
      if (peerConnection && data.candidate) {
        try {
          await peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
        } catch (error) {
          console.error('❌ ICE candidate error:', error);
        }
      }
    });

    // Peer media state changed (mute/unmute, camera on/off)
    signalingClient.on('media-state-changed', (data) => {
      const updatedParticipants = new Map(participants);
      const participant = updatedParticipants.get(data.from);
      
      if (participant) {
        participant.audioEnabled = data.audioEnabled;
        participant.videoEnabled = data.videoEnabled;
        updatedParticipants.set(data.from, participant);
        setParticipants(updatedParticipants);
        
        console.log(
          `🎤 ${data.username}: Audio ${data.audioEnabled ? '🔊' : '🔇'}, ` +
          `Video ${data.videoEnabled ? '📹' : '🚫'}`
        );
      }
    });

    // Screen sharing started
    signalingClient.on('screen-share-started', (data) => {
      console.log(`🖥️ ${data.username} started screen sharing`);
      
      const updatedParticipants = new Map(participants);
      const participant = updatedParticipants.get(data.from);
      if (participant) {
        participant.sharingScreen = true;
        updatedParticipants.set(data.from, participant);
        setParticipants(updatedParticipants);
      }
    });

    // Screen sharing stopped
    signalingClient.on('screen-share-stopped', (data) => {
      console.log(`⏹️ ${data.username} stopped screen sharing`);
      
      const updatedParticipants = new Map(participants);
      const participant = updatedParticipants.get(data.from);
      if (participant) {
        participant.sharingScreen = false;
        updatedParticipants.set(data.from, participant);
        setParticipants(updatedParticipants);
      }
    });

    // Error from server
    signalingClient.on('server-error', (data) => {
      console.error(`❌ Server error: ${data.message}`);
    });
  };

  // ========================================================================
  // 4. CREATE PEER CONNECTIONS
  // ========================================================================

  const createPeerConnection = async (
    localStream: MediaStream,
    peerId: string,
    initiator: boolean // true if we should send offer
  ) => {
    console.log(`🔗 Creating peer connection with ${peerId} (${initiator ? 'initiator' : 'receiver'})`);

    // Create peer connection
    const peerConnection = await webrtcManager.createPeerConnection(peerId);

    // Add local tracks to connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle incoming remote tracks
    peerConnection.ontrack = (event) => {
      console.log(`📹 Received remote stream from ${peerId}`);
      
      const updatedParticipants = new Map(participants);
      updatedParticipants.set(peerId, {
        socketId: peerId,
        stream: event.streams[0],
        audioEnabled: true,
        videoEnabled: true,
        sharingScreen: false
      });
      setParticipants(updatedParticipants);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        signalingClient.sendIceCandidate(peerId, event.candidate);
      }
    };

    // Monitor connection state
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔌 Connection state with ${peerId}: ${peerConnection.connectionState}`);
    };

    // If we're the initiator, create and send offer
    if (initiator) {
      console.log(`📤 Creating offer for ${peerId}...`);
      try {
        const offer = await peerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });
        
        await peerConnection.setLocalDescription(offer);
        
        signalingClient.sendOffer(peerId, {
          type: 'offer',
          sdp: offer.sdp || ''
        });
        console.log(`✅ Offer sent to ${peerId}`);
      } catch (error) {
        console.error('❌ Offer creation error:', error);
      }
    }
  };

  // ========================================================================
  // 5. MEDIA CONTROLS
  // ========================================================================

  const handleToggleAudio = async () => {
    if (!localStream) return;

    const newState = !audioEnabled;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = newState;
    });
    
    setAudioEnabled(newState);
    signalingClient.notifyMediaStateChanged(newState, videoEnabled);
    console.log(`🔊 Audio ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleToggleVideo = async () => {
    if (!localStream) return;

    const newState = !videoEnabled;
    localStream.getVideoTracks().forEach(track => {
      track.enabled = newState;
    });
    
    setVideoEnabled(newState);
    signalingClient.notifyMediaStateChanged(audioEnabled, newState);
    console.log(`📹 Video ${newState ? 'enabled' : 'disabled'}`);
  };

  const handleScreenShare = async () => {
    try {
      console.log('🖥️ Starting screen share...');
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always'
        },
        audio: false
      });

      // Replace video track in all peer connections with screen track
      const screenTrack = screenStream.getVideoTracks()[0];
      
      // Broadcast screen share started
      signalingClient.notifyScreenShareStarted(screenStream);

      // Handle when screen share stops
      screenTrack.onended = () => {
        console.log('⏹️ Screen share stopped');
        signalingClient.notifyScreenShareStopped();
        
        // Switch back to camera
        if (localStream) {
          handleToggleVideo(); // Reset camera
        }
      };

      console.log('✅ Screen sharing started');
    } catch (error) {
      console.error('❌ Screen share error:', error);
    }
  };

  const handleLeaveRoom = () => {
    console.log('👋 Leaving room...');
    
    // Stop all tracks
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Leave signaling room
    signalingClient.leaveRoom();

    // Navigate back
    window.location.href = '/live-classes';
  };

  // ========================================================================
  // 6. RENDER UI
  // ========================================================================

  return (
    <div className="video-room">
      {/* Status Header */}
      <div className="status-bar">
        <span>
          {isConnected ? '✅ Connected' : '❌ Disconnected'} 
          · {participants.size + 1} participants
        </span>
      </div>

      {/* Local Video Preview */}
      <div className="local-preview">
        <video
          autoPlay
          muted
          playsInline
          srcObject={localStream}
          className="video-element"
        />
        <div className="overlay">You</div>
      </div>

      {/* Remote Participants Grid */}
      <div className="participants-grid">
        {Array.from(participants.entries()).map(([socketId, participant]) => (
          <video
            key={socketId}
            autoPlay
            playsInline
            srcObject={participant.stream}
            className="video-element"
          />
        ))}
      </div>

      {/* Media Controls */}
      <div className="controls-bar">
        <button
          onClick={handleToggleAudio}
          className={audioEnabled ? 'button active' : 'button muted'}
        >
          {audioEnabled ? '🔊' : '🔇'} Mic
        </button>

        <button
          onClick={handleToggleVideo}
          className={videoEnabled ? 'button active' : 'button muted'}
        >
          {videoEnabled ? '📹' : '🚫'} Camera
        </button>

        <button
          onClick={handleScreenShare}
          className="button"
        >
          🖥️ Share Screen
        </button>

        <button
          onClick={handleLeaveRoom}
          className="button danger"
        >
          ❌ Leave
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 7. TYPES & INTERFACES
// ============================================================================

interface RemoteParticipant {
  socketId: string;
  stream: MediaStream;
  audioEnabled: boolean;
  videoEnabled: boolean;
  sharingScreen: boolean;
}

// ============================================================================
// 8. HELPER FUNCTIONS
// ============================================================================

async function getCurrentUser() {
  // Your authentication method
  return {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com'
  };
}

// ============================================================================
// USAGE NOTES
// ============================================================================

/**
 * Flow Summary:
 * 
 * 1. Component mounts → Connect WebSocket
 * 2. Get local media stream (camera + microphone)
 * 3. Setup event handlers
 * 4. Join video room
 * 5. Server sends list of existing participants
 * 6. Create peer connections and exchange offers/answers
 * 7. Handle incoming remote streams
 * 8. Users can toggle media and share screen
 * 9. On unmount → cleanup and disconnect
 *
 * Error Handling:
 * - Camera/microphone permission denied → Show permission dialog
 * - WebSocket connection failed → Show connection error
 * - Peer connection failed → Retry or show error
 * - Network error → Auto-reconnect via signalingClient
 *
 * Performance Tips:
 * - Lazy load peer connections (only create when needed)
 * - Use adaptive video resolution based on network
 * - Monitor connection state and handle disconnections
 * - Batch participant updates instead of individual events
 * - Implement connection pooling for better resource usage
 */

/**
 * Testing:
 * 
 * 1. Open first browser tab
 *    → Navigate to room
 *    → Should see "Connected" status
 *    → Local video should show camera feed
 *
 * 2. Open second browser tab
 *    → Navigate to same room as different user
 *    → First tab should update to show 2 participants
 *    → Second tab should show first user's video
 *
 * 3. Toggle media controls
 *    → Mute button should disable audio track
 *    → Camera button should disable video track
 *    → Other users should see your status change
 *
 * 4. Share screen
 *    → Select screen source
 *    → Your video should be replaced with screen
 *    → Stop sharing → back to camera
 *
 * 5. Leave room
 *    → Should disconnect WebSocket
 *    → Should stop all media tracks
 *    → Should navigate away
 */

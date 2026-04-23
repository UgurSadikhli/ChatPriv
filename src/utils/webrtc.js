export const createPeer = () => {

  const USERNAME = process.env.REACT_APP_USERNAME ;
  const CREDENTIALS = process.env.REACT_APP_CREDENTIALS ;
  const URL1 = process.env.REACT_APP_URL1 ;
  const URL2 = process.env.REACT_APP_URL2 ;
  const URL3 = process.env.REACT_APP_URL3 ;
  const URL4 = process.env.REACT_APP_URL4 ;
  const URL5 = process.env.REACT_APP_URL5 ;

  const peer = new RTCPeerConnection({
    iceServers: [
          {
        urls: URL1,
      },
      {
        urls: URL2,
        username: USERNAME,
        credential: CREDENTIALS,
      },
      {
        urls: URL3,
        username: USERNAME,
        credential: CREDENTIALS,
      },
      {
        urls: URL4,
        username: USERNAME,
        credential: CREDENTIALS,
      },
      {
        urls: URL5,
        username: USERNAME,
        credential: CREDENTIALS,
      },

    ],
    iceCandidatePoolSize: 10,
  });

  peer.onicecandidate = (e) => {
    if (e.candidate) {
      const c = e.candidate;
      // console.log(`[${c.type}] ${c.protocol} ${c.address}:${c.port}`);
    } else {
      // console.log("ICE gathering done (null candidate)");
    }
  };

  peer.onicegatheringstatechange = () => {
    // console.log(" ICE Gathering State:", peer.iceGatheringState);
    if (peer.iceGatheringState === "complete") {
      const sdp = peer.localDescription?.sdp || "";
      const candidates = sdp.match(/a=candidate:.+/g) || [];
      // console.log("Candidates in SDP:", candidates.length);
      // candidates.forEach((c) => console.log(" ", c));

      const hasRelay = candidates.some((c) => c.includes("relay"));
      // console.log(hasRelay ? " TURN relay candidates present" : " NO relay candidates — TURN is not working");
    }
  };

  peer.oniceconnectionstatechange = () => {
    // console.log("ICE Connection State:", peer.iceConnectionState);
  };

  peer.onconnectionstatechange = () => {
    // console.log(" Connection State:", peer.connectionState);
  };

  return peer;
};

export const encode = (data) => btoa(JSON.stringify(data));
export const decode = (data) => JSON.parse(atob(data));
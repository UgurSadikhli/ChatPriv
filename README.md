<h1 align="left">
  <img src="https://github.com/user-attachments/assets/7f07f0c3-5c37-4aef-844b-4b06256f2a6d" width="40" style="vertical-align: middle;" />
  ChatPriv
</h1>


**ChatPriv** is a ultra-secure, serverless peer-to-peer (P2P) messaging platform. It eliminates the middleman by using WebRTC to establish direct connections between browsers, ensuring your data never touches a central server.

## Key Features

* **100% Serverless:** No backend database. Messages exist only in the RAM of the connected peers.
* **WebRTC P2P:** Direct browser-to-browser communication for ultra-low latency and maximum privacy.
* **End-to-End Obfuscation:** Payloads are processed through an additional XOR security layer before transmission.
* **Voice Notes:** Integrated P2P audio recording and playback with custom UI.
* **Self-Destructing Sessions:** Closing the tab or clicking "Destroy Session" wipes all traces of the conversation forever.
* **No Metadata:** Since there is no central signaling server, no one can track *who* you talked to or *when*.

## How It Works

1.  **Initialize:** The Host generates a secure Invite Link.
2.  **Handshake:** The Joiner uses the link to generate a Response Token.
3.  **Connect:** Once the Host applies the Response Token, a direct "Steel Tunnel" is created between both devices.
4.  **Chat:** Exchange text and voice notes with complete peace of mind.

## Built With

* [React.js](https://reactjs.org/) - Frontend framework
* [WebRTC](https://webrtc.org/) - Real-time communication protocol
* [Metered.ca](https://www.metered.ca/) - Global TURN/STUN relay for NAT traversal

## Installation & Setup

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/your-username/chatpriv.git](https://github.com/your-username/chatpriv.git)
    cd chatpriv
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add your Metered.ca credentials:
    ```text
    REACT_APP_USERNAME=your_username
    REACT_APP_CREDENTIALS=your_secret_credential
    REACT_APP_URL1=url
    REACT_APP_URL2=url2
    ...
    REACT_APP_URL5=url5<img width="452" height="503" alt="logo192" src="https://github.com/user-attachments/assets/c06c8388-3ded-4108-ab4a-27757b76d437" />

    ```

4.  **Start the app:**
    ```bash
    npm start
    ```

## Privacy Policy
ChatPriv does not collect, store, or share any personal data. It does not use cookies or tracking scripts. All communication is strictly between the two connected peers.

---

Crypto Crash
============ 

Crypto Crash is a real-time, cryptocurrency-themed crash gambling game built with Node.js, Express, MongoDB, and Socket.IO. Players place bets in USD, converted to BTC or ETH using live CoinGecko API prices, and aim to cash out before a randomly determined crash point. The game features a provably fair algorithm, real-time WebSocket updates, and a responsive frontend UI.

Features
--------

-   **Crash Game Mechanics**: Bet, watch the multiplier rise, and cash out before the crash.
-   **Cryptocurrency Integration**: Real-time BTC/ETH prices from CoinGecko, with wallet and transaction management.
-   **WebSocket Real-Time Updates**: Multiplier, round status, and cash-out events broadcast instantly.
-   **Provably Fair**: Transparent, verifiable crash point generation.
-   **Responsive UI**: Sleek, Tailwind CSS-based frontend for desktop and mobile.

Prerequisites
-------------

-   **Node.js** (v14 or higher): [Download](https://nodejs.org/)
-   **MongoDB** (v7.0): [Download](https://www.mongodb.com/try/download/community)
-   **Git**: For cloning the repository
-   **Postman**: Optional, for API testing
-   Internet connection for CoinGecko API

Setup Instructions
------------------

### 1\. Clone the Repository

```
git clone <repository-url>
cd crypto-crash-backend

```

### 2\. Install Dependencies

```
npm install

```

Installs Express, Socket.IO, Mongoose, Axios, and other dependencies listed in `package.json`.

### 3\. Set Up MongoDB

-   Install MongoDB and ensure it's running:

    ```
    cd "C:\Program Files\MongoDB\Server\7.0\bin"
    mongod --dbpath C:\mongodb-data

    ```

-   Create a data directory (e.g., `C:\mongodb-data`) before running `mongod`.
-   Verify connection with `mongosh`:

    ```
    mongosh

    ```

### 4\. Configure CoinGecko API

-   **No API Key Required**: The project uses CoinGecko's free API endpoint:

    ```
    https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd

    ```

-   **Rate Limits**: CoinGecko allows ~50 requests/minute. The backend caches prices every 10 seconds to avoid limits.
-   **Error Handling**: If API calls fail, cached prices are used. Check server logs for `Error fetching crypto prices`.

### 5\. Populate the Database

Run the provided `populate.js` script to create sample players:

```
node populate.js

```

-   Creates 3 players with BTC/ETH wallets:
    -   Player 1: 0.001 BTC, 0.01 ETH
    -   Player 2: 0.002 BTC, 0.02 ETH
    -   Player 3: 0.003 BTC, 0.03 ETH
-   Outputs player IDs (e.g., `68187f4cec9313b87dbd6ee5`). Save these for testing.
-   Verify in `mongosh`:

    ```
    use crypto-crash
    db.players.find().pretty()

    ```

### 6\. Start the Server

```
node app.js

```

-   Runs on `http://localhost:3000`.
-   Serves the frontend at `http://localhost:3000/index.html`.
-   Connects to MongoDB (`mongodb://localhost/crypto-crash`) and CoinGecko.

### 7\. Test the Application

-   **Frontend**: Open `http://localhost:3000/index.html` in a browser.
-   **API**: Use Postman or cURL (see below).
-   **WebSocket**: Interact via the frontend (cash out, view logs).

API Endpoints
-------------

### POST /bets

-   **Description**: Place a bet during the betting phase.
-   **Method**: POST
-   **URL**: `http://localhost:3000/bets`
-   **Request Body**:

    ```
    {
      "player_id": "68187f4cec9313b87dbd6ee5",
      "usd_amount": 10,
      "currency": "BTC"
    }

    ```

-   **Response (Success)**:

    ```
    {
      "message": "Bet placed",
      "bet": {
        "player_id": "68187f4cec9313b87dbd6ee5",
        "usd_amount": 10,
        "currency": "BTC",
        "crypto_amount": 0.00010571271512537528
      }
    }

    ```

-   **Response (Error)**:

    ```
    { "message": "No betting round active" }

    ```

-   **Notes**: Run during the 10-second betting phase (watch server logs).

### GET /wallet/:player_id

-   **Description**: Retrieve a player's wallet balances.
-   **Method**: GET
-   **URL**: `http://localhost:3000/wallet/68187f4cec9313b87dbd6ee5`
-   **Response**:

    ```
    {
      "player_id": "68187f4cec9313b87dbd6ee5",
      "wallets": [
        {
          "currency": "BTC",
          "balance": 0.0028942872848746247,
          "usd_equivalent": 273.8
        },
        {
          "currency": "ETH",
          "balance": 0.03,
          "usd_equivalent": 90
        }
      ]
    }

    ```

WebSocket Events
----------------

### betting_start

-   **Description**: Signals the start of a 10-second betting phase.
-   **Payload**:

    ```
    {
      "round_id": "681888849659f18bdaa4675b"
    }

    ```

-   **Client Action**: Update status to "Betting Phase", reset multiplier to 1.00, disable cash-out.

### round_start

-   **Description**: Signals the start of the round (multiplier begins rising).
-   **Payload**: None
-   **Client Action**: Update status to "Round Running", enable cash-out if bet placed.

### multiplier_update

-   **Description**: Updates the current multiplier.
-   **Payload**:

    ```
    {
      "multiplier": 1.80
    }

    ```

-   **Client Action**: Update multiplier display.

### round_crash

-   **Description**: Signals the round has crashed.
-   **Payload**:

    ```
    {
      "crash_point": 43.61,
      "seed": "<random-seed>",
      "seed_hash": "<sha256-hash>"
    }

    ```

-   **Client Action**: Update status to "Round Crashed", show crash point, disable cash-out.

### cashout_success

-   **Description**: Confirms a player's cash-out.
-   **Payload**:

    ```
    {
      "player_id": "68187f4cec9313b87dbd6ee5",
      "multiplier": 2.00,
      "payout_usd": 20
    }

    ```

-   **Client Action**: Log cash-out, disable cash-out button.

### Client-Emitted Event: cashout

-   **Description**: Request to cash out.
-   **Payload**:

    ```
    {
      "player_id": "68187f4cec9313b87dbd6ee5"
    }

    ```

Provably Fair Crash Algorithm
-----------------------------

-   **Overview**: Ensures crash points are random and verifiable, preventing manipulation.
-   **Implementation**:
    -   **Seed Generation**: At round start, a random server seed is generated (e.g., UUID or random string).
    -   **Hashing**: The seed is hashed with SHA-256 to create a `seed_hash`, shared with clients before the round.
    -   **Crash Point Calculation**: A pseudo-random number is derived from the seed using a deterministic function (e.g., simplified for demo):

        ```
        function calculateCrashPoint(seed) {
          const hash = crypto.createHash('sha256').update(seed).digest('hex');
          const num = parseInt(hash.substr(0, 8), 16) / 0xffffffff;
          return Math.max(1, 1 / (1 - num)); // Geometric distribution
        }

        ```

    -   **Fairness**: After the crash, the server reveals the `seed` and `seed_hash`. Clients can verify:

        ```
        const crypto = require('crypto');
        const seed = "<revealed-seed>";
        const hash = crypto.createHash('sha256').update(seed).digest('hex');
        // Compare with seed_hash

        ```

-   **Transparency**: Players can independently calculate the crash point using the revealed seed, ensuring the server cannot cheat.

USD-to-Crypto Conversion Logic
------------------------------

-   **Price Fetching**:
    -   The CoinGecko API (`https://api.coingecko.com/api/v3/simple/price`) provides BTC/ETH prices in USD every 10 seconds.
    -   Prices are cached to handle rate limits and API failures.
-   **Conversion**:
    -   For a bet: `crypto_amount = usd_amount / current_price`.
        -   Example: $10 at $94,600/BTC = 0.00010571271512537528 BTC.
    -   For wallet display: `usd_equivalent = crypto_balance * current_price`.
-   **Atomicity**:
    -   MongoDB transactions ensure balance updates (deduct bet, add cash-out) are atomic.
    -   Transaction logs (`db.transactionlogs`) record bets and cash-outs for consistency.

Game Logic Approach
-------------------

-   **Core Mechanics**:
    -   **Betting Phase** (10s): Players place bets via `POST /bets`.
    -   **Round Phase**: Multiplier rises exponentially (e.g., 1.00x to 43.61x) until a provably fair crash.
    -   **Cash-Out**: Players cash out via WebSocket (`cashout` event) to multiply their bet.
-   **State Management**:
    -   MongoDB stores players (`db.players`), rounds (`db.gamerounds`), and transactions (`db.transactionlogs`).
    -   `GameService` manages round state, emitting events via Socket.IO.
-   **Crypto Integration**:
    -   Real-time prices enable USD-to-crypto bets and wallet updates.
    -   MongoDB ensures consistent balance updates.
-   **WebSockets**:
    -   Socket.IO broadcasts round events to all clients.
    -   Scales for multiple players with reliable cash-out handling.
-   **Performance**:
    -   Multiplier updates every 100ms for smooth UI.
    -   Cached prices reduce API calls.
    -   MongoDB indexes optimize queries.

Testing
-------

### cURL Commands

-   **Place Bet**:

    ```
    curl -X POST http://localhost:3000/bets -H "Content-Type: application/json" -d '{"player_id": "68187f4cec9313b87dbd6ee5", "usd_amount": 10, "currency": "BTC"}'

    ```

-   **Get Wallet**:

    ```
    curl http://localhost:3000/wallet/68187f4cec9313b87dbd6ee5

    ```

### Postman Collection

-   A Postman collection (`crypto-crash.postman_collection.json`) is included in the repository.
-   Import into Postman and test `POST /bets` and `GET /wallet/:player_id`.

### WebSocket Client

-   Access `http://localhost:3000/index.html`.
-   Features a Tailwind CSS UI with real-time multiplier, cash-out, and logs.
-   Edit `public/index.html` to set `playerId`.

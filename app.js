const express = require("express");
const app = express();
app.use(express.json());

const sqlite3 = require("sqlite3");
const { open } = require("sqlite");

const path = require("path");
const db_path = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  db = await open({ filename: db_path, driver: sqlite3.Database });
  app.listen(3000, () => {
    try {
      console.log("server running at http://localhost:3000");
    } catch (error) {
      console.log(`DB ERROR ${error.message}`);
      process.exit(1);
    }
  });
};
initializeDbAndServer();

const convertDbResponseObjectToCamelCasePlayerObject = (object) => {
  return {
    playerId: object.player_id,
    playerName: object.player_name,
  };
};

const convertDbResponseObjectToCamelCaseMatchObject = (object) => {
  return {
    matchId: object.match_id,
    match: object.match,
    year: object.year,
  };
};

const convertDbResponseObjectToCamelCasePlayerDetailsObject = (object) => {
  return {
    score: object.score,
    fours: object.fours,
    sixes: object.sixes,
    playerName: object.player_name,
  };
};

//API 1 GET
app.get("/players/", async (request, response) => {
  try {
    const Query = `
        SELECT
            *
        FROM
            player_details
        ORDER BY
            player_id;`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCasePlayerObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 2 GET
app.get("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const Query = `
            SELECT
                *
            FROM
                player_details
            WHERE
                player_id=${playerId};`;
    let dbResponse = await db.get(Query);
    dbResponse = Array(dbResponse);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCasePlayerObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results[0]);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 3 PUT
app.put("/players/:playerId/", async (request, response) => {
  try {
    const { playerId } = request.params;
    const districtDetails = request.body;
    const { playerName } = districtDetails;
    const Query = `
        UPDATE
            player_details
        SET
           player_name="${playerName}"
        WHERE
            player_id=${playerId};`;
    await db.run(Query);
    response.send("Player Details Updated");
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 4 GET
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  try {
    const Query = `
                SELECT
                    *
                FROM
                    match_details
                WHERE
                    match_id=${matchId};`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseMatchObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results[0]);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 5 GET
app.get("/players/:playerId/matches", async (request, response) => {
  try {
    const { playerId } = request.params;
    const Query = `
        SELECT
        *
        FROM
        player_match_score
        INNER JOIN match_details ON player_match_score.match_id=match_details.match_id
        WHERE
        player_id=${playerId};`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCaseMatchObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 6 GET
app.get("/matches/:matchId/players", async (request, response) => {
  try {
    const { matchId } = request.params;
    const Query = `
        SELECT
        *
        FROM
        player_match_score
        INNER JOIN player_details ON player_match_score.player_id=player_details.player_id
        WHERE
        match_id=${matchId};`;
    const dbResponse = await db.all(Query);
    let results = [];
    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCasePlayerObject(
        dbResponse[i]
      );
      results.push(resObject);
    }
    response.send(results);
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

//API 7 GET
app.get("/players/:playerId/playerScores", async (request, response) => {
  try {
    const { playerId } = request.params;
    const Query = `
            SELECT
                *
            FROM
                player_match_score
            INNER JOIN player_details ON player_match_score.player_id=player_details.player_id
            WHERE
                player_details.player_id= ${playerId};`;
    const dbResponse = await db.all(Query);
    let totalScore = 0;
    let totalFours = 0;
    let totalSixes = 0;
    let Name = null;

    for (let i = 0; i < dbResponse.length; i++) {
      let resObject = convertDbResponseObjectToCamelCasePlayerDetailsObject(
        dbResponse[i]
      );
      totalScore += resObject.score;
      totalFours += resObject.fours;
      totalSixes += resObject.sixes;
      Name = resObject.playerName;
    }

    response.send({
      playerId: parseInt(playerId),
      playerName: `${Name}`,
      totalScore: totalScore,
      totalFours: totalFours,
      totalSixes: totalSixes,
    });
  } catch (error) {
    console.log(`ERROR API ${error.message}`);
  }
});

module.exports = app;
